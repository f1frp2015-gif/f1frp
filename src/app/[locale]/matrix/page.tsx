import type { Metadata } from "next";
import {
  Grid3x3,
  Pill,
  FlaskConical,
  Atom,
  Infinity as InfinityIcon,
  Sparkles,
  Database,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  PlatformHero,
  PlatformCard,
  PlatformCardGrid,
  PlatformSectionHeading,
} from "@/components/platform-card";
import { Badge } from "@/components/ui/badge";
import {
  FIBERS,
  RESINS,
  PROCESSES,
  FEASIBILITY,
} from "@/lib/data/matrix";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Platform.Matrix" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function MatrixPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Matrix");

  const combos = FIBERS.length * RESINS.length * PROCESSES.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t("breadcrumbHome")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{t("h1")}</span>
      </nav>

      <PlatformHero eyebrow={t("eyebrow")} title={t("h1")} description={t("lead")} />

      {/* Concept — benchmark to drug discovery & chemistry platforms */}
      <PlatformSectionHeading eyebrow={t("s1Label")} title={t("s1Title")} />
      <PlatformCardGrid columns={2}>
        <PlatformCard Icon={Pill} monoLabel="DRUGBANK / CHEMBL" title={t("c1Title")} accent>
          <p>{t("c1Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Atom} monoLabel="MATWEB / GRANTA" title={t("c2Title")}>
          <p>{t("c2Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Grid3x3} monoLabel="OUR MATRIX" title={t("c3Title")}>
          <p>{t("c3Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={InfinityIcon} monoLabel="COMBINATORIAL" title={t("c4Title")}>
          <p>{t("c4Body")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      {/* The main matrix: fibers × resins */}
      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("matrixLabel")}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {t("matrixTitle")}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-foreground" />
              {t("legendMain")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-foreground/40 bg-foreground/20" />
              {t("legendPossible")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-muted-foreground/40" />
              {t("legendRare")}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background px-3 py-3 text-left align-bottom">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {t("axisRow")} ↓ ·&nbsp; {t("axisCol")} →
                  </div>
                </th>
                {RESINS.map((r) => (
                  <th
                    key={r.slug}
                    className="px-2 py-3 text-center align-bottom font-normal"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {r.acronym}
                      </span>
                      <span className="text-xs font-semibold">
                        {locale === "en" ? r.nameEn : r.name}
                      </span>
                      {r.isThermoplastic && (
                        <span className="font-mono text-[9px] text-muted-foreground">
                          TP
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIBERS.map((f) => (
                <tr key={f.slug} className="border-t border-border/70">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-background px-3 py-3 text-left"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {f.mono}
                      </span>
                      <span className="text-sm font-semibold">
                        {locale === "en" ? f.nameEn : f.name}
                      </span>
                    </div>
                  </th>
                  {RESINS.map((r) => {
                    const score = FEASIBILITY[f.slug]?.[r.slug] ?? 0;
                    const combo = `${f.slug}-${r.slug}`;
                    const cls =
                      score === 2
                        ? "bg-foreground/95 text-background hover:bg-foreground"
                        : score === 1
                          ? "bg-muted/40 hover:bg-muted"
                          : "bg-transparent hover:bg-muted/30";
                    const icon =
                      score === 2 ? "●" : score === 1 ? "○" : "·";
                    return (
                      <td
                        key={r.slug}
                        className="border-l border-border/60 p-0"
                      >
                        <Link
                          href={`/matrix/${combo}` as never}
                          className={`flex h-14 items-center justify-center text-base transition-colors ${cls}`}
                          aria-label={`${f.name} × ${r.name}`}
                        >
                          <span className="font-mono text-[14px]">{icon}</span>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {t("matrixHint", {
            fibers: FIBERS.length,
            resins: RESINS.length,
            processes: PROCESSES.length,
            total: combos,
          })}
        </p>
      </section>

      {/* Process chips — third dimension */}
      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("processLabel")} title={t("processTitle")} />
        <div className="flex flex-wrap gap-2">
          {PROCESSES.map((p) => (
            <Badge
              key={p.slug}
              variant="outline"
              className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
            >
              {p.mono} · {locale === "en" ? p.nameEn : p.name}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("processHint")}</p>
      </section>

      {/* How to use */}
      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("useLabel")} title={t("useTitle")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Grid3x3} monoLabel="STEP 1" title={t("u1Title")}>
            <p>{t("u1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Database} monoLabel="STEP 2" title={t("u2Title")}>
            <p>{t("u2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Sparkles} monoLabel="STEP 3" title={t("u3Title")}>
            <p>{t("u3Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      {/* Philosophy */}
      <section className="mt-16 rounded-lg border border-border/70 bg-muted/20 p-8 sm:p-10">
        <div className="max-w-3xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("philosophyLabel")}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("philosophyTitle")}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {t("philosophyBody1")}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {t("philosophyBody2")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              {t("ctaAi")}
            </Link>
            <Link
              href={"/matrix/carbon-epoxy" as never}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {t("ctaExample")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
