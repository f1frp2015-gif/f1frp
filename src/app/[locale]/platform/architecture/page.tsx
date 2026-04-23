import type { Metadata } from "next";
import {
  Bot,
  Database,
  Workflow,
  Network,
  FileCheck,
  Globe2,
  TimerReset,
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
  const t = await getTranslations({ locale, namespace: "Platform.Architecture" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Architecture");

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
        <PlatformCard Icon={Bot} monoLabel="AI AGENT" number={1} title={t("layer1Title")} accent>
          <p>{t("layer1Body")}</p>
          <p className="font-mono text-[11px] text-background/70">{t("layer1Stack")}</p>
        </PlatformCard>
        <PlatformCard Icon={Database} monoLabel="DATA" number={2} title={t("layer2Title")}>
          <p>{t("layer2Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("layer2Stack")}</p>
        </PlatformCard>
        <PlatformCard Icon={Workflow} monoLabel="DELIVER" number={3} title={t("layer3Title")}>
          <p>{t("layer3Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("layer3Stack")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s2Label")} title={t("s2Title")} />
        <PlatformCardGrid columns={2}>
          <PlatformCard Icon={Network} monoLabel="LINK" title={t("m1Title")}>
            <p>{t("m1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={FileCheck} monoLabel="CITATION" title={t("m2Title")}>
            <p>{t("m2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Globe2} monoLabel="BILINGUAL" title={t("m3Title")}>
            <p>{t("m3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={TimerReset} monoLabel="FLYWHEEL" title={t("m4Title")}>
            <p>{t("m4Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("cta")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/platform/advantages"
            className="font-mono text-[12px] uppercase tracking-wider text-foreground hover:underline"
          >
            → {t("nextAdvantages")}
          </Link>
          <Link
            href="/platform/capabilities"
            className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {t("nextCapabilities")}
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
