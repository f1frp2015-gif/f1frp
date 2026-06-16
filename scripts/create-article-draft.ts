// Insert a research-digest article as a DRAFT (publishedAt = null) so it lands
// in the admin 草稿箱 for human review. Used by the f1frp-research-digest skill.
//
// Usage: pnpm tsx --env-file=.env.local scripts/create-article-draft.ts <draft.json>
//   draft.json: { title, titleEn?, excerpt?, excerptEn?, body, bodyEn?,
//                 category?, slug?, tags?, readTime?, forZh?, forEn? }
// Prints the new article id + admin URL.

import { existsSync, readFileSync } from "node:fs";

for (const envPath of [".env.local", ".env"]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    let value = raw.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { articles, authors } from "../src/lib/db/schema";
import { makeSlug } from "../src/lib/slug";

async function houseAuthorId(): Promise<string | undefined> {
  const [existing] = await db
    .select({ id: authors.id })
    .from(authors)
    .where(eq(authors.name, "复材站编辑部"))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(authors)
    .values({ name: "复材站编辑部", title: "官方", bio: "复材站编辑部" })
    .onConflictDoNothing()
    .returning({ id: authors.id });
  return created?.id;
}

async function uniqueSlug(seed: string, fallback: string): Promise<string> {
  let slug = makeSlug(seed, fallback);
  const [hit] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  if (hit) slug = `${slug}-${Date.now().toString(36)}`;
  return slug.slice(0, 200);
}

async function main() {
  const path = process.argv[2];
  if (!path || !existsSync(path)) {
    console.error("usage: create-article-draft.ts <draft.json>");
    process.exit(1);
  }
  const d = JSON.parse(readFileSync(path, "utf-8"));
  const title = String(d.title ?? "").trim();
  const body = String(d.body ?? "").trim();
  if (!title || body.length < 200) {
    console.error("title required and body must be >= 200 chars");
    process.exit(1);
  }

  const titleEn = d.titleEn ? String(d.titleEn).trim() : null;
  const bodyEn = d.bodyEn ? String(d.bodyEn).trim() : null;
  const excerpt = (d.excerpt ? String(d.excerpt) : body)
    .replace(/[#>*`\-\n]+/g, " ")
    .trim()
    .slice(0, 200);
  const excerptEn = d.excerptEn ? String(d.excerptEn).slice(0, 300) : null;
  const category = d.category ? String(d.category).slice(0, 50) : "industry";
  const readTime = d.readTime ? String(d.readTime).slice(0, 20) : null;
  const tags = Array.isArray(d.tags)
    ? (d.tags as unknown[]).map((t) => String(t)).slice(0, 12)
    : null;
  const forZh = d.forZh === undefined ? true : !!d.forZh;
  const forEn = d.forEn === undefined ? !!bodyEn : !!d.forEn;

  const slug = d.slug
    ? await uniqueSlug(String(d.slug), title)
    : await uniqueSlug(titleEn ?? title, title);
  const authorId = await houseAuthorId();

  const [row] = await db
    .insert(articles)
    .values({
      slug,
      title: title.slice(0, 500),
      titleEn,
      excerpt,
      excerptEn,
      body,
      bodyEn,
      category,
      authorId,
      tags,
      readTime,
      hot: false,
      forZh,
      forEn,
      publishedAt: null, // DRAFT
    })
    .returning({ id: articles.id, slug: articles.slug });

  console.log(`✅ draft created: ${row.id}`);
  console.log(`   slug: ${row.slug}`);
  console.log(`   admin: /dashboard/admin/articles/${row.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ failed:", e);
    process.exit(1);
  });
