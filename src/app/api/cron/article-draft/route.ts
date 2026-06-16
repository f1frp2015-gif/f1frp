import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { makeSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Secured intake for the deep-research digest skill / scheduled routine.
// Inserts an article as a DRAFT (publishedAt = null) so it lands in the admin
// 草稿箱 for human review before publishing. Auth via CRON_SECRET (Bearer or
// ?secret=) so it works from any environment (local run or cloud routine)
// without DB credentials.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail-closed
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}

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

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const title = String(b.title ?? "").trim();
  const body = String(b.body ?? "").trim();
  if (!title || body.length < 200) {
    return NextResponse.json(
      { error: "title required and body must be >= 200 chars" },
      { status: 400 },
    );
  }

  const titleEn = b.titleEn ? String(b.titleEn).trim() : null;
  const bodyEn = b.bodyEn ? String(b.bodyEn).trim() : null;
  const excerpt = (b.excerpt ? String(b.excerpt) : body)
    .replace(/[#>*`\-\n]+/g, " ")
    .trim()
    .slice(0, 200);
  const excerptEn = b.excerptEn ? String(b.excerptEn).slice(0, 300) : null;
  const category = b.category ? String(b.category).slice(0, 50) : "industry";
  const readTime = b.readTime ? String(b.readTime).slice(0, 20) : null;
  const coverUrl = b.coverUrl ? String(b.coverUrl) : null;
  const tags = Array.isArray(b.tags)
    ? (b.tags as unknown[]).map((t) => String(t)).slice(0, 12)
    : null;
  // Draft defaults: visible to domestic (zh) on publish; overseas only if an
  // English body was supplied. Reviewer can flip these in the 草稿箱.
  const forZh = b.forZh === undefined ? true : !!b.forZh;
  const forEn = b.forEn === undefined ? !!bodyEn : !!b.forEn;

  const slug = b.slug
    ? await uniqueSlug(String(b.slug), title)
    : await uniqueSlug(titleEn ?? title, title);

  const authorId = await houseAuthorId();

  try {
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
        coverUrl,
        authorId,
        tags,
        readTime,
        hot: false,
        forZh,
        forEn,
        publishedAt: null, // DRAFT — appears in 草稿箱, not public
      })
      .returning({ id: articles.id, slug: articles.slug });

    return NextResponse.json({
      ok: true,
      id: row.id,
      slug: row.slug,
      status: "draft",
      adminUrl: `/dashboard/admin/articles/${row.id}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
