import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { and, desc, eq, ne, or } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { papers as papersTable } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { CurationNotice } from "@/components/curation-notice";
import { JsonLd } from "@/components/json-ld";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { paperCategories } from "@/lib/data/papers";
import { SaveButton } from "@/components/save-button";
import { resolveViewer, isSaved } from "@/lib/saved";
import { buildAlternates } from "@/lib/seo";

export const revalidate = 600;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id: raw } = await params;
  const id = safeDecode(raw);
  const t = await getTranslations({ locale, namespace: "Papers" });
  const [row] = await db
    .select()
    .from(papersTable)
    .where(or(eq(papersTable.slug, id), eq(papersTable.id, id)))
    .limit(1);
  // Prefer the slug-based canonical URL when available.
  const canonicalId = row?.slug ?? id;
  const alternates = buildAlternates(
    `/papers/${encodeURIComponent(canonicalId)}`,
    locale
  );
  if (!row) return { title: t("detail.notFound"), alternates };
  return {
    title: row.title,
    description: row.abstract ?? row.titleEn ?? undefined,
    alternates,
  };
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: raw } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Papers" });

  const id = safeDecode(raw);
  const [p] = await db
    .select()
    .from(papersTable)
    .where(or(eq(papersTable.slug, id), eq(papersTable.id, id)))
    .limit(1);
  if (!p) notFound();
  // Legacy hash id → 301 to canonical slug URL
  if (p.slug && id === p.id && id !== p.slug) {
    permanentRedirect(`/papers/${encodeURIComponent(p.slug)}`);
  }

  const canonical = p.slug ?? p.id;
  const viewer = await resolveViewer();
  const alreadySaved =
    viewer.userId != null
      ? await isSaved(viewer.userId, "paper", canonical)
      : false;
  const related = p.category
    ? await db
        .select({
          id: papersTable.id,
          slug: papersTable.slug,
          title: papersTable.title,
          year: papersTable.year,
          journal: papersTable.journal,
        })
        .from(papersTable)
        .where(
          and(eq(papersTable.category, p.category), ne(papersTable.id, p.id))
        )
        .orderBy(desc(papersTable.citationCount), desc(papersTable.year))
        .limit(6)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: p.title,
    name: p.title,
    alternateName: p.titleEn ?? undefined,
    author: (p.authors as string[] | null)?.map((a) => ({
      "@type": "Person",
      name: a,
    })),
    datePublished: p.year ? `${p.year}-01-01` : undefined,
    inLanguage: p.language === "zh" ? "zh-CN" : "en",
    abstract: p.abstract ?? undefined,
    keywords: ((p.keywords as string[] | null) ?? []).join(", "),
    publisher: p.journal
      ? { "@type": "Organization", name: p.journal }
      : undefined,
    identifier: p.doi ? `doi:${p.doi}` : undefined,
    url: p.sourceUrl ?? `https://f1frp.com/papers/${canonical}`,
    mainEntityOfPage: `https://f1frp.com/papers/${canonical}`,
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "首页", url: "https://f1frp.com/" },
          { name: t("detail.breadcrumb"), url: "https://f1frp.com/papers" },
          { name: p.title, url: `https://f1frp.com/papers/${canonical}` },
        ]}
      />
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/papers" className="hover:text-primary hover:underline">
          {t("detail.breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="truncate">{locale === "en" && p.titleEn ? p.titleEn : p.title}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {p.category && (
          <Badge variant="secondary" className="text-[10px]">
            {(() => {
              const c = paperCategories.find((x) => x.id === p.category);
              if (!c) return p.category;
              return locale === "en" && c.nameEn ? c.nameEn : c.name;
            })()}
          </Badge>
        )}
        {p.language && (
          <Badge variant="outline" className="text-[10px]">
            {p.language === "zh" ? t("langZh") : t("langEn")}
          </Badge>
        )}
        {p.year && (
          <Badge variant="outline" className="text-[10px]">
            {p.year}
          </Badge>
        )}
        {(p.citationCount ?? 0) > 0 && (
          <Badge variant="outline" className="text-[10px]">
            {t("cited", { count: (p.citationCount ?? 0).toLocaleString() })}
          </Badge>
        )}
      </div>

      <h1 className="text-2xl font-bold leading-snug">
        {locale === "en" && p.titleEn ? p.titleEn : p.title}
      </h1>
      {p.titleEn && p.title !== p.titleEn && (
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          {locale === "en" ? p.title : p.titleEn}
        </p>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {(p.authors ?? []).join(", ")}
          {p.affiliation ? ` · ${p.affiliation}` : ""}
        </div>
        <SaveButton
          sourceType="paper"
          sourceId={canonical}
          title={p.title}
          url={`/papers/${encodeURIComponent(canonical)}`}
          signedIn={viewer.signedIn}
          initialSaved={alreadySaved}
          className="shrink-0"
        />
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-2 p-5 text-sm">
          <MetaRow label={t("detail.journal")} value={p.journal ?? ""} />
          <MetaRow
            label={t("detail.volume")}
            value={[p.volume, p.issue, p.pages].filter(Boolean).join(" / ")}
          />
          <MetaRow
            label={t("detail.doi")}
            value={
              p.doi ? (
                <a
                  className="text-primary hover:underline"
                  href={`https://doi.org/${p.doi}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.doi}
                </a>
              ) : (
                ""
              )
            }
          />
          <MetaRow
            label={t("detail.sourceUrl")}
            value={
              p.sourceUrl ? (
                <a
                  className="text-primary hover:underline break-all"
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("detail.viewSource")}
                </a>
              ) : (
                ""
              )
            }
          />
          {(p.keywords ?? []).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{t("detail.keywords")}</span>
              {(p.keywords as string[]).map((k) => (
                <Badge key={k} variant="outline" className="text-[10px]">
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {p.abstract && (
        <>
          <Separator className="my-8" />
          <section>
            <h2 className="text-base font-semibold">{t("detail.abstract")}</h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.9] text-foreground/90">
              {p.abstract}
            </p>
          </section>
        </>
      )}

      {related.length > 0 && (
        <>
          <Separator className="my-8" />
          <section>
            <h2 className="text-base font-semibold">{t("detail.related")}</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {related.map((r) => {
                const target = `/papers/${encodeURIComponent(r.slug ?? r.id)}`;
                return (
                  <Link
                    key={r.id}
                    // Typed-routes cast is fine here: target always starts with
                    // "/papers/" which matches the declared /papers/[id] route.
                    href={target as never}
                    className="block rounded-md border bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/60"
                  >
                    <div className="line-clamp-2 font-medium">{r.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.journal ?? ""}
                      {r.year ? ` · ${r.year}` : ""}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      <CurationNotice scope={t("detail.curation")} />

      <div className="mt-8 flex items-center justify-between border-t pt-6 text-sm">
        <Link
          href="/papers"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("detail.back")}
        </Link>
        <span className="text-muted-foreground">{t("detail.editorial")}</span>
      </div>
    </article>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
