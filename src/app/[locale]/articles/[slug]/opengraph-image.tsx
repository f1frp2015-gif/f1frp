import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "f1frp news";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

const CATEGORY_LABEL_ZH: Record<string, string> = {
  industry: "行业动态",
  policy: "政策法规",
  tech: "技术前沿",
  company: "企业新闻",
  expo: "展会活动",
};

const CATEGORY_LABEL_EN: Record<string, string> = {
  industry: "Industry",
  policy: "Policy",
  tech: "Technology",
  company: "Company news",
  expo: "Expos & events",
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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  const isEn = locale === "en";
  const labels = isEn ? CATEGORY_LABEL_EN : CATEGORY_LABEL_ZH;
  const slug = safeDecode(rawSlug);
  const [row] = await db
    .select({ article: articles, author: authors })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(eq(articles.slug, slug))
    .limit(1);
  if (!row) {
    return renderOgCard({
      category: isEn ? "News" : "资讯",
      title: isEn ? "Article not found" : "文章未找到",
      subtitle: "f1frp.com",
    });
  }
  const a = row.article;
  const fallbackCat = isEn ? "News" : "资讯";
  const cat = a.category ? labels[a.category] ?? a.category : fallbackCat;
  const dateStr = a.publishedAt
    ? a.publishedAt.toISOString().slice(0, 10)
    : "";
  const fallbackAuthor = isEn ? "f1frp Editorial" : "复材站编辑部";
  const meta = [row.author?.name ?? fallbackAuthor, dateStr]
    .filter(Boolean)
    .join(" · ");
  return renderOgCard({
    category: `${fallbackCat} · ${cat}`,
    title: a.title,
    subtitle: a.excerpt ?? undefined,
    meta: meta || undefined,
  });
}
