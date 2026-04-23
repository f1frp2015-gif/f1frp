import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "复材站资讯";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

const CATEGORY_LABEL: Record<string, string> = {
  industry: "行业动态",
  policy: "政策法规",
  tech: "技术前沿",
  company: "企业新闻",
  expo: "展会活动",
};

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const slug = safeDecode(params.slug);
  const [row] = await db
    .select({ article: articles, author: authors })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(eq(articles.slug, slug))
    .limit(1);
  if (!row) {
    return renderOgCard({
      category: "资讯",
      title: "文章未找到",
      subtitle: "f1frp.com",
    });
  }
  const a = row.article;
  const cat = a.category ? CATEGORY_LABEL[a.category] ?? a.category : "资讯";
  const dateStr = a.publishedAt
    ? a.publishedAt.toISOString().slice(0, 10)
    : "";
  const meta = [row.author?.name ?? "复材站编辑部", dateStr]
    .filter(Boolean)
    .join(" · ");
  return renderOgCard({
    category: `资讯 · ${cat}`,
    title: a.title,
    subtitle: a.excerpt ?? undefined,
    meta: meta || undefined,
  });
}
