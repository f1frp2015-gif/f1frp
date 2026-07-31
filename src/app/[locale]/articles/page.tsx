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
import { alternates } from "@/lib/seo";
import { ProgressiveCollapse } from "@/components/progressive-collapse";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Articles" });
  let articleCount = 0;
  if (locale === "en") {
    try {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(
          and(
            eq(articles.forEn, true),
            isNotNull(articles.publishedAt),
            isNotNull(articles.titleEn),
            ne(articles.titleEn, ""),
          ),
        );
      articleCount = row?.count ?? 0;
    } catch {
      articleCount = 0;
    }
  }
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/articles"),
    ...(locale === "en" && articleCount < 3
      ? { robots: { index: false, follow: true } }
      : {}),
  };
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
  // publishedAt IS NULL = 草稿(在管理员草稿箱里, 不对外展示)。
  const filter = isEn
    ? and(
        eq(articles.forEn, true),
        isNotNull(articles.publishedAt),
        isNotNull(articles.titleEn),
        ne(articles.titleEn, ""),
        sql`${articles.slug} ~ '^[\\x00-\\x7F]+$'`,
      )
    : and(eq(articles.forZh, true), isNotNull(articles.publishedAt));

  const rowsRaw = await (async () => {
    try {
      return await db
        .select()
        .from(articles)
        .where(filter)
        .orderBy(desc(articles.publishedAt), desc(articles.createdAt));
    } catch {
      return [];
    }
  })();

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
        isEn ? (
          <div className="max-w-4xl">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-6 sm:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                EDITORIAL DESK IN PREPARATION
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Evidence-led FRP sourcing insights are coming soon.
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-7 text-muted-foreground">
                <p>
                  getfrp is preparing an English editorial library for engineers,
                  procurement leads and import teams sourcing fibre-reinforced
                  polymer products from China. The first articles will focus on
                  decisions that change a real RFQ: how to compare factory
                  capability, how Chinese GB methods relate to ASTM, ISO and EN
                  requirements, and how to identify documentation gaps before a
                  sample or production order is placed.
                </p>
                <p>
                  The library will not be a stream of generic composites news.
                  Planned articles will connect standards, materials, factory
                  clusters, inspection methods and trade exposure to specific
                  sourcing tasks. Early topics include EN 13706 evidence for
                  pultruded profiles, ACI 440 questions for FRP rebar, chemical
                  compatibility for vinyl-ester systems, grating fire reports,
                  pre-shipment inspection design and the difference between a
                  certificate logo and a certificate whose scope actually covers
                  the product being quoted.
                </p>
                <p>
                  Every published article must have a clear buyer question,
                  attributable sources and an editorial review date. Market or
                  regulatory claims will be linked to current primary evidence
                  where available. Technical comparisons will state when two test
                  methods are analogous but not interchangeable. Supplier claims
                  will remain anonymous until they belong inside a matched RFQ,
                  preserving the same accountable-desk model used by the
                  directory.
                </p>
                <p>
                  We are keeping this page out of search results until at least
                  three complete English articles are live. That threshold gives
                  readers a useful starting set and prevents an empty archive
                  from competing with the supplier, standards and material pages
                  that already answer active search intent.
                </p>
                <p>
                  Subscribe to receive the launch issue and the weekly FRP
                  sourcing brief. It will cover newly verified capabilities,
                  standards changes, practical QA checks and material or freight
                  signals relevant to overseas buyers—one concise email, with no
                  directory spam.
                </p>
              </div>
            </div>
            <NewsletterSignup topic="articles-launch" className="mt-8" />
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {t("noArticles")}
            </CardContent>
          </Card>
        )
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
