import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { ArticleBody } from "@/components/article-body";
import { JsonLd } from "@/components/json-ld";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";

export const revalidate = 600;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function loadArticle(slug: string) {
  const [row] = await db
    .select({
      article: articles,
      author: authors,
    })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(eq(articles.slug, slug))
    .limit(1);
  return row;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug);
  const row = await loadArticle(slug);
  if (!row) {
    const t = await getTranslations({ locale, namespace: "Articles" });
    return { title: t("detail.notFound") };
  }
  return {
    title: row.article.title,
    description: row.article.excerpt ?? undefined,
  };
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Articles" });

  const slug = safeDecode(rawSlug);
  const row = await loadArticle(slug);
  if (!row) notFound();

  const { article: a, author } = row;

  const isEn = locale === "en";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt ?? undefined,
    inLanguage: isEn ? "en" : "zh-CN",
    datePublished: a.publishedAt?.toISOString(),
    dateModified: a.updatedAt?.toISOString(),
    author: author?.name
      ? { "@type": "Person", name: author.name }
      : {
          "@type": "Organization",
          name: isEn ? "f1frp Editorial" : "复材站编辑部",
        },
    publisher: {
      "@type": "Organization",
      name: isEn ? "f1frp" : "复材站",
      url: "https://f1frp.com",
    },
    mainEntityOfPage: `https://f1frp.com/articles/${encodeURIComponent(a.slug)}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: isEn ? "Home" : "首页", url: "https://f1frp.com/" },
          { name: t("detail.breadcrumb"), url: "https://f1frp.com/articles" },
          {
            name: a.title,
            url: `https://f1frp.com/articles/${encodeURIComponent(a.slug)}`,
          },
        ]}
      />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/articles" className="hover:text-foreground">{t("detail.breadcrumb")}</Link>
        <span className="mx-2">›</span>
        <span className="truncate">{a.title}</span>
      </nav>

      <div className="mb-4 flex items-center gap-2">
        {a.category && (
          <Badge variant="outline">
            {t(`categories.${a.category as "industry" | "policy" | "tech" | "company" | "expo"}` as const) ?? a.category}
          </Badge>
        )}
        {a.hot && <Badge variant="destructive">{t("detail.hot")}</Badge>}
      </div>

      <h1 className="text-3xl font-bold leading-tight">{a.title}</h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        {author?.name && <span>{author.name}</span>}
        <span>·</span>
        <span>{formatDate(a.publishedAt)}</span>
        {a.readTime && (
          <>
            <span>·</span>
            <span>{t("detail.readTime", { time: a.readTime })}</span>
          </>
        )}
      </div>

      {a.excerpt && (
        <p className="mt-6 border-l-4 border-muted pl-4 text-base leading-relaxed text-muted-foreground">
          {a.excerpt}
        </p>
      )}

      {a.body && (
        <div className="mt-8">
          <ArticleBody content={a.body} />
        </div>
      )}

      <aside className="mt-12 space-y-3 rounded-md border border-dashed bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 font-semibold text-foreground">{t("detail.disclaimerLabel")}</span>
          <div>
            {t("detail.disclaimer").split(t("detail.disclaimerEmail")).map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <a href={`mailto:${t("detail.disclaimerEmail")}`} className="text-primary hover:underline">
                    {t("detail.disclaimerEmail")}
                  </a>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
        </div>
      </aside>

      <div className="mt-8 flex items-center justify-between border-t pt-6 text-sm">
        <Link href="/articles" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("detail.back")}
        </Link>
        <span className="text-muted-foreground">
          {t("detail.editorial")}
        </span>
      </div>
    </article>
  );
}
