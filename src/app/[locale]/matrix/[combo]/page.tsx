import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { or, ilike, desc, sql, eq } from "drizzle-orm";
import {
  Beaker,
  BookOpen,
  ShieldCheck,
  Building2,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import {
  materials as materialsTable,
  formulas as formulasTable,
  papers as papersTable,
  patents as patentsTable,
} from "@/lib/db/schema";
import {
  parseCombo,
  findFiber,
  findResin,
  PROCESSES,
  type Fiber,
  type Resin,
} from "@/lib/data/matrix";
import {
  PlatformHero,
  PlatformCard,
  PlatformCardGrid,
  PlatformSectionHeading,
} from "@/components/platform-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { buildAlternates } from "@/lib/seo";

export const revalidate = 600;

// Build ILIKE `or` across the given text columns for any of the keywords.
// Cast is fine — we only call this with known matching columns on each table.
function keywordOr(
  _table: unknown,
  keywords: string[],
  cols: Array<unknown>
) {
  const ors = keywords.flatMap((k) =>
    cols
      .filter(Boolean)
      .map((c) => ilike(c as never, `%${k}%`))
  );
  return or(...(ors as never[]));
}

async function searchMaterials(fiber: Fiber, resin: Resin, limit = 12) {
  try {
    const cols = [
      materialsTable.name,
      materialsTable.nameEn,
      materialsTable.description,
    ];
    return await db
      .select({
        id: materialsTable.id,
        name: materialsTable.name,
        nameEn: materialsTable.nameEn,
        category: materialsTable.category,
        subCategory: materialsTable.subCategory,
        brand: materialsTable.brand,
      })
      .from(materialsTable)
      .where(
        or(
          keywordOr(null, fiber.keywords, cols),
          keywordOr(null, resin.keywords, cols)
        )
      )
      .limit(limit);
  } catch {
    return [];
  }
}

async function searchFormulas(fiber: Fiber, resin: Resin, limit = 12) {
  try {
    const cols = [
      formulasTable.name,
      formulasTable.description,
      formulasTable.application,
    ];
    return await db
      .select({
        id: formulasTable.id,
        name: formulasTable.name,
        process: formulasTable.process,
        application: formulasTable.application,
      })
      .from(formulasTable)
      .where(keywordOr(null, [...fiber.keywords, ...resin.keywords], cols))
      .limit(limit);
  } catch {
    return [];
  }
}

async function searchPapers(fiber: Fiber, resin: Resin, limit = 12) {
  const kws = [...fiber.keywords, ...resin.keywords];
  return db
    .select({
      id: papersTable.id,
      slug: papersTable.slug,
      title: papersTable.title,
      titleEn: papersTable.titleEn,
      year: papersTable.year,
      journal: papersTable.journal,
      hasCommentary: sql<boolean>`${papersTable.commentary} IS NOT NULL`,
    })
    .from(papersTable)
    .where(
      or(
        ...kws
          .slice(0, 4)
          .flatMap((k) => [
            ilike(papersTable.title, `%${k}%`),
            ilike(papersTable.titleEn, `%${k}%`),
          ])
      )
    )
    .orderBy(desc(papersTable.createdAt))
    .limit(limit);
}

async function searchPatents(fiber: Fiber, resin: Resin, limit = 12) {
  const kws = [...fiber.keywords, ...resin.keywords];
  return db
    .select({
      id: patentsTable.id,
      slug: patentsTable.slug,
      title: patentsTable.title,
      titleEn: patentsTable.titleEn,
      countryCode: patentsTable.countryCode,
      status: patentsTable.status,
      applicant: patentsTable.applicant,
    })
    .from(patentsTable)
    .where(
      or(
        ...kws
          .slice(0, 4)
          .flatMap((k) => [
            ilike(patentsTable.title, `%${k}%`),
            ilike(patentsTable.titleEn, `%${k}%`),
          ])
      )
    )
    .orderBy(desc(patentsTable.createdAt))
    .limit(limit);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; combo: string }>;
}): Promise<Metadata> {
  const { locale, combo } = await params;
  const alternates = buildAlternates(`/matrix/${combo}`, locale);
  const parsed = parseCombo(combo);
  if (!parsed) return { title: "Not found", alternates };
  const fiber = findFiber(parsed.fiberSlug);
  const resin = findResin(parsed.resinSlug);
  if (!fiber || !resin) return { title: "Not found", alternates };
  const t0 = await getTranslations({ locale, namespace: "Platform.Matrix.Combo" });
  const name =
    locale === "en"
      ? `${fiber.nameEn} × ${resin.nameEn}`
      : `${fiber.name} × ${resin.name}`;
  return {
    title: t0("metaTitle", { name }),
    description: t0("metaDescription", { name }),
    alternates,
  };
}

