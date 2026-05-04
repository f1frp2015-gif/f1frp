import { sql, isNotNull, eq, and, desc } from "drizzle-orm";
import {
  ShieldCheck,
  FileBadge,
  Building2,
  Award,
  ArrowRight,
  ChevronRight,
  Workflow,
  Bot,
  Database,
  FileSearch,
  Receipt,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import {
  supplierListings,
  materials as materialsTable,
  standards as standardsTable,
  papers as papersTable,
  patents as patentsTable,
} from "@/lib/db/schema";
import { JsonLd } from "@/components/json-ld";
import { HomeAiPrompt } from "./home-ai-prompt";

// English-side homepage. Sourcing-led; speaks directly to overseas FRP
// engineers and procurement managers landing on getfrp.com.
//
// Refresh on the same cadence as the ZH home — DB count queries are cheap.
// Re-exported via page.tsx; revalidate there is the source of truth.

const TRUST_BADGES = [
  {
    label: "CBAM-ready",
    sub: "Embedded carbon data on request",
    Icon: ShieldCheck,
  },
  {
    label: "REACH SVHC tracked",
    sub: "EU substance disclosures vetted",
    Icon: FileBadge,
  },
  {
    label: "GB ⇄ ASTM mapped",
    sub: "Standards crosswalk built-in",
    Icon: Database,
  },
  {
    label: "Sample → container",
    sub: "Single sourcing desk, end-to-end",
    Icon: Workflow,
  },
] as const;

const PLAYBOOK = [
  { n: "01", title: "Define spec", body: "Fiber, resin, process, target standard, end-market." },
  { n: "02", title: "Shortlist", body: "We match 3–5 verified suppliers by tier and certification." },
  { n: "03", title: "RFQ + samples", body: "Standardized RFQ, sample fee disclosed, lead time committed." },
  { n: "04", title: "Pre-shipment QA", body: "Independent inspection or our China sourcing desk on-site." },
  { n: "05", title: "Compliance pack", body: "CBAM data, REACH SVHC, MTC, COA, HS code, COO." },
  { n: "06", title: "Delivery", body: "FOB / CIF / DDP; consolidation in Shanghai / Ningbo / Tianjin." },
] as const;

const STANDARDS_CROSSWALK = [
  { topic: "Tensile properties of FRP", gb: "GB/T 1447", iso: "ISO 527-4", astm: "ASTM D3039" },
  { topic: "Flexural properties", gb: "GB/T 1449", iso: "ISO 14125", astm: "ASTM D790" },
  { topic: "Compressive properties", gb: "GB/T 1448", iso: "ISO 14126", astm: "ASTM D695" },
  { topic: "Pultruded profiles", gb: "GB/T 31539", iso: "ISO 8605", astm: "ASTM D3917" },
  { topic: "GRP pipes", gb: "GB/T 21238", iso: "ISO 10639", astm: "ASTM D2992" },
  { topic: "Fire — smoke / toxicity", gb: "GB 8624", iso: "ISO 5660-1", astm: "ASTM E84" },
] as const;

async function countOne(
  table: Parameters<typeof db.select>[0] extends infer _
    ? Parameters<ReturnType<typeof db.select>["from"]>[0]
    : never,
): Promise<number> {
  try {
    const rows = await db.select({ c: sql<number>`count(*)::int` }).from(table);
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

type SupplierRow = {
  id: string;
  nameEn: string | null;
  category: string | null;
  scaleTier: string | null;
};

const TIER_LABEL: Record<string, string> = {
  XL: "Major",
  L: "Large",
  M: "Mid",
  S: "Small",
};

export async function HomePageEnglish() {
  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;

  let verified: SupplierRow[] = [];
  try {
    verified = await db
      .select({
        id: supplierListings.id,
        nameEn: supplierListings.nameEn,
        category: supplierListings.category,
        scaleTier: supplierListings.scaleTier,
      })
      .from(supplierListings)
      .where(and(eq(supplierListings.verified, true), isNotNull(supplierListings.nameEn)))
      .orderBy(desc(tierRank));
  } catch {
    verified = [];
  }

  const total = verified.length;
  const tierCounts = verified.reduce<Record<string, number>>((acc, s) => {
    const t = s.scaleTier ?? "M";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const majorPlusLarge = (tierCounts.XL ?? 0) + (tierCounts.L ?? 0);

  const byCategory = new Map<string, number>();
  for (const r of verified) {
    const k = r.category ?? "manufacturer";
    byCategory.set(k, (byCategory.get(k) ?? 0) + 1);
  }
  const CATEGORY_LABEL: Record<string, string> = {
    manufacturer: "Manufacturers",
    fiber: "Fiber suppliers",
    resin: "Resin suppliers",
    additive: "Additives",
    equipment: "Equipment",
    mold: "Mold makers",
    tooling: "Tooling / NDT",
    service: "Testing / certification",
  };

  const [materialsCount, standardsCount, papersCount, patentsCount] =
    await Promise.all([
      countOne(materialsTable),
      countOne(standardsTable),
      countOne(papersTable),
      countOne(patentsTable),
    ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": "https://getfrp.com/#webpage",
              url: "https://getfrp.com/",
              name: "Source FRP composites from China — getfrp",
              inLanguage: "en",
              description:
                "Source FRP / GFRP / CFRP composites from verified Chinese manufacturers. ASTM-mapped specs, CBAM-ready paperwork, end-to-end RFQ to container.",
            },
            {
              "@type": "Service",
              "@id": "https://getfrp.com/#service",
              name: "China FRP sourcing service",
              serviceType: "Composite materials sourcing",
              areaServed: ["US", "DE", "FR", "GB", "IT", "ES", "NL", "PL", "AU", "CA"],
              provider: { "@id": "https://getfrp.com/#organization" },
              offers: {
                "@type": "Offer",
                description:
                  "Verified supplier shortlist, standardized RFQ, pre-shipment QA, CBAM/REACH compliance pack, end-to-end logistics.",
              },
            },
          ],
        }}
      />

      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-sm opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              FOR OVERSEAS FRP ENGINEERS &amp; BUYERS
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-[72px]">
              Source FRP composites
              <br />
              <span className="text-muted-foreground">from China.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-[15px] leading-[1.75] text-muted-foreground sm:text-base">
              {total > 0 ? `${total.toLocaleString()} verified Chinese ` : "Verified Chinese "}
              FRP / GFRP / CFRP suppliers, ranked by manufacturing scale —
              with ASTM-mapped specs, CBAM-ready paperwork, and a single sourcing
              desk from sample to container.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={"/suppliers?verified=1" as never}
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                Browse verified suppliers
                <ArrowRight size={16} className="ml-1.5" />
              </Link>
              <Link
                href={"/rfq" as never}
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Submit RFQ
              </Link>
              <Link
                href={"/source-from-china" as never}
                className="ml-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Badge variant="signal" className="font-mono">
                  GUIDE
                </Badge>
                Sourcing playbook (6 steps)
              </Link>
            </div>

            <HomeAiPrompt placeholder="Ask: Find a verified Chinese supplier for FRP gratings with CE marking…" />
          </div>
        </div>
      </section>

      {/* ─────────── Trust badges ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 lg:grid-cols-4">
            {TRUST_BADGES.map((b) => {
              const I = b.Icon;
              return (
                <div key={b.label} className="flex items-start gap-3 bg-background p-5">
                  <I size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-foreground" />
                  <div>
                    <div className="text-sm font-semibold tracking-tight">{b.label}</div>
                    <div className="mt-1 text-xs leading-snug text-muted-foreground">
                      {b.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── Verified suppliers by category ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between border-b border-border/70 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                MODULE 01 · DIRECTORY
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                Verified suppliers by category, ranked by scale
              </h2>
            </div>
            <Link
              href={"/source-from-china" as never}
              className="group hidden items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              See full directory
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Scale tier:
            </span>
            {(["XL", "L", "M", "S"] as const).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 border border-border/80 bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              >
                {TIER_LABEL[t]}
                <span className="text-[9px] opacity-60">({tierCounts[t] ?? 0})</span>
              </span>
            ))}
            <span className="ml-auto text-[11px] text-muted-foreground">
              {majorPlusLarge.toLocaleString()} Major + Large tier
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(CATEGORY_LABEL).map(([catId, label]) => {
              const count = byCategory.get(catId) ?? 0;
              return (
                <Link
                  key={catId}
                  href={`/suppliers?category=${catId}` as never}
                  className="group bg-background p-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between">
                    <Building2
                      size={18}
                      strokeWidth={1.5}
                      className="text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 group-hover:text-foreground">
                      {String(count).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[14px] font-semibold tracking-tight">
                    {label}
                    <ChevronRight
                      size={14}
                      className="text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── Standards crosswalk ─────────── */}
      <section className="border-b border-border/80 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between border-b border-border/70 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                MODULE 02 · STANDARDS
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                GB ⇄ ASTM / ISO crosswalk
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Chinese suppliers ship on GB-numbered methods. Your spec sheet
                is in ASTM or ISO. Here&apos;s the mapping for the six tests
                that decide most FRP buys.
              </p>
            </div>
            <Link
              href={"/standards" as never}
              className="group hidden items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              {standardsCount > 0
                ? `${standardsCount.toLocaleString()} standards →`
                : "All standards →"}
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-md border border-border/70 bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/40 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-mono font-normal">Property</th>
                  <th className="px-4 py-3 font-mono font-normal">China (GB)</th>
                  <th className="px-4 py-3 font-mono font-normal">ISO</th>
                  <th className="px-4 py-3 font-mono font-normal">ASTM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {STANDARDS_CROSSWALK.map((row) => (
                  <tr key={row.topic} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.topic}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.gb}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.iso}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.astm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Need a method not listed? Ask the AI assistant — it will cite the
            full standard text.
          </p>
        </div>
      </section>

      {/* ─────────── Sourcing playbook (6 steps) ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between border-b border-border/70 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                MODULE 03 · PLAYBOOK
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                Spec → PO → Container in 6 steps
              </h2>
            </div>
            <Link
              href={"/source-from-china#playbook" as never}
              className="group hidden items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Full playbook →
            </Link>
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
            {PLAYBOOK.map((s) => (
              <div key={s.n} className="bg-background p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  STEP {s.n}
                </div>
                <div className="mt-2 text-[15px] font-semibold tracking-tight">
                  {s.title}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Engineer tools (secondary) ─────────── */}
      <section className="border-b border-border/80 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MODULE 04 · ENGINEER TOOLS
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Pre-RFQ research, in one workbench
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 sm:grid-cols-4">
            {[
              {
                href: "/ai" as const,
                label: "AI spec lookup",
                sub: "Cited answers, no hallucination",
                Icon: Bot,
                primary: true,
              },
              {
                href: "/materials" as const,
                label: "Materials",
                sub: `${materialsCount.toLocaleString()} grades`,
                Icon: Database,
              },
              {
                href: "/papers" as const,
                label: "Papers",
                sub: `${papersCount.toLocaleString()} indexed`,
                Icon: FileSearch,
              },
              {
                href: "/patents" as const,
                label: "Patents",
                sub: `${patentsCount.toLocaleString()} CN/US/EU`,
                Icon: ShieldCheck,
              },
            ].map((m) => {
              const I = m.Icon;
              const isPrimary = "primary" in m && m.primary;
              return (
                <Link
                  key={m.href}
                  href={m.href as never}
                  className={`group relative flex flex-col justify-between gap-8 p-6 transition-colors ${
                    isPrimary
                      ? "bg-foreground text-background hover:bg-foreground/95"
                      : "bg-background hover:bg-muted/40"
                  }`}
                >
                  <I
                    size={20}
                    strokeWidth={1.5}
                    className={isPrimary ? "text-background" : "text-foreground"}
                  />
                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                      {m.label}
                      <span
                        className={
                          isPrimary
                            ? "text-background/70 transition-transform group-hover:translate-x-0.5"
                            : "text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                        }
                      >
                        →
                      </span>
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        isPrimary ? "text-background/80" : "text-muted-foreground"
                      }`}
                    >
                      {m.sub}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── Trust / About strip ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                WHO YOU&apos;RE BUYING FROM
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                A China-based sourcing desk, run by composites engineers.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                getfrp is the English desk of <strong>F1 Composite</strong> /
                Yaoyi Advanced Materials — a Chongqing-registered exporter
                that has been visiting FRP plants in person since 2015. We
                handle paperwork, payment routing, on-site QA, and the
                Mandarin-only conversations that sink most overseas RFQs.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={"/about" as never}
                  className={buttonVariants({ size: "default", variant: "outline" })}
                >
                  About F1 Composite
                </Link>
                <a
                  href="mailto:doris.li@f1composite.com"
                  className={buttonVariants({ size: "default", variant: "default" })}
                >
                  Talk to our sourcing desk
                  <ArrowRight size={14} className="ml-1.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TrustStat label="Verified suppliers" value={total} />
              <TrustStat label="Major + Large tier" value={majorPlusLarge} />
              <TrustStat label="Materials indexed" value={materialsCount} />
              <TrustStat label="Standards mapped" value={standardsCount} />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Final CTA ─────────── */}
      <section className="bg-foreground py-16 text-background sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            START YOUR FRP RFQ
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell us your spec.
            <br />
            <span className="text-background/70">
              We&apos;ll come back with 3–5 verified quotes.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-background/80">
            Fiber, resin, process, target standard, target country, quantity.
            Five fields. We do the rest.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={"/rfq" as never}
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              <Receipt size={16} />
              Submit RFQ
            </Link>
            <Link
              href={"/source-from-china" as never}
              className="inline-flex items-center gap-1.5 rounded-md border border-background/30 px-6 py-3 text-sm transition-colors hover:bg-background/10"
            >
              Read the playbook first
            </Link>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-[11px] text-background/60">
            <Award size={12} />
            No registration required to submit your first RFQ.
          </div>
        </div>
      </section>
    </>
  );
}

function TrustStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border/70 bg-background p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
