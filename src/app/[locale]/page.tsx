import {
  Database,
  FlaskConical,
  FileBadge,
  BookOpen,
  ShieldCheck,
  Building2,
  Layers,
  ArrowUpRight,
  Cpu,
  Bot,
  Workflow,
} from "lucide-react";
import { HomeAiPrompt } from "./home-ai-prompt";
import { sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import {
  materials as materialsTable,
  formulas as formulasTable,
  standards as standardsTable,
  papers as papersTable,
  patents as patentsTable,
  processes as processesTable,
  supplierListings,
} from "@/lib/db/schema";
import { priceData } from "@/lib/data/materials";
import { getLatestPublishedReport } from "@/lib/prices/queries";
import { newsList } from "@/lib/data/news";
import { ValueChainSection } from "@/components/value-chain-section";
import { HomePageEnglish } from "./home-english";
import { alternates } from "@/lib/seo";
import type { Metadata } from "next";

// Homepage live stats re-query DB on this cadence. DB count queries hit
// indexed tables so 60s is safe even under traffic.
export const revalidate = 60;

// Path-aware canonical + hreflang for the homepage. Layout no longer sets
// these (would have made every page point at root), so each route declares
// its own.
export const metadata: Metadata = {
  alternates: alternates("/"),
};

// AI-native capability groups. AI first, then data, then delivery.
const AI_CAPABILITIES = [
  { href: "/ai" as const, labelKey: "aiLabel", subKey: "aiSub", mono: "AI", Icon: Bot, primary: true },
  { href: "/materials" as const, labelKey: "materialsLabel", subKey: "materialsSub", mono: "MATERIALS", Icon: Database },
  { href: "/formulas" as const, labelKey: "formulasLabel", subKey: "formulasSub", mono: "FORMULAS", Icon: FlaskConical },
  { href: "/standards" as const, labelKey: "standardsLabel", subKey: "standardsSub", mono: "STANDARDS", Icon: FileBadge },
  { href: "/papers" as const, labelKey: "papersLabel", subKey: "papersSub", mono: "PAPERS", Icon: BookOpen },
  { href: "/patents" as const, labelKey: "patentsLabel", subKey: "patentsSub", mono: "PATENTS", Icon: ShieldCheck },
  { href: "/suppliers" as const, labelKey: "suppliersLabel", subKey: "suppliersSub", mono: "SUPPLIERS", Icon: Building2 },
  { href: "/tech" as const, labelKey: "techLabel", subKey: "techSub", mono: "TECH", Icon: Layers },
] as const;

const FIBERS = [
  { key: "glass", en: "Glass Fiber", stat: "E / ECR / S-glass" },
  { key: "carbon", en: "Carbon Fiber", stat: "T300 · T700 · T800" },
  { key: "basalt", en: "Basalt Fiber", statKey: "basaltStat" },
  { key: "aramid", en: "Aramid Fiber", stat: "Kevlar · Twaron" },
  { key: "bio", en: "Bio-based", statKey: "bioStat" },
] as const;

async function countOne(
  table: Parameters<typeof db.select>[0] extends infer _ ? Parameters<ReturnType<typeof db.select>["from"]>[0] : never
): Promise<number> {
  try {
    const rows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(table);
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // EN-side (getfrp.com) gets a sourcing-led layout aimed at overseas
  // FRP engineers / procurement. ZH side keeps the AI-platform layout
  // tuned for domestic suppliers.
  if (locale === "en") {
    return <HomePageEnglish />;
  }

  const t = await getTranslations("Home");
  const tm = await getTranslations("Home.modules");
  const tf = await getTranslations("Home.fibers");

  // Live counts — keep them resilient if DB is slow/unavailable.
  const [mCount, fCount, sCount, pCount, ptCount, supCount, techCount] =
    await Promise.all([
      countOne(materialsTable),
      countOne(formulasTable),
      countOne(standardsTable),
      countOne(papersTable),
      countOne(patentsTable),
      countOne(supplierListings),
      countOne(processesTable),
    ]);

  // Map each module to its live count. AI has no backing count (static sub).
  const countByHref: Record<string, number> = {
    "/materials": mCount,
    "/formulas": fCount,
    "/standards": sCount,
    "/papers": pCount,
    "/patents": ptCount,
    "/suppliers": supCount,
    "/tech": techCount,
  };

  const LIVE_STATS = [
    { value: mCount, labelKey: "statsMaterials", href: "/materials" as const },
    { value: fCount, labelKey: "statsFormulas", href: "/formulas" as const },
    { value: sCount, labelKey: "statsStandards", href: "/standards" as const },
    { value: pCount, labelKey: "statsPapers", href: "/papers" as const },
    { value: ptCount, labelKey: "statsPatents", href: "/patents" as const },
    { value: supCount, labelKey: "statsSuppliers", href: "/suppliers" as const },
  ];

  // 价格行情:最新已发布的一期(每周一更新);无则回退静态基线。
  const latestPriceReport = await getLatestPublishedReport();
  const prices =
    latestPriceReport?.quotes && latestPriceReport.quotes.length
      ? latestPriceReport.quotes
      : priceData;
  // 来源短名(取来源串中第一个词,去掉网址/括号说明),最多 3 个
  const priceSourceNames = (latestPriceReport?.sources ?? [])
    .slice(0, 3)
    .map((s) => s.split(/[ （(]/)[0])
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-sm opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              {t("eyebrow")}
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">
              {t("heroLine1")}
              <br />
              <span className="text-muted-foreground">{t("heroLine2")}</span>
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-muted-foreground sm:text-base">
              {t("heroDescription")}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={(locale === "en" ? "/source-from-china" : "/ai") as never}
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                {locale === "en" ? "Source from China" : t("ctaAi")}
              </Link>
              <Link
                href={(locale === "en" ? "/rfq" : "/materials") as never}
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {locale === "en" ? t("ctaAi") : t("ctaMaterials")}
              </Link>
              <Link
                href={
                  (locale === "en" ? "/suppliers" : "/papers") as never
                }
                className="ml-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Badge variant="signal" className="font-mono">
                  {t("badgeNew")}
                </Badge>
                {locale === "en" ? t("ctaMaterials") : t("ctaPapers")}
              </Link>
            </div>

            {/* Real AI prompt — typing + Enter / click goes to /ai?q=... */}
            <HomeAiPrompt placeholder={t("aiPromptPreview")} />
          </div>
        </div>
      </section>

      {/* ─────────── Full Value Chain (en only) ─────────── */}
      {locale === "en" && <ValueChainSection />}

      {/* ─────────── Three-layer stack ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex items-end justify-between border-b border-border/70 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("stackLabel")}
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("stackTitle")}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-3">
            <StackCard
              href="/platform/stack/ai-agent"
              Icon={Bot}
              title={t("stackAiTitle")}
              body={t("stackAiBody")}
              monoTag="AI AGENT"
              accent
            />
            <StackCard
              href="/platform/stack/data"
              Icon={Database}
              title={t("stackDataTitle")}
              body={t("stackDataBody")}
              monoTag="DATA"
            />
            <StackCard
              href="/platform/stack/delivery"
              Icon={Workflow}
              title={t("stackDeliverTitle")}
              body={t("stackDeliverBody")}
              monoTag="DELIVER"
            />
          </div>
        </div>
      </section>

      {/* ─────────── Live stats ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between border-b border-border/70 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("liveLabel")}
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("liveTitle")}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-6">
            {LIVE_STATS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group bg-background p-5 transition-colors hover:bg-muted/40"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.href.replace("/", "").toUpperCase()}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {s.value.toLocaleString()}
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                  />
                </div>
                <div className="mt-1 text-xs leading-snug text-muted-foreground">
                  {t(s.labelKey as "statsMaterials")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Capability grid (AI first) ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 divide-x divide-y divide-border/80 border-b border-border/80 sm:grid-cols-4">
            {AI_CAPABILITIES.map((m) => {
              const I = m.Icon;
              const isPrimary = "primary" in m && m.primary;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`group relative flex flex-col justify-between gap-8 p-6 transition-colors ${
                    isPrimary
                      ? "bg-foreground text-background hover:bg-foreground/95"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <I
                      className={
                        isPrimary
                          ? "text-background"
                          : "text-muted-foreground transition-colors group-hover:text-foreground"
                      }
                      size={22}
                      strokeWidth={1.5}
                    />
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.16em] transition-all ${
                        isPrimary
                          ? "text-background/70"
                          : "text-muted-foreground/70 group-hover:text-foreground"
                      }`}
                    >
                      {m.mono}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                      {tm(m.labelKey)}
                      <span
                        className={`translate-x-0 transition-all group-hover:translate-x-0.5 ${
                          isPrimary
                            ? "text-background/70 group-hover:text-background"
                            : "text-muted-foreground/40 group-hover:text-foreground"
                        }`}
                      >
                        →
                      </span>
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        isPrimary
                          ? "text-background/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tm(m.subKey, { count: countByHref[m.href] ?? 0 })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── Spotlight verticals: Pultrusion + HP-RTM ─────────── */}
      <section className="border-b border-border/80 bg-muted/20 py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          {/* Pultrusion */}
          <div className="flex flex-col justify-between gap-6 rounded-xl border border-border/70 bg-background p-6 sm:p-7">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("pultrusionLabel")}
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("pultrusionTitle")}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                {t("pultrusionBody")}
              </p>
            </div>
            <Link
              href={"/pultrusion" as never}
              className={buttonVariants({ size: "default", variant: "default" }) + " self-start"}
            >
              {t("pultrusionCta")}
            </Link>
          </div>

          {/* HP-RTM */}
          <div className="flex flex-col justify-between gap-6 rounded-xl border border-border/70 bg-background p-6 sm:p-7">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("hpRtmLabel")}
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("hpRtmTitle")}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                {t("hpRtmBody")}
              </p>
            </div>
            <Link
              href={"/hp-rtm" as never}
              className={buttonVariants({ size: "default", variant: "default" }) + " self-start"}
            >
              {t("hpRtmCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── Price + News (zh only — priceData is Chinese) ─────────── */}
      {locale === "zh" && (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <SectionHeading
                title={t("pricingTitle")}
                href="/trade"
                label={t("pricingLabel")}
                viewAll={t("viewAll")}
              />
              {latestPriceReport && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                  {t("priceUpdated", { date: latestPriceReport.weekOf })}
                  {priceSourceNames && (
                    <> · {t("priceSources", { names: priceSourceNames })}</>
                  )}
                </p>
              )}
              <div className="mt-4 divide-y divide-border/70 overflow-hidden rounded-md border border-border/70">
                {prices.slice(0, 8).map((p) => (
                  <div
                    key={p.name}
                    className="flex h-[54px] items-center justify-between bg-card px-4 transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <div className="text-sm">{p.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                        {p.region}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm">
                        ¥{p.price.toLocaleString()}
                      </span>
                      <span
                        className={`font-mono text-[11px] ${
                          p.change > 0
                            ? "text-red-600 dark:text-red-400"
                            : p.change < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {p.change > 0 ? "+" : ""}
                        {p.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <SectionHeading
                title={t("insightsTitle")}
                href="/articles"
                label={t("insightsLabel")}
                viewAll={t("viewAll")}
              />
              <div className="mt-4 overflow-hidden rounded-md border border-border/70">
                <ul className="divide-y divide-border/70">
                  {newsList.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <Link
                        href="/articles"
                        className="flex h-[54px] items-center gap-4 bg-card px-4 transition-colors hover:bg-muted/40"
                      >
                        <span className="shrink-0 pt-0.5 font-mono text-[11px] tracking-tight text-muted-foreground">
                          {n.date.slice(5)}
                        </span>
                        <span className="flex-1 text-sm leading-snug text-foreground/90 line-clamp-1">
                          {n.title}
                        </span>
                        {n.hot && (
                          <Badge variant="signal" className="ml-auto shrink-0">
                            {t("hotBadge")}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ─────────── Composite Matrix Teaser ─────────── */}
      <section className="border-t border-border/80 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between border-b border-border/70 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("matrixLabel")}
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("matrixTitle")}
              </h2>
            </div>
            <Link
              href={"/matrix" as never}
              className="group inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("matrixCta")}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {t("matrixLead")}
          </p>

          {/* Fiber cards row — kept from the old fiber section */}
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border/80 bg-border/80 sm:grid-cols-3 lg:grid-cols-5">
            {FIBERS.map((f) => (
              <Link
                key={f.key}
                href={`/fibers/${f.key}` as never}
                className="group block bg-background p-6 transition-colors hover:bg-muted/30"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {f.en}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-lg font-semibold tracking-tight">
                  {tf(f.key)}
                  <span className="text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground">
                    →
                  </span>
                </div>
                <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {"stat" in f ? f.stat : tf(f.statKey)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── AI CTA ─────────── */}
      <section className="border-t border-border/80 bg-muted/20 py-20">
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("aiEyebrow")}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("aiTitle")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {t("aiDescription")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/ai" className={buttonVariants({ size: "lg" })}>
              {t("aiCtaOpen")}
            </Link>
            <Link
              href="/formulas"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {t("aiCtaFormulas")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function StackCard({
  href,
  Icon,
  title,
  body,
  monoTag,
  accent,
}: {
  href: string;
  Icon: typeof Cpu;
  title: string;
  body: string;
  monoTag: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href as never}
      className={[
        "group relative flex flex-col gap-6 p-6 transition-colors sm:p-8",
        accent
          ? "bg-foreground text-background hover:bg-foreground/95"
          : "bg-background hover:bg-muted/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <Icon
          size={24}
          strokeWidth={1.5}
          className={accent ? "text-background" : "text-foreground"}
        />
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
            accent ? "text-background/70" : "text-muted-foreground"
          }`}
        >
          {monoTag}
        </span>
      </div>
      <div>
        <div
          className={`flex items-center gap-2 text-base font-semibold tracking-tight ${
            accent ? "text-background" : "text-foreground"
          }`}
        >
          <span>{title}</span>
          <span
            className={
              accent
                ? "text-background/70 transition-transform group-hover:translate-x-0.5"
                : "text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
            }
          >
            →
          </span>
        </div>
        <p
          className={`mt-2 text-sm leading-relaxed ${
            accent ? "text-background/85" : "text-muted-foreground"
          }`}
        >
          {body}
        </p>
      </div>
    </Link>
  );
}

function SectionHeading({
  label,
  title,
  href,
  viewAll,
}: {
  label: string;
  title: string;
  href?: string;
  viewAll?: string;
}) {
  return (
    <div className="flex items-end justify-between border-b border-border/70 pb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
      </div>
      {href && viewAll && (
        <Link
          href={href as "/trade" | "/articles"}
          className="group inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {viewAll}
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
