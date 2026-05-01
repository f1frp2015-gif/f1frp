import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
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

  // P2-⑥ geo filter: hide articles flagged for the OTHER side
  // (e.g. 国内补贴解读 with forEn=false won't surface on getfrp.com)
  const geoFilter = locale === "en"
    ? eq(articles.forEn, true)
    : eq(articles.forZh, true);

  const rows = await db
    .select()
    .from(articles)
    .where(geoFilter)
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt));

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
