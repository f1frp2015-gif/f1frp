import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import {
  Bot,
  Quote,
  Network,
  Shuffle,
  BadgeCheck,
  Wand2,
  FlaskConical,
  FileBadge,
  BookOpen,
  Building2,
  Languages,
  Layers,
  MessageSquare,
  ArrowRight,
  Terminal,
  Workflow,
  Briefcase,
  FileText,
  Users2,
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
    namespace: "Platform.Stack.AiAgent",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/platform/stack/ai-agent"),
  };
}

export default async function AiAgentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Stack.AiAgent");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/platform" className="hover:text-foreground">
          {t("breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>AI Agent</span>
      </nav>

      <PlatformHero eyebrow={t("eyebrow")} title={t("h1")} description={t("lead")} />

      <PlatformSectionHeading eyebrow={t("s1Label")} title={t("s1Title")} />
      <PlatformCardGrid columns={2}>
        <PlatformCard Icon={Quote} monoLabel="CITATION-FIRST" title={t("d1Title")} accent>
          <p>{t("d1Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Network} monoLabel="RAG" title={t("d2Title")}>
          <p>{t("d2Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Shuffle} monoLabel="ROUTING" title={t("d3Title")}>
          <p>{t("d3Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={BadgeCheck} monoLabel="TRUST" title={t("d4Title")}>
          <p>{t("d4Body")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s2Label")} title={t("s2Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Wand2} monoLabel="SELECT" title={t("f1Title")}>
            <p>{t("f1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={FlaskConical} monoLabel="FORMULA" title={t("f2Title")}>
            <p>{t("f2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={FileBadge} monoLabel="STANDARD" title={t("f3Title")}>
            <p>{t("f3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={BookOpen} monoLabel="PAPER" title={t("f4Title")}>
            <p>{t("f4Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Building2} monoLabel="SUPPLIER" title={t("f5Title")}>
            <p>{t("f5Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Languages} monoLabel="LOCALE" title={t("f6Title")}>
            <p>{t("f6Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s3Label")} title={t("s3Title")} />
        <PlatformCardGrid columns={2}>
          <PlatformCard Icon={Terminal} monoLabel="PGVECTOR" title={t("i1Title")}>
            <p>{t("i1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Quote} monoLabel="PROMPT" title={t("i2Title")}>
            <p>{t("i2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Shuffle} monoLabel="PROVIDER" title={t("i3Title")}>
            <p>{t("i3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={MessageSquare} monoLabel="CLIENT" title={t("i4Title")}>
            <p>{t("i4Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s4Label")} title={t("s4Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={ArrowRight} monoLabel="INLINE" title={t("u1Title")}>
            <p>{t("u1Body")}</p>
            <p>
              <Link href="/" className="font-mono text-[11px] text-foreground underline-offset-2 hover:underline">
                {t("u1Link")}
              </Link>
            </p>
          </PlatformCard>
          <PlatformCard Icon={Bot} monoLabel="FULLSCREEN" title={t("u2Title")}>
            <p>{t("u2Body")}</p>
            <p>
              <Link href="/ai" className="font-mono text-[11px] text-foreground underline-offset-2 hover:underline">
                {t("u2Link")}
              </Link>
            </p>
          </PlatformCard>
          <PlatformCard Icon={MessageSquare} monoLabel="WIDGET" title={t("u3Title")}>
            <p>{t("u3Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{t("u3Link")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s5Label")} title={t("s5Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Workflow} monoLabel="TOOL-CALLING" title={t("r1Title")} accent>
            <p>{t("r1Body")}</p>
            <p className="font-mono text-[11px] text-background/70">{t("r1When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Briefcase} monoLabel="WORKSPACE" title={t("r2Title")}>
            <p>{t("r2Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r2When")}</p>
          </PlatformCard>
          <PlatformCard Icon={FileText} monoLabel="DELIVERABLE" title={t("r3Title")}>
            <p>{t("r3Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r3When")}</p>
          </PlatformCard>
          <PlatformCard Icon={BadgeCheck} monoLabel="TRUST" title={t("r4Title")}>
            <p>{t("r4Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r4When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Users2} monoLabel="EXPERT" title={t("r5Title")}>
            <p>{t("r5Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r5When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Layers} monoLabel="MORE" title="...">
            <p className="text-muted-foreground/80">
              {locale === "zh" ? "持续迭代，欢迎建议。" : "Ongoing iteration, suggestions welcome."}
            </p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16 flex items-center justify-between border-t border-border/70 pt-8">
        <Link
          href={"/platform/stack/data" as never}
          className="font-mono text-[12px] uppercase tracking-wider text-foreground hover:underline"
        >
          → {locale === "zh" ? "下一层：结构化数据层" : "Next: Structured Data"}
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
