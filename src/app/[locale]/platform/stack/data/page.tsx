import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import {
  Database,
  Network,
  GitMerge,
  RefreshCcw,
  Users,
  FlaskConical,
  FileBadge,
  BookOpen,
  ShieldCheck,
  Building2,
  Layers,
  Server,
  Binary,
  Download,
  Languages,
  MessageSquare,
  Plug,
  Gauge,
  ChartLine,
  Rocket,
  Quote,
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
  const t = await getTranslations({
    locale,
    namespace: "Platform.Stack.Data",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/platform/stack/data"),
  };
}

export default async function DataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Stack.Data");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/platform" className="hover:text-foreground">
          {t("breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>Data</span>
      </nav>

      <PlatformHero eyebrow={t("eyebrow")} title={t("h1")} description={t("lead")} />

      <PlatformSectionHeading eyebrow={t("s1Label")} title={t("s1Title")} />
      <PlatformCardGrid columns={2}>
        <PlatformCard Icon={GitMerge} monoLabel="INTERLINK" title={t("d1Title")} accent>
          <p>{t("d1Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Quote} monoLabel="PROVENANCE" title={t("d2Title")}>
          <p>{t("d2Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={RefreshCcw} monoLabel="FLYWHEEL" title={t("d3Title")}>
          <p>{t("d3Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Users} monoLabel="HUMAN-IN-LOOP" title={t("d4Title")}>
          <p>{t("d4Body")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s2Label")} title={t("s2Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Database} monoLabel="MATERIALS" title={t("lib1Title")}>
            <p>{t("lib1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={FlaskConical} monoLabel="FORMULAS" title={t("lib2Title")}>
            <p>{t("lib2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={FileBadge} monoLabel="STANDARDS" title={t("lib3Title")}>
            <p>{t("lib3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={BookOpen} monoLabel="PAPERS" title={t("lib4Title")}>
            <p>{t("lib4Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={ShieldCheck} monoLabel="PATENTS" title={t("lib5Title")}>
            <p>{t("lib5Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Building2} monoLabel="SUPPLIERS" title={t("lib6Title")}>
            <p>{t("lib6Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s3Label")} title={t("s3Title")} />
        <PlatformCardGrid columns={2}>
          <PlatformCard Icon={Server} monoLabel="NEON POSTGRES" title={t("i1Title")}>
            <p>{t("i1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Binary} monoLabel="PGVECTOR" title={t("i2Title")}>
            <p>{t("i2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={RefreshCcw} monoLabel="INGEST" title={t("i3Title")}>
            <p>{t("i3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Languages} monoLabel="LLM" title={t("i4Title")}>
            <p>{t("i4Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s4Label")} title={t("s4Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Download} monoLabel="LIST" title={t("u1Title")}>
            <p>{t("u1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Layers} monoLabel="DETAIL" title={t("u2Title")}>
            <p>{t("u2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={MessageSquare} monoLabel="CITATION" title={t("u3Title")}>
            <p>{t("u3Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s5Label")} title={t("s5Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Languages} monoLabel="MULTI-LANG" title={t("r1Title")} accent>
            <p>{t("r1Body")}</p>
            <p className="font-mono text-[11px] text-background/70">{t("r1When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Gauge} monoLabel="CONFIDENCE" title={t("r2Title")}>
            <p>{t("r2Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r2When")}</p>
          </PlatformCard>
          <PlatformCard Icon={ChartLine} monoLabel="CURVES" title={t("r3Title")}>
            <p>{t("r3Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r3When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Plug} monoLabel="API" title={t("r4Title")}>
            <p>{t("r4Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r4When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Rocket} monoLabel="SCALE" title={t("r5Title")}>
            <p>{t("r5Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r5When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Network} monoLabel="MORE" title="...">
            <p className="text-muted-foreground/80">
              {locale === "zh" ? "持续迭代，欢迎建议。" : "Ongoing iteration, suggestions welcome."}
            </p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16 flex items-center justify-between border-t border-border/70 pt-8">
        <Link
          href={"/platform/stack/delivery" as never}
          className="font-mono text-[12px] uppercase tracking-wider text-foreground hover:underline"
        >
          → {locale === "zh" ? "下一层：工程交付层" : "Next: Engineering Delivery"}
        </Link>
        <Link
          href="/platform"
          className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {locale === "zh" ? "返回平台说明" : "Back to Platform"}
        </Link>
      </section>
    </div>
  );
}
