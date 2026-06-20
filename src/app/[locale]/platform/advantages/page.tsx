import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import {
  Quote,
  Layers,
  Languages,
  RefreshCcw,
  GitMerge,
  Award,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  PlatformHero,
  PlatformCardGrid,
  PlatformCard,
  PlatformSectionHeading,
} from "@/components/platform-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Platform.Advantages" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/platform/advantages"),
  };
}

export default async function AdvantagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Advantages");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/platform" className="hover:text-foreground">
          {t("breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{t("h1")}</span>
      </nav>

      <PlatformHero eyebrow={t("eyebrow")} title={t("h1")} description={t("lead")} />

      <PlatformSectionHeading eyebrow={t("s1Label")} title={t("s1Title")} />
      <PlatformCardGrid columns={3}>
        <PlatformCard Icon={Quote} monoLabel="CITATION-FIRST" number={1} title={t("a1Title")} accent>
          <p>{t("a1Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Layers} monoLabel="MULTI-SOURCE" number={2} title={t("a2Title")}>
          <p>{t("a2Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Languages} monoLabel="BILINGUAL" number={3} title={t("a3Title")}>
          <p>{t("a3Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={RefreshCcw} monoLabel="FLYWHEEL" number={4} title={t("a4Title")}>
          <p>{t("a4Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={GitMerge} monoLabel="LINKED" number={5} title={t("a5Title")}>
          <p>{t("a5Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Award} monoLabel="PROVENANCE" number={6} title={t("a6Title")}>
          <p>{t("a6Body")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s2Label")} title={t("s2Title")} />
        <div className="overflow-hidden rounded-lg border border-border/70">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("colCompare")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("colTraditional")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("colF1frp")}</th>
              </tr>
            </thead>
            <tbody>
              {(t.raw("compareRows") as Array<{ dim: string; tr: string; f1: string }>).map((r) => (
                <tr key={r.dim} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{r.dim}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.tr}</td>
                  <td className="px-4 py-3">{r.f1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("cta")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/platform/capabilities"
            className="font-mono text-[12px] uppercase tracking-wider text-foreground hover:underline"
          >
            → {t("nextCapabilities")}
          </Link>
          <Link
            href="/platform/roadmap"
            className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {t("nextRoadmap")}
          </Link>
        </div>
      </section>
    </div>
  );
}
