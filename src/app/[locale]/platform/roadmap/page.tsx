import type { Metadata } from "next";
import {
  Briefcase,
  FileText,
  Leaf,
  Plug,
  Users2,
  Globe,
  Gauge,
  Brain,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  PlatformHero,
  PlatformCardGrid,
  PlatformCard,
  PlatformSectionHeading,
} from "@/components/platform-card";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Platform.Roadmap" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/platform/roadmap", locale),
  };
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Roadmap");

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
        <PlatformCard Icon={Brain} monoLabel="AGENT TOOLS" number={1} title={t("r1Title")} accent>
          <p>{t("r1Body")}</p>
          <p className="font-mono text-[11px] text-background/70">{t("r1When")}</p>
        </PlatformCard>
        <PlatformCard Icon={Briefcase} monoLabel="WORKSPACE" number={2} title={t("r2Title")}>
          <p>{t("r2Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r2When")}</p>
        </PlatformCard>
        <PlatformCard Icon={FileText} monoLabel="AI DELIVER" number={3} title={t("r3Title")}>
          <p>{t("r3Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r3When")}</p>
        </PlatformCard>
        <PlatformCard Icon={Leaf} monoLabel="COMPLIANCE" number={4} title={t("r4Title")}>
          <p>{t("r4Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r4When")}</p>
        </PlatformCard>
        <PlatformCard Icon={Globe} monoLabel="CROSS-BORDER" number={5} title={t("r5Title")}>
          <p>{t("r5Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r5When")}</p>
        </PlatformCard>
        <PlatformCard Icon={Plug} monoLabel="API" number={6} title={t("r6Title")}>
          <p>{t("r6Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r6When")}</p>
        </PlatformCard>
        <PlatformCard Icon={Users2} monoLabel="EXPERTS" number={7} title={t("r7Title")}>
          <p>{t("r7Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r7When")}</p>
        </PlatformCard>
        <PlatformCard Icon={Gauge} monoLabel="OBSERVABILITY" number={8} title={t("r8Title")}>
          <p>{t("r8Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("r8When")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">{t("cta")}</p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("ctaEmail")}
        </p>
      </section>
    </div>
  );
}
