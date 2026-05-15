import type { Metadata } from "next";
import { and, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { ProgressiveCollapse } from "@/components/progressive-collapse";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Articles" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Articles" });
  const isEn = locale === "en";

  // EN 侧: forEn=true + 必须有英文标题 + slug 必须 ASCII (避免详情页 URL 编码后被
  // Google 识别为低质量)。任何缺一就在 EN 站隐藏, 不向中文 fallback。
  const filter = isEn
    ? and(
        eq(articles.forEn, true),
        isNotNull(articles.titleEn),
        ne(articles.titleEn, ""),
        sql`${articles.slug} ~ '^[\\x00-\\x7F]+$'`,
      )
    : eq(articles.forZh, true);

  const rowsRaw = await db
    .select()
    .from(articles)
    .where(filter)
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt));

  const rows = rowsRaw.map((a) => ({
    ...a,
    title: isEn ? a.titleEn ?? "" : a.title,
    excerpt: isEn ? a.excerptEn ?? null : a.excerpt ?? null,
    body: isEn ? a.bodyEn ?? null : a.body ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("subtitle", { date: formatDate(rows[0]?.publishedAt ?? null) })}
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {t("noArticles")}
          </CardContent>
        </Card>
      ) : (
        <ProgressiveCollapse className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" pageSize={50}>
          {rows.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}` as "/articles/[slug]"}
              className="block"
            >
              <Card className="h-full flex flex-col transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {a.category && (
                      <Badge variant="outline" className="text-xs">
                        {t(`categories.${a.category as "industry" | "policy" | "tech" | "company" | "expo"}` as const) ?? a.category}
                      </Badge>
                    )}
                    {a.hot && (
                      <Badge variant="destructive" className="text-xs">{t("hot")}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base leading-snug line-clamp-2">
                    {a.title}
                  </CardTitle>
                  {a.excerpt && (
                    <CardDescription className="line-clamp-3">
                      {a.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(a.publishedAt)}</span>
                    {a.readTime && <span>{t("readTime", { time: a.readTime })}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </ProgressiveCollapse>
      )}
    </div>
  );
}
