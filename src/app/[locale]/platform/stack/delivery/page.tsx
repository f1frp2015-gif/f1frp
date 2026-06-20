import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import {
  Workflow,
  Target,
  Mail,
  Download,
  Calculator,
  Building2,
  Globe,
  LayoutDashboard,
  Code2,
  Languages,
  UserCheck,
  Send,
  Cpu,
  Rocket,
  Repeat,
  Leaf,
  Shield,
  Plug,
  Users2,
  MessageSquare,
  User,
  ShoppingCart,
  Factory,
  Pencil,
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
    namespace: "Platform.Stack.Delivery",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/platform/stack/delivery"),
  };
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Stack.Delivery");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/platform" className="hover:text-foreground">
          {t("breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>Delivery</span>
      </nav>

      <PlatformHero eyebrow={t("eyebrow")} title={t("h1")} description={t("lead")} />

      <PlatformSectionHeading eyebrow={t("s1Label")} title={t("s1Title")} />
      <PlatformCardGrid columns={2}>
        <PlatformCard Icon={Target} monoLabel="OUTCOME" title={t("d1Title")} accent>
          <p>{t("d1Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Workflow} monoLabel="ONE-ACTION" title={t("d2Title")}>
          <p>{t("d2Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={Repeat} monoLabel="CLOSED-LOOP" title={t("d3Title")}>
          <p>{t("d3Body")}</p>
        </PlatformCard>
        <PlatformCard Icon={UserCheck} monoLabel="TIERING" title={t("d4Title")}>
          <p>{t("d4Body")}</p>
        </PlatformCard>
      </PlatformCardGrid>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s2Label")} title={t("s2Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Mail} monoLabel="RFQ" title={t("f1Title")}>
            <p>{t("f1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Download} monoLabel="DOWNLOADS" title={t("f2Title")}>
            <p>{t("f2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Calculator} monoLabel="CALCULATORS" title={t("f3Title")}>
            <p>{t("f3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Building2} monoLabel="CLAIM" title={t("f4Title")}>
            <p>{t("f4Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Globe} monoLabel="SEO" title={t("f5Title")}>
            <p>{t("f5Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={LayoutDashboard} monoLabel="DASHBOARD" title={t("f6Title")}>
            <p>{t("f6Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s3Label")} title={t("s3Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Code2} monoLabel="NEXT.JS 16" title={t("i1Title")}>
            <p>{t("i1Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Languages} monoLabel="I18N" title={t("i2Title")}>
            <p>{t("i2Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={UserCheck} monoLabel="CLERK" title={t("i3Title")}>
            <p>{t("i3Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Send} monoLabel="RESEND" title={t("i4Title")}>
            <p>{t("i4Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Calculator} monoLabel="CALC" title={t("i5Title")}>
            <p>{t("i5Body")}</p>
          </PlatformCard>
          <PlatformCard Icon={Cpu} monoLabel="VERCEL" title={t("i6Title")}>
            <p>{t("i6Body")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s4Label")} title={t("s4Title")} />
        <PlatformCardGrid columns={2}>
          <PlatformCard Icon={User} monoLabel="ENGINEER" title={t("u1Title")}>
            <p>{t("u1Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{t("u1Link")}</p>
          </PlatformCard>
          <PlatformCard Icon={ShoppingCart} monoLabel="BUYER" title={t("u2Title")}>
            <p>{t("u2Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{t("u2Link")}</p>
          </PlatformCard>
          <PlatformCard Icon={Factory} monoLabel="SUPPLIER" title={t("u3Title")}>
            <p>{t("u3Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{t("u3Link")}</p>
          </PlatformCard>
          <PlatformCard Icon={Pencil} monoLabel="DESIGNER" title={t("u4Title")}>
            <p>{t("u4Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{t("u4Link")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16">
        <PlatformSectionHeading eyebrow={t("s5Label")} title={t("s5Title")} />
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Globe} monoLabel="CROSS-BORDER" title={t("r1Title")} accent>
            <p>{t("r1Body")}</p>
            <p className="font-mono text-[11px] text-background/70">{t("r1When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Leaf} monoLabel="COMPLIANCE" title={t("r2Title")}>
            <p>{t("r2Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r2When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Shield} monoLabel="ENTERPRISE" title={t("r3Title")}>
            <p>{t("r3Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r3When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Plug} monoLabel="DATA API" title={t("r4Title")}>
            <p>{t("r4Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r4When")}</p>
          </PlatformCard>
          <PlatformCard Icon={Users2} monoLabel="EXPERT" title={t("r5Title")}>
            <p>{t("r5Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r5When")}</p>
          </PlatformCard>
          <PlatformCard Icon={MessageSquare} monoLabel="CHANNELS" title={t("r6Title")}>
            <p>{t("r6Body")}</p>
            <p className="font-mono text-[11px] text-muted-foreground/80">{t("r6When")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      <section className="mt-16 flex items-center justify-between border-t border-border/70 pt-8">
        <Link
          href={"/platform/stack/ai-agent" as never}
          className="font-mono text-[12px] uppercase tracking-wider text-foreground hover:underline"
        >
          → {locale === "zh" ? "返回：AI Agent 层" : "Back to: AI Agent"}
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
