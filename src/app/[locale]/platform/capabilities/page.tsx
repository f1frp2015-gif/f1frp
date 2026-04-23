import type { Metadata } from "next";
import {
  Wand2,
  BookOpenCheck,
  Mail,
  Calculator,
  FileSearch,
  Package,
  Zap,
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
  const t = await getTranslations({ locale, namespace: "Platform.Capabilities" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CapabilitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Capabilities");

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
        <PlatformCard Icon={Wand2} monoLabel="SELECT" number={1} title={t("c1Title")} accent>
          <p>{t("c1Body")}</p>
          <p className="font-mono text-[11px] text-background/70">{t("c1Try")}</p>
        </PlatformCard>
        <PlatformCard Icon={BookOpenCheck} monoLabel="VERIFY" number={2} title={t("c2Title")}>
          <p>{t("c2Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("c2Try")}</p>
        </PlatformCard>
        <PlatformCard Icon={Mail} monoLabel="RFQ" number={3} title={t("c3Title")}>
          <p>{t("c3Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("c3Try")}</p>
        </PlatformCard>
        <PlatformCard Icon={Calculator} monoLabel="TOOLS" number={4} title={t("c4Title")}>
          <p>{t("c4Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("c4Try")}</p>
        </PlatformCard>
        <PlatformCard Icon={FileSearch} monoLabel="STANDARDS" number={5} title={t("c5Title")}>
          <p>{t("c5Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("c5Try")}</p>
        </PlatformCard>
        <PlatformCard Icon={Package} monoLabel="SUPPLIERS" number={6} title={t("c6Title")}>
          <p>{t("c6Body")}</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">{t("c6Try")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s2Label")} title={t("s2Title")} />
        <PlatformCardGrid columns={2}>
          <PlatformCard Icon={Zap} monoLabel="SCENARIO 01" title={t("sc1Title")}>
            <p>{t("sc1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Zap} monoLabel="SCENARIO 02" title={t("sc2Title")}>
            <p>{t("sc2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Zap} monoLabel="SCENARIO 03" title={t("sc3Title")}>
            <p>{t("sc3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Zap} monoLabel="SCENARIO 04" title={t("sc4Title")}>
            <p>{t("sc4Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("cta")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/ai"
            className="font-mono text-[12px] uppercase tracking-wider text-foreground hover:underline"
          >
            → {t("ctaAi")}
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
