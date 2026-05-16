import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { and, desc, eq, ne, or } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { patents as patentsTable } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { CurationNotice } from "@/components/curation-notice";
import { JsonLd } from "@/components/json-ld";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { patentCategories, patentStatusLabels, patentStatusLabelsEn } from "@/lib/data/patents";
import { SaveButton } from "@/components/save-button";
import { AskAiButton } from "@/components/ask-ai-button";
import { resolveViewer, isSaved } from "@/lib/saved";

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
  const t = await getTranslations({ locale, namespace: "Patents" });
  const [row] = await db
    .select()
    .from(patentsTable)
    .where(or(eq(patentsTable.slug, id), eq(patentsTable.id, id)))
    .limit(1);
  const isEn = locale === "en";
  if (!row || (isEn && !(row.titleEn && row.titleEn.trim()))) {
    return {
      title: t("detail.notFound"),
      robots: { index: false, follow: false },
    };
  }
  const titleText = isEn ? row.titleEn ?? "" : row.title;
  const descText = isEn ? row.abstractEn ?? undefined : row.abstract ?? undefined;
  // 缺英文 abstract → noindex (避免 thin content 拉低整站质量分)
  const thinContent = isEn && (row.abstractEn ?? "").trim().length < 80;
  return {
    title: titleText,
    description: descText,
    ...(thinContent ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PatentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: raw } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Patents" });
  const isEn = locale === "en";

  const id = safeDecode(raw);
  const [pRaw] = await db
    .select()
    .from(patentsTable)
    .where(or(eq(patentsTable.slug, id), eq(patentsTable.id, id)))
    .limit(1);
  if (!pRaw) notFound();
  // EN 侧缺英文标题一律 404, 不展示中文内容
  if (isEn && !(pRaw.titleEn && pRaw.titleEn.trim())) notFound();
  const p = {
    ...pRaw,
    title: isEn ? pRaw.titleEn ?? "" : pRaw.title,
    applicant: isEn ? pRaw.applicantEn ?? null : pRaw.applicant ?? null,
    inventors: isEn ? pRaw.inventorsEn ?? null : pRaw.inventors ?? null,
    commentary: isEn ? pRaw.commentaryEn ?? null : pRaw.commentary ?? null,
    country: isEn ? pRaw.countryEn ?? null : pRaw.country ?? null,
    abstract: isEn ? pRaw.abstractEn ?? null : pRaw.abstract ?? null,
    claims: isEn ? pRaw.claimsEn ?? null : pRaw.claims ?? null,
    category: isEn ? pRaw.categoryEn ?? null : pRaw.category ?? null,
  };
  if (p.slug && id === p.id && id !== p.slug) {
    permanentRedirect(`/patents/${encodeURIComponent(p.slug)}`);
  }

  const canonical = p.slug ?? p.id;
  const viewer = await resolveViewer();
  const alreadySaved =
    viewer.userId != null
      ? await isSaved(viewer.userId, "patent", canonical)
      : false;
  const related = p.category
    ? await db
        .select({
          id: patentsTable.id,
          slug: patentsTable.slug,
          title: patentsTable.title,
          country: patentsTable.country,
          filingDate: patentsTable.filingDate,
        })
        .from(patentsTable)
        .where(
          and(eq(patentsTable.category, p.category), ne(patentsTable.id, p.id))
        )
        .orderBy(desc(patentsTable.filingDate))
        .limit(6)
    : [];

  const status = (p.status ?? "pending") as keyof typeof patentStatusLabels;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    additionalType: "https://schema.org/Patent",
    headline: p.title,
    name: p.title,
    alternateName: p.titleEn ?? undefined,
    inLanguage: "zh-CN",
    abstract: p.abstract ?? undefined,
    author: (p.inventors as string[] | null)?.map((n) => ({
      "@type": "Person",
      name: n,
    })),
    creator: p.applicant
      ? { "@type": "Organization", name: p.applicant }
      : undefined,
    identifier: p.publicationNo || p.grantNo || p.applicationNo || undefined,
    datePublished: p.publicationDate || p.grantDate || p.filingDate || undefined,
    url: p.sourceUrl ?? `https://f1frp.com/patents/${canonical}`,
    mainEntityOfPage: `https://f1frp.com/patents/${canonical}`,
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: locale === "en" ? "Home" : "首页", url: "https://f1frp.com/" },
          { name: t("detail.breadcrumb"), url: "https://f1frp.com/patents" },
          { name: p.title, url: `https://f1frp.com/patents/${canonical}` },
        ]}
      />
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/patents" className="hover:text-primary hover:underline">
          {t("detail.breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="truncate">{locale === "en" && p.titleEn ? p.titleEn : p.title}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {p.category && (
          <Badge variant="secondary" className="text-[10px]">
            {(() => {
              const c = patentCategories.find((x) => x.id === p.category);
              if (!c) return p.category;
              return locale === "en" && c.nameEn ? c.nameEn : c.name;
            })()}
          </Badge>
        )}
        {p.country && (
          <Badge variant="outline" className="text-[10px]">
            {p.country}
          </Badge>
        )}
        <Badge
          variant={
            status === "granted"
              ? "default"
              : status === "pending"
                ? "secondary"
                : "outline"
          }
          className="text-[10px]"
        >
          {(locale === "en" ? patentStatusLabelsEn : patentStatusLabels)[status]}
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-snug">
            {locale === "en" && p.titleEn ? p.titleEn : p.title}
          </h1>
          {p.titleEn && p.title !== p.titleEn && (
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {locale === "en" ? p.title : p.titleEn}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AskAiButton
            prompt={
              locale === "en"
                ? `Explain patent ${p.publicationNo ?? p.grantNo ?? p.applicationNo ?? canonical} — "${p.titleEn ?? p.title}"${p.applicant ? ` (${p.applicant})` : ""}. What is the core claim, what does it block competitors from doing, and is there a workaround for an overseas FRP buyer sourcing similar tech from China?`
                : `专利 ${p.publicationNo ?? p.grantNo ?? p.applicationNo ?? canonical}《${p.title}》的核心权利要求、技术要点，以及国内对应工艺/供应商。`
            }
          />
          <SaveButton
            sourceType="patent"
            sourceId={canonical}
            title={p.title}
            url={`/patents/${encodeURIComponent(canonical)}`}
            signedIn={viewer.signedIn}
            initialSaved={alreadySaved}
          />
        </div>
      </div>

      {p.sourceUrl && (
        <div className="mt-4">
          <a
            className="text-sm text-primary hover:underline"
            href={p.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("detail.viewSource")}
          </a>
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="grid gap-2 p-5 text-sm md:grid-cols-2">
          <MetaRow label={t("detail.applicant")} value={p.applicant ?? ""} />
          <MetaRow label={t("detail.inventors")} value={(p.inventors ?? []).join(", ")} />
          <MetaRow label={t("detail.applicationNo")} value={p.applicationNo ?? ""} mono />
          <MetaRow label={t("detail.publicationNo")} value={p.publicationNo ?? ""} mono />
          <MetaRow label={t("detail.grantNo")} value={p.grantNo ?? ""} mono />
          <MetaRow label={t("detail.filingDate")} value={p.filingDate ?? ""} />
          <MetaRow label={t("detail.publicationDate")} value={p.publicationDate ?? ""} />
          <MetaRow label={t("detail.grantDate")} value={p.grantDate ?? ""} />
          {(p.classification ?? []).length > 0 && (
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {t("detail.ipc")}
                </span>
                {(p.classification as string[]).map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="font-mono text-[10px]"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
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

      {p.claims && (
        <>
          <Separator className="my-8" />
          <section>
            <h2 className="text-base font-semibold">{t("detail.claims")}</h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.9] text-foreground/90">
              {p.claims}
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
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/patents/${encodeURIComponent(r.slug ?? r.id)}` as never}
                  className="rounded-md border bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/60"
                >
                  <div className="line-clamp-2 font-medium">{r.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.country ?? ""}
                    {r.filingDate ? ` · ${r.filingDate}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <CurationNotice scope={t("detail.curation")} />

      <div className="mt-8 flex items-center justify-between border-t pt-6 text-sm">
        <Link
          href="/patents"
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
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
