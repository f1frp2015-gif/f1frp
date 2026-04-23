import type { Metadata } from "next";
import { sql, desc, or, eq, ilike } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import {
  papers as papersTable,
  patents as patentsTable,
} from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 600;

// Match any of: pultrusion / 拉挤 / RTM / VARTM / 树脂传递 — cast wide and
// dedupe by id so we catch records the cron tagged `process` but that aren't
// really pultrusion-related too.
const KEYWORDS = ["拉挤", "pultrus", "pultrud", "RTM", "VARTM", "树脂传递"];

async function fetchPultrusionPapers(limit = 40) {
  const ors = KEYWORDS.flatMap((k) => [
    ilike(papersTable.title, `%${k}%`),
    ilike(papersTable.titleEn, `%${k}%`),
    ilike(papersTable.abstract, `%${k}%`),
    ilike(papersTable.commentary, `%${k}%`),
  ]);
  return db
    .select({
      id: papersTable.id,
      slug: papersTable.slug,
      title: papersTable.title,
      titleEn: papersTable.titleEn,
      journal: papersTable.journal,
      year: papersTable.year,
      category: papersTable.category,
      language: papersTable.language,
      hasCommentary: sql<boolean>`${papersTable.commentary} IS NOT NULL`,
    })
    .from(papersTable)
    .where(or(...ors))
    .orderBy(desc(papersTable.createdAt))
    .limit(limit);
}

async function fetchPultrusionPatents(limit = 40) {
  const ors = KEYWORDS.flatMap((k) => [
    ilike(patentsTable.title, `%${k}%`),
    ilike(patentsTable.titleEn, `%${k}%`),
    ilike(patentsTable.abstract, `%${k}%`),
  ]);
  return db
    .select({
      id: patentsTable.id,
      slug: patentsTable.slug,
      title: patentsTable.title,
      titleEn: patentsTable.titleEn,
      country: patentsTable.country,
      countryCode: patentsTable.countryCode,
      publicationNo: patentsTable.publicationNo,
      filingDate: patentsTable.filingDate,
      applicant: patentsTable.applicant,
      category: patentsTable.category,
      status: patentsTable.status,
    })
    .from(patentsTable)
    .where(or(...ors))
    .orderBy(desc(patentsTable.filingDate))
    .limit(limit);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pultrusion" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PultrusionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pultrusion");

  const [papers, patents] = await Promise.all([
    fetchPultrusionPapers(40),
    fetchPultrusionPatents(40),
  ]);

  const inLanguage = locale === "en" ? "en" : "zh-CN";
  const url = `https://f1frp.com/${locale === "zh" ? "" : `${locale}/`}pultrusion`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          url,
          inLanguage,
          name: t("h1"),
          description: t("metaDescription"),
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t("breadcrumbHome")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{t("h1")}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("label")}
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("h1")}
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>
      </header>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold tabular-nums">{papers.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("statPapers")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold tabular-nums">{patents.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("statPatents")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold tabular-nums">
              {papers.filter((p) => p.hasCommentary).length}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("statCommented")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold tabular-nums">
              {new Set(patents.map((p) => p.countryCode).filter(Boolean)).size}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("statCountries")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Papers */}
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("papersLabel")}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {t("papersTitle")}
            </h2>
          </div>
          <Link
            href="/papers"
            className="group inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("viewAll")}
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {papers.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {papers.map((p) => (
              <Link
                key={p.id}
                href={`/papers/${encodeURIComponent(p.slug ?? p.id)}` as never}
                className="block rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {p.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.category}
                    </Badge>
                  )}
                  {p.year && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.year}
                    </Badge>
                  )}
                  {p.language === "zh" && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("badgeChinese")}
                    </Badge>
                  )}
                  {p.hasCommentary && (
                    <Badge variant="signal" className="text-[10px]">
                      {t("badgeCommentary")}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium leading-snug line-clamp-2">
                  {locale === "en" && p.titleEn ? p.titleEn : p.title}
                </div>
                {p.journal && (
                  <div className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                    {p.journal}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Patents */}
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("patentsLabel")}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {t("patentsTitle")}
            </h2>
          </div>
          <Link
            href="/patents"
            className="group inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("viewAll")}
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {patents.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {patents.map((p) => (
              <Link
                key={p.id}
                href={`/patents/${encodeURIComponent(p.slug ?? p.id)}` as never}
                className="block rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {p.countryCode && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {p.countryCode}
                    </Badge>
                  )}
                  {p.status === "granted" && (
                    <Badge variant="signal" className="text-[10px]">
                      {t("badgeGranted")}
                    </Badge>
                  )}
                  {p.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.category}
                    </Badge>
                  )}
                  {p.publicationNo && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {p.publicationNo}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium leading-snug line-clamp-2">
                  {locale === "en" && p.titleEn ? p.titleEn : p.title}
                </div>
                {p.applicant && (
                  <div className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                    {p.applicant}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA to AI */}
      <section className="rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-lg font-semibold">{t("aiCtaTitle")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("aiCtaBody")}
        </p>
        <Link
          href={`/ai?q=${encodeURIComponent(t("aiSuggestQuery"))}` as never}
          className={buttonVariants({ size: "lg" })}
        >
          {t("aiCtaBtn")}
        </Link>
      </section>
    </div>
  );
}