export default async function ComboPage({
  params,
}: {
  params: Promise<{ locale: string; combo: string }>;
}) {
  const { locale, combo } = await params;
  setRequestLocale(locale);
  const parsed = parseCombo(combo);
  if (!parsed) notFound();
  const fiber = findFiber(parsed.fiberSlug);
  const resin = findResin(parsed.resinSlug);
  if (!fiber || !resin) notFound();

  // Use namespace Matrix.Combo so keys stay colocated with the parent Matrix page.
  const t = await getTranslations({ locale, namespace: "Platform.Matrix.Combo" });

  const [materials, formulas, papers, patents] = await Promise.all([
    searchMaterials(fiber, resin),
    searchFormulas(fiber, resin),
    searchPapers(fiber, resin),
    searchPatents(fiber, resin),
  ]);

  const fiberName = locale === "en" ? fiber.nameEn : fiber.name;
  const resinName = locale === "en" ? resin.nameEn : resin.name;
  const displayName = `${fiberName} × ${resinName}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/matrix" className="hover:text-foreground">
          {t("breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{displayName}</span>
      </nav>

      <PlatformHero
        eyebrow={`${fiber.mono} × ${resin.mono}`}
        title={displayName}
        description={t("lead", { fiber: fiberName, resin: resinName })}
      />

      {/* Live stats from DB */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-background p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{materials.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("statMaterials")}</div>
        </div>
        <div className="rounded-lg border bg-background p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{formulas.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("statFormulas")}</div>
        </div>
        <div className="rounded-lg border bg-background p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{papers.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("statPapers")}</div>
        </div>
        <div className="rounded-lg border bg-background p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{patents.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("statPatents")}</div>
        </div>
      </div>

      {/* Process chips as a third axis */}
      <section className="mb-12">
        <PlatformSectionHeading eyebrow={t("processesLabel")} title={t("processesTitle")} />
        <div className="flex flex-wrap gap-2">
          {PROCESSES.map((p) => (
            <Badge
              key={p.slug}
              variant="outline"
              className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
            >
              {p.mono}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("processesHint")}</p>
      </section>

      {/* Materials */}
      {materials.length > 0 && (
        <section className="mb-12">
          <PlatformSectionHeading eyebrow="MATERIALS" title={t("matTitle")} />
          <div className="grid gap-2 md:grid-cols-2">
            {materials.map((m) => (
              <Link
                key={m.id}
                href={`/materials/${encodeURIComponent(m.id)}` as never}
                className="block rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {m.category}
                  </Badge>
                  {m.subCategory && (
                    <Badge variant="secondary" className="text-[10px]">
                      {m.subCategory}
                    </Badge>
                  )}
                  {m.brand && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {m.brand}
                    </span>
                  )}
                </div>
                <div className="line-clamp-2 font-medium">{m.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Formulas */}
      {formulas.length > 0 && (
        <section className="mb-12">
          <PlatformSectionHeading eyebrow="FORMULAS" title={t("formulaTitle")} />
          <div className="grid gap-2 md:grid-cols-2">
            {formulas.map((f) => (
              <Link
                key={f.id}
                href={`/formulas#${encodeURIComponent(f.id)}` as never}
                className="block rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  {f.process && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.process}
                    </Badge>
                  )}
                  {f.application && (
                    <span className="text-[10px] text-muted-foreground">
                      {f.application}
                    </span>
                  )}
                </div>
                <div className="line-clamp-2 font-medium">{f.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Papers */}
      {papers.length > 0 && (
        <section className="mb-12">
          <PlatformSectionHeading eyebrow="PAPERS" title={t("paperTitle")} />
          <div className="grid gap-2 md:grid-cols-2">
            {papers.map((p) => (
              <Link
                key={p.id}
                href={`/papers/${encodeURIComponent(p.slug ?? p.id)}` as never}
                className="block rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  {p.year && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.year}
                    </Badge>
                  )}
                  {p.hasCommentary && (
                    <Badge variant="signal" className="text-[10px]">
                      {t("badgeCommentary")}
                    </Badge>
                  )}
                </div>
                <div className="line-clamp-2 font-medium">
                  {locale === "en" && p.titleEn ? p.titleEn : p.title}
                </div>
                {p.journal && (
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {p.journal}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Patents */}
      {patents.length > 0 && (
        <section className="mb-12">
          <PlatformSectionHeading eyebrow="PATENTS" title={t("patentTitle")} />
          <div className="grid gap-2 md:grid-cols-2">
            {patents.map((p) => (
              <Link
                key={p.id}
                href={`/patents/${encodeURIComponent(p.slug ?? p.id)}` as never}
                className="block rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
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
                </div>
                <div className="line-clamp-2 font-medium">
                  {locale === "en" && p.titleEn ? p.titleEn : p.title}
                </div>
                {p.applicant && (
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {p.applicant}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state if no DB hits at all */}
      {materials.length === 0 &&
        formulas.length === 0 &&
        papers.length === 0 &&
        patents.length === 0 && (
          <section className="rounded-lg border bg-muted/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("emptyBody", { name: displayName })}
            </p>
          </section>
        )}

      {/* AI CTA */}
      <section className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-lg font-semibold">{t("aiCtaTitle")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("aiCtaBody", { name: displayName })}
        </p>
        <div className="mt-4">
          <Link
            href={
              `/ai?q=${encodeURIComponent(
                t("aiSuggestQuery", { fiber: fiberName, resin: resinName })
              )}` as never
            }
            className={buttonVariants({ size: "lg" })}
          >
            {t("aiCtaBtn")}
          </Link>
        </div>
      </section>
    </div>
  );
}
