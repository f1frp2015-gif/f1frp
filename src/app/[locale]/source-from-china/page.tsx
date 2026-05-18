import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql, eq, and, desc, isNotNull } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import {
  ShieldCheck,
  MapPin,
  ClipboardCheck,
  FileSearch,
  Truck,
  Receipt,
  FileText,
  Search,
  ChevronRight,
  Building2,
  Award,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { alternates } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import { Badge } from "@/components/ui/badge";
import {
  PlatformHero,
  PlatformSectionHeading,
  PlatformCard,
  PlatformCardGrid,
} from "@/components/platform-card";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { TestimonialsBlock } from "@/components/testimonials-block";
import {
  crosswalk,
  exportReadinessCerts,
  chinaFrpProvinces,
} from "@/lib/data/china-standards-crosswalk";
import { supplierCategories, provincesEn } from "@/lib/data/suppliers";

export const revalidate = 3600;

// Western buyers expect a clear scale signal at-a-glance — translate internal
// XL/L/M/S codes into descriptive labels rather than leaking jargon.
const TIER_META: Record<string, { label: string; rank: number; tone: string }> = {
  XL: {
    label: "Major",
    rank: 4,
    tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  L: {
    label: "Large",
    rank: 3,
    tone: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  M: {
    label: "Mid",
    rank: 2,
    tone: "border-border bg-muted text-foreground",
  },
  S: {
    label: "Small",
    rank: 1,
    tone: "border-border/60 bg-background text-muted-foreground",
  },
};

const TOP_PER_CATEGORY = 6;

type VerifiedRow = {
  id: string;
  nameEn: string | null;
  locationEn: string | null;
  province: string | null;
  category: string | null;
  productsEn: string[] | null;
  certificationsEn: string[] | null;
  scaleTier: string | null;
  brandPriority: number;
  viewCount: number;
  established: number | null;
};

export function generateMetadata(): Metadata {
  return {
    title:
      "Source FRP composites from China: verified suppliers, ranked by scale",
    description:
      "A directory of independently verified Chinese FRP suppliers — fiber, resin, equipment, mold makers — sorted by manufacturing scale. Plus the GB ⇄ ASTM / ISO / EN standards crosswalk and a 6-step sourcing playbook for overseas buyers.",
    alternates: alternates("/source-from-china"),
  };
}

export default async function SourceFromChinaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  setRequestLocale(locale);

  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;

  // Pull verified suppliers with English names, pre-sorted by scale.
  // One query feeds: top-N per category, province counts, cert counts, hero stats.
  const verified: VerifiedRow[] = await db
    .select({
      id: supplierListings.id,
      nameEn: supplierListings.nameEn,
      locationEn: supplierListings.locationEn,
      province: supplierListings.province,
      category: supplierListings.category,
      productsEn: supplierListings.productsEn,
      certificationsEn: supplierListings.certificationsEn,
      scaleTier: supplierListings.scaleTier,
      brandPriority: supplierListings.brandPriority,
      viewCount: supplierListings.viewCount,
      established: supplierListings.established,
    })
    .from(supplierListings)
    .where(
      and(
        eq(supplierListings.verified, true),
        isNotNull(supplierListings.nameEn)
      )
    )
    .orderBy(
      desc(tierRank),
      desc(supplierListings.brandPriority),
      desc(supplierListings.viewCount)
    );

  const total = verified.length;

  // Group by category (already scale-ordered from SQL).
  const byCategory = new Map<string, VerifiedRow[]>();
  for (const row of verified) {
    const cat = row.category ?? "manufacturer";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(row);
  }

  // Province counts keyed by Chinese province token (DB native), then mapped
  // to English at render time. Fixes a latent bug where the previous build
  // looked up English keys against Chinese-stored values and got zero counts.
  const provinceCounts = new Map<string, number>();
  for (const row of verified) {
    if (!row.province) continue;
    provinceCounts.set(row.province, (provinceCounts.get(row.province) ?? 0) + 1);
  }
  const provincesCovered = provinceCounts.size;

  // Cert counts: case-insensitive substring match against the EN cert list.
  const certCount = (needle: string) =>
    verified.filter((s) =>
      (s.certificationsEn ?? []).some((c) =>
        c.toLowerCase().includes(needle.toLowerCase())
      )
    ).length;

  const tierCounts = verified.reduce<Record<string, number>>((acc, s) => {
    const t = s.scaleTier ?? "M";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const majorPlusLarge = (tierCounts.XL ?? 0) + (tierCounts.L ?? 0);

  const url = `${CURRENT_SITE_URL}/source-from-china`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          url,
          inLanguage: "en",
          name: "Source composites from China",
          description:
            "Verified Chinese FRP suppliers organized by category and ranked by scale tier, with export-ready certifications, standards crosswalk, and sourcing playbook for overseas buyers.",
        }}
      />
      {/* FAQPage schema: explicit Q&A surface that Perplexity, Google AI
          Overviews and ChatGPT search preferentially extract and cite.
          Pulled from the questions overseas buyers actually ask the
          sourcing desk; mirrors content visible on this page. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do I source FRP composites from China without speaking Mandarin?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Use a curated directory like getfrp.com that has already verified suppliers and translated their certifications, then submit an RFQ in English. A bilingual sourcing desk handles the factory-side conversation in Mandarin and reports back in your unit system. Most overseas buyers shortlist 3-5 verified plants and request samples before placing the first PO.",
              },
            },
            {
              "@type": "Question",
              name: "Which Chinese province makes which FRP product?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Jiangsu dominates resin (unsaturated polyester, vinyl ester, epoxy) and downstream pultrusion. Shandong is the fiber heartland (E-glass, ECR-glass, S-glass, carbon fiber tow). Zhejiang covers mid-volume manufacturing, especially fabric and prepreg. Henan and Shanxi are the basalt fiber clusters. Knowing the province before the RFQ filters out three-quarters of the no-fit responses.",
              },
            },
            {
              "@type": "Question",
              name: "What is the GB equivalent of ASTM D3039 for tensile testing?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "GB/T 1447-2005 is China's analog to ASTM D3039 for tensile properties of fiber-reinforced plastics. The specimen geometry and gripping requirements are similar but not identical; for safety-critical structural parts, request the test panel be cut to ASTM D3039 dimensions and tested at a CNAS-accredited lab (SGS / Bureau Veritas / Intertek / TUV China).",
              },
            },
            {
              "@type": "Question",
              name: "What documentation do I need from a Chinese FRP supplier for EU CBAM compliance?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "For CBAM Default Values you need: 1) verified business license + USCC, 2) Material Test Certificate per batch (composition, fiber/resin ratio), 3) energy mix declaration covering the production site, 4) embedded carbon calculation (kgCO2 per kg product) using the EU Commission's CBAM Default Values or installation-specific data. getfrp's sourcing desk pre-generates this pack on first shipment.",
              },
            },
            {
              "@type": "Question",
              name: "How are Chinese FRP suppliers tier-classified (Major / Large / Mid / Small)?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Major = publicly listed groups and Tier-1 manufacturers, annual output > 50,000 tons. Large = established mid-cap producers, 10,000-50,000 tons. Mid = regional specialists, 1,000-10,000 tons. Small = SME niche players, < 1,000 tons. The tier is field-validated by a site visit, not self-reported. Most overseas RFQs go to Major or Large for risk-managed volume; Mid and Small win when you need niche capability the big plants won't bother with.",
              },
            },
            {
              "@type": "Question",
              name: "What payment terms are standard for first-time FRP imports from China?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Standard terms: 30% deposit against proforma invoice, 70% on B/L copy. For first-time orders above USD 50,000, prefer an LC at sight to limit counterparty risk. Always name in the contract: exact certifications required, batch traceability format, packaging spec, and the AQL sampling plan for pre-shipment inspection.",
              },
            },
          ],
        }}
      />

      <PageBreadcrumbs
        trail={[{ label: "Source from China", href: "/source-from-china" }]}
      />

      <PlatformHero
        eyebrow="FOR OVERSEAS BUYERS"
        title="Source FRP from China, by category, ranked by scale"
        description="Skip the cold-call grind. Each supplier below has been independently audited. They're sorted by manufacturing scale and tagged with the certifications your end-market actually screens for."
      />

      {/* TL;DR — scan UX. Western B2B buyers triage in 5-8 seconds; surface
          the four most actionable answers above everything else so a buyer
          can rule the page in or out without scrolling. */}
      <section className="mb-10 rounded-xl border border-border/70 bg-muted/20 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          TL;DR · WHAT THIS PAGE COVERS
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            "A directory of independently audited Chinese FRP plants, sorted by manufacturing scale tier (Major / Large / Mid / Small)",
            "Province-by-province map of where each FRP product category is actually made (resin = Jiangsu, fiber = Shandong, etc.)",
            "GB ⇄ ASTM ⇄ ISO ⇄ EN standards crosswalk — set spec expectations before the RFQ, not after",
            "A 6-step sourcing playbook from spec to delivered cargo, with payment / QC / Incoterms benchmarks",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 text-[13.5px] leading-relaxed text-foreground/90"
            >
              <ChevronRight
                size={13}
                className="mt-1 shrink-0 text-foreground/60"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust strip — lifted to top so Western readers see the proof before the chrome */}
      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Plants audited on the ground" value={total} />
        <StatCard label="Major + Large tier" value={majorPlusLarge} />
        <StatCard label="Provinces covered" value={provincesCovered} />
        <StatCard
          label="ISO 9001 holders"
          value={certCount("ISO 9001")}
        />
      </div>

      {/* Primary CTA strip */}
      <div className="mb-14 flex flex-wrap items-center gap-3 border-y border-border/70 py-5">
        <Link
          href="/suppliers?verified=1"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Browse all {total.toLocaleString()} verified suppliers
          <ChevronRight size={14} />
        </Link>
        <Link
          href="/ai?q=Find+a+verified+Chinese+supplier+for+FRP+gratings+with+CE+marking"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-5 py-2.5 text-sm transition-colors hover:bg-muted"
        >
          Ask AI to match a supplier
        </Link>
        <a
          href="mailto:f1frp2015@gmail.com"
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Or email tech support →
        </a>
      </div>

      {/* TOC */}
      <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { id: "directory", num: "01", label: "Suppliers by category", sub: "Ranked by scale tier" },
          { id: "regions", num: "02", label: "Suppliers by region", sub: "China's FRP clusters" },
          { id: "certs", num: "03", label: "Export readiness", sub: "Certifications decoded" },
          { id: "standards", num: "04", label: "Standards crosswalk", sub: "GB ⇄ ASTM / ISO / EN" },
          { id: "playbook", num: "05", label: "Sourcing playbook", sub: "Spec → PO → Delivery" },
          { id: "topics", num: "06", label: "Topic deep dives", sub: "Grating · Rebar · CBAM · GB-vs-ASTM" },
        ].map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="group flex items-center justify-between border border-border/70 bg-background p-4 transition-colors hover:border-foreground"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                MODULE {i.num}
              </div>
              <div className="mt-1 text-sm font-semibold">{i.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{i.sub}</div>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </a>
        ))}
      </div>

      {/* ═══ 01 — Suppliers by category, ranked by scale ═══ */}
      <section id="directory" className="mt-16 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 01 · DIRECTORY"
          title="Verified suppliers by category, ranked by scale"
        />
        <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Each category below lists the largest verified suppliers first.
          Tiers run from Major (listed groups, Tier-1 manufacturers) down
          through Large, Mid (regional specialists) and Small. Most overseas
          RFQs go to Major or Large for low risk; Mid and Small are where
          you find the niche capabilities the big plants won&apos;t bother with.
        </p>

        {/* Tier legend */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Scale tier:
          </span>
          {(["XL", "L", "M", "S"] as const).map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TIER_META[t].tone}`}
            >
              {TIER_META[t].label}
              <span className="text-[9px] opacity-60">
                ({tierCounts[t] ?? 0})
              </span>
            </span>
          ))}
        </div>

        {/* Category blocks */}
        <div className="space-y-10">
          {supplierCategories
            .map((c) => ({
              cat: c,
              rows: byCategory.get(c.id) ?? [],
            }))
            .filter((b) => b.rows.length > 0)
            .map(({ cat, rows }) => (
              <CategoryBlock
                key={cat.id}
                title={cat.nameEn}
                count={rows.length}
                categoryId={cat.id}
                rows={rows.slice(0, TOP_PER_CATEGORY)}
              />
            ))}
        </div>
      </section>

      {/* ═══ 02 — Verified suppliers by region ═══ */}
      <section id="regions" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 02 · REGIONAL CLUSTERS"
          title="Where Chinese FRP capacity actually lives"
        />
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Chinese composites capacity is regionally clustered. Jiangsu does
          resin, Shandong does fiber, Zhejiang does mid-volume manufacturing,
          Henan and Shanxi cover basalt. Knowing which province handles your
          slice of the value chain saves weeks of RFQ blast and weeds out
          three-quarters of the no-fit responses upfront.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chinaFrpProvinces.map((p) => {
            // The DB stores Chinese province tokens; reverse-lookup via
            // provincesEn map (English → Chinese is the inverse direction
            // we already publish).
            const zhKey = Object.entries(provincesEn).find(
              ([, en]) => en === p.name
            )?.[0];
            const count = zhKey ? (provinceCounts.get(zhKey) ?? 0) : 0;
            return (
              <Link
                key={p.code}
                href={
                  zhKey
                    ? (`/suppliers?province=${encodeURIComponent(zhKey)}` as never)
                    : ("/suppliers" as never)
                }
                className="group block border border-border/70 bg-background p-4 transition-colors hover:border-foreground"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-8 items-center justify-center border border-border bg-muted font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                      {p.code}
                    </span>
                    <span className="text-sm font-semibold">{p.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {count} verified
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{p.specialty}</p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                  View suppliers
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ 03 — Export readiness ═══ */}
      <section id="certs" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 03 · EXPORT READINESS"
          title="Certifications that actually unlock cross-border purchase orders"
        />
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          A certification only matters when your end-market requires it. This
          decodes the ones overseas buyers screen by, and shows how many
          suppliers on the platform currently hold each one.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {exportReadinessCerts.map((c) => {
            const n = certCount(c.id === "ccs" ? "CCS" : c.name);
            return (
              <div
                key={c.id}
                className="border border-border/70 bg-background p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-foreground" strokeWidth={1.5} />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {c.scope}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {n} suppliers
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {c.why}
                </p>
                {n > 0 && (
                  <Link
                    href={`/suppliers?cert=${encodeURIComponent(c.name)}` as never}
                    className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-foreground hover:underline"
                  >
                    See holders →
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Note:</strong> A certificate is necessary but not sufficient. Three
          things still need cross-checking: the scope (which products the cert
          covers), the current status (most lapses we see are mid-2-year
          renewal cycles), and the issuing body&apos;s accreditation chain
          (CNAS / IAF / ANAB). A &quot;ISO 9001 certified&quot; line item on a
          factory profile usually means one of these three is missing.
        </div>
      </section>

      {/* ═══ 04 — Standards crosswalk ═══ */}
      <section id="standards" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 04 · STANDARDS CROSSWALK"
          title="GB ⇄ ASTM / ISO / EN for composite test methods and products"
        />
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          If your supplier tests per GB, does that satisfy your ASTM-based spec?
          Short answer: often structurally similar, sometimes geometrically different.
          Use this table to set expectations before the RFQ, not after.
        </p>

        <div className="overflow-x-auto border border-border/70">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="p-3">Topic</th>
                <th className="p-3">China (GB)</th>
                <th className="p-3">International equivalents</th>
              </tr>
            </thead>
            <tbody>
              {crosswalk.map((r) => (
                <tr key={r.gb} className="border-t border-border/70 align-top">
                  <td className="p-3">
                    <div className="font-semibold">{r.topicEn}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{r.topic}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs font-semibold">{r.gb}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {r.gbTitle}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1.5">
                      {r.intl.map((i) => (
                        <div key={i.code} className="flex items-start gap-2">
                          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                            {i.body}
                          </Badge>
                          <div>
                            <div className="font-mono text-xs font-semibold">{i.code}</div>
                            <div className="text-[11px] leading-snug text-muted-foreground">
                              {i.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {r.note && (
                      <p className="mt-2 text-[11px] italic text-muted-foreground">
                        {r.note}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Curated by the f1frp editorial team. Submit corrections or additions to{" "}
          <a className="text-foreground underline" href="mailto:f1frp2015@gmail.com">
            f1frp2015@gmail.com
          </a>.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/standards"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Browse full standards database →
          </Link>
        </div>
      </section>

      {/* ═══ 05 — Sourcing playbook ═══ */}
      <section id="playbook" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 05 · SOURCING PLAYBOOK"
          title="From spec to delivered cargo: the 6-step path"
        />
        <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          A condensed operational guide if this is your first time buying FRP
          from China. Each step links to the tool on this site that does the
          heavy lifting for it.
        </p>

        <PlatformCardGrid columns={3}>
          <PlatformCard
            Icon={FileText}
            monoLabel="STEP 01"
            number="01"
            title="Lock the specification"
            accent
          >
            <p>
              Before talking to any supplier, write a one-page spec: product, grade,
              geometry, key property targets (tensile / flexural / HDT), applicable
              standard, and end-use environment.
            </p>
            <p className="mt-2 font-mono text-[11px] text-background/70">
              Tool: <span className="underline">/materials</span> to benchmark property ranges
            </p>
          </PlatformCard>

          <PlatformCard Icon={Search} monoLabel="STEP 02" number="02" title="Shortlist 3–5 suppliers">
            <p>
              Filter by province (capability cluster), by process capability, and by
              certifications that match your market. Aim for 3–5 — more creates RFQ
              overhead without improving price discovery.
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
              Tool: <Link href="/suppliers?verified=1" className="underline">verified directory</Link>
            </p>
          </PlatformCard>

          <PlatformCard Icon={ClipboardCheck} monoLabel="STEP 03" number="03" title="Issue the RFQ">
            <p>
              Send identical RFQ packets with the spec, target volume (3-month & 12-month),
              Incoterms (FOB / CIF / DAP), required documentation (MTC, test reports), and
              target price range.
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
              Tool: AI-assisted RFQ drafting at <Link href="/ai" className="underline">/ai</Link>
            </p>
          </PlatformCard>

          <PlatformCard Icon={FileSearch} monoLabel="STEP 04" number="04" title="Qualify with samples">
            <p>
              Request 3–5 pieces for independent third-party testing (SGS / Bureau Veritas /
              TÜV labs in China). Never skip this for structural or safety-critical parts.
              Cost: typically USD 500–2,000 per test panel.
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
              Tool: <Link href="/standards" className="underline">standards database</Link> for test-method selection
            </p>
          </PlatformCard>

          <PlatformCard Icon={Receipt} monoLabel="STEP 05" number="05" title="Contract & payment">
            <p>
              Standard terms: 30% deposit against PI, 70% on B/L copy. First-time orders
              should use LC at sight for &gt; USD 50k. Always name the exact certifications,
              batch traceability, and packaging spec in the contract.
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
              Reference: Incoterms 2020, ICC Publication 723E
            </p>
          </PlatformCard>

          <PlatformCard Icon={Truck} monoLabel="STEP 06" number="06" title="Pre-shipment QC & delivery">
            <p>
              Pre-shipment inspection (PSI) at factory — random sampling per AQL. MTC,
              CoC, and packing list must match the PO. For FRP, verify cure state and
              visual defect class per ASTM D4385 or EN 13706.
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
              QC vendors: SGS, Intertek, Bureau Veritas, TÜV Rheinland China
            </p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>

      {/* ═══ 06 — Sourcing topic deep dives ═══ */}
      <section id="topics" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 06 · DEEP DIVES"
          title="Topic-specific sourcing guides"
        />
        <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Buying-intent guides for the specific FRP product, compliance, and
          standards questions overseas buyers ask the sourcing desk most often.
          Each page covers process choice, certifications, pricing benchmarks,
          and the verified Chinese plants that already ship into the target
          market.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              slug: "frp-grating",
              title: "FRP grating supplier shortlist",
              sub: "Molded vs pultruded, CE / EN 13706 / DNV — pricing & MOQs",
            },
            {
              slug: "frp-rebar",
              title: "FRP rebar (GFRP / BFRP / CFRP)",
              sub: "ACI 440.6 / ASTM D7957 — fiber system selection",
            },
            {
              slug: "cbam-frp-china",
              title: "CBAM compliance document pack",
              sub: "Default values vs installation data, accredited verifiers",
            },
            {
              slug: "gb-vs-astm-frp",
              title: "GB ⇄ ASTM ⇄ ISO ⇄ EN test method crosswalk",
              sub: "30+ FRP test methods mapped side-by-side",
            },
          ].map((it) => (
            <Link
              key={it.slug}
              href={`/sourcing/${it.slug}` as never}
              className="group flex items-start justify-between gap-4 border border-border/70 bg-background p-5 transition-colors hover:border-foreground"
            >
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  {it.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {it.sub}
                </div>
              </div>
              <ChevronRight
                size={14}
                className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Buyer testimonials (renders null until populated) */}
      <TestimonialsBlock className="mt-20" />

      {/* Newsletter signup */}
      <div className="mt-16">
        <NewsletterSignup topic="source-from-china" />
      </div>

      {/* CTA */}
      <section className="mt-16 border border-border/70 bg-foreground p-10 text-background sm:p-14">
        <div className="max-w-3xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            ASK THE AI
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Get a shortlist in 30 seconds
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-background/80">
            Describe what you need: product, target market, certifications you
            care about. The AI pulls from the supplier, material and standards
            tables and gives back a shortlist with the row link for each
            claim, so you can verify before forwarding to procurement.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/ai?q=I+need+to+source+FRP+gratings+with+EN+13706+E23+class+and+CE+marking+for+the+EU+market.+Recommend+verified+Chinese+suppliers."
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Try a sample sourcing query →
            </Link>
            <a
              href="mailto:f1frp2015@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-md border border-background/30 px-4 py-2 text-sm text-background transition-colors hover:bg-background/10"
            >
              Email tech support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border/70 bg-background p-4 text-center">
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function CategoryBlock({
  title,
  count,
  categoryId,
  rows,
}: {
  title: string;
  count: number;
  categoryId: string;
  rows: VerifiedRow[];
}) {
  return (
    <div className="border border-border/70 bg-background">
      {/* Category header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <Building2 size={18} strokeWidth={1.5} className="text-muted-foreground" />
          <div>
            <div className="text-base font-semibold tracking-tight">{title}</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {count} verified · top {Math.min(rows.length, count)} shown
            </div>
          </div>
        </div>
        <Link
          href={`/suppliers?category=${encodeURIComponent(categoryId)}` as never}
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          See all {count}
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* Supplier rows */}
      <ul className="divide-y divide-border/70">
        {rows.map((s, idx) => {
          const tier = s.scaleTier ?? "M";
          const meta = TIER_META[tier] ?? TIER_META.M;
          const provinceEn = s.province ? (provincesEn[s.province] ?? s.province) : null;
          const certs = (s.certificationsEn ?? []).slice(0, 3);
          return (
            <li key={s.id}>
              <Link
                href={`/suppliers/${s.id}` as "/suppliers/[id]"}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  #{String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold tracking-tight">
                      {s.nameEn}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tone}`}
                      title={`Scale tier: ${tier}`}
                    >
                      {meta.label}
                    </span>
                    {provinceEn && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin size={10} />
                        {provinceEn}
                      </span>
                    )}
                    {s.established && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        est. {s.established}
                      </span>
                    )}
                  </div>
                  {certs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Award size={10} className="text-muted-foreground" />
                      {certs.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="font-mono text-[9px] uppercase tracking-wider"
                        >
                          {c}
                        </Badge>
                      ))}
                      {(s.certificationsEn ?? []).length > 3 && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          +{(s.certificationsEn ?? []).length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
