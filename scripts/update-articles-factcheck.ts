// In-place update of the 9 news-derived article rows after the 2026-06-16
// fact-check + de-AI rewrite. Matches each row by its STABLE slug (kept
// unchanged in news.ts) so no URL changes / no 301s / no duplicate rows.
// Updates only title / excerpt / body / category / readTime / hot / publishedAt.
// Leaves slug, authorId, forZh, forEn, coverUrl, bodyEn, titleEn, excerptEn
// untouched. Read-only against every other table.
//
// Run: pnpm tsx --env-file=.env.local scripts/update-articles-factcheck.ts
//   add --dry to only report which slugs match (no writes).

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
import { articles } from "../src/lib/db/schema";
import { newsList } from "../src/lib/data/news";
import { articleBodies } from "../src/lib/data/article-bodies";

const DRY = process.argv.includes("--dry");

async function main() {
  console.log(DRY ? "🔎 DRY RUN (no writes)\n" : "✍️  Updating articles in place\n");
  let matched = 0;
  let missing = 0;

  for (const n of newsList) {
    const [existing] = await db
      .select({ id: articles.id, slug: articles.slug })
      .from(articles)
      .where(eq(articles.slug, n.slug));

    if (!existing) {
      missing++;
      console.log(`❌ #${n.id} NO ROW for slug: ${n.slug}`);
      continue;
    }
    matched++;
    const body = articleBodies[n.id] ?? n.summary;

    if (DRY) {
      console.log(
        `✔️  #${n.id} would update (bodyLen=${body.length}) → ${n.title}`,
      );
      continue;
    }

    await db
      .update(articles)
      .set({
        title: n.title,
        excerpt: n.summary,
        body,
        category: n.category,
        readTime: n.readTime,
        hot: !!n.hot,
        publishedAt: n.date ? new Date(n.date) : null,
        updatedAt: new Date(),
      })
      .where(eq(articles.slug, n.slug));
    console.log(`✅ #${n.id} updated → ${n.title}`);
  }

  console.log(
    `\n${DRY ? "DRY: " : ""}matched ${matched}/${newsList.length}` +
      (missing ? `, MISSING ${missing} (check slugs!)` : ", all slugs present"),
  );
}

main()
  .catch((e) => {
    console.error("❌ update failed:", e);
    process.exit(1);
  })
  .then(() => process.exit(0));
