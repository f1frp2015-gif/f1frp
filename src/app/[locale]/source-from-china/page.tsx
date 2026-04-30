import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql, eq, and } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import {
  ShieldCheck,
  MapPin,
  Scale,
  ClipboardCheck,
  FileSearch,
  Package,
  Truck,
  Receipt,
  FileText,
  Search,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  PlatformHero,
  PlatformSectionHeading,
  PlatformCard,
  PlatformCardGrid,
} from "@/components/platform-card";
import { JsonLd } from "@/components/json-ld";
import {
  crosswalk,
  exportReadinessCerts,
  chinaFrpProvinces,
} from "@/lib/data/china-standards-crosswalk";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: "Source composites from China — f1frp",
    description:
      "Verified Chinese FRP suppliers, export-readiness certifications, GB ⇄ ASTM / ISO / EN standards crosswalk, and a 6-step sourcing playbook for overseas buyers.",
    alternates: { canonical: "https://f1frp.com/en/source-from-china" },
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

  // Province-level verified supplier counts
  const provinceCounts = await db
    .select({
      province: supplierListings.province,
      count: sql<number>`count(*)::int`,
    })
    .from(supplierListings)
    .where(eq(supplierListings.verified, true))
    .groupBy(supplierListings.province);

  const provinceMap = new Map<string, number>();
  provinceCounts.forEach((r) => {
    if (r.province) provinceMap.set(r.province, r.count);
  });

  // Verified supplier total
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(supplierListings)
    .where(eq(supplierListings.verified, true));

  // Certification stats — for each cert, count verified suppliers holding it
  const allVerified = await db
    .select({
      id: supplierListings.id,
      certifications: supplierListings.certifications,
    })
    .from(supplierListings)
    .where(eq(supplierListings.verified, true));

  const certCount = (needle: string) =>
    allVerified.filter((s) =>
      (s.certifications ?? []).some((c) =>
        c.toLowerCase().includes(needle.toLowerCase())
      )
    ).length;

  const url = "https://f1frp.com/en/source-from-china";

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
            "Verified Chinese FRP suppliers, export-ready certifications, standards crosswalk, and sourcing playbook for overseas buyers.",
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span>Source from China</span>
      </nav>

      <PlatformHero
        eyebrow="FOR OVERSEAS BUYERS"
        title="Source composites from China with confidence"
        description="Four things you need to qualify Chinese FRP suppliers fast: where they are, what they are certified for, how Chinese standards map to ASTM / ISO / EN, and the step-by-step playbook from spec to delivery. Built on our verified supplier database and curated by composite engineers."
      />

      {/* TOC */}
      <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { id: "suppliers", num: "01", label: "Verified suppliers", sub: "By region & capability" },
          { id: "certs", num: "02", label: "Export readiness", sub: "Certifications decoded" },
          { id: "standards", num: "03", label: "Standards crosswalk", sub: "GB ⇄ ASTM / ISO / EN" },
          { id: "playbook", num: "04", label: "Sourcing playbook", sub: "Spec → PO → Delivery" },
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

      {/* ═══ 01 — Verified suppliers map ═══ */}
      <section id="suppliers" className="mt-16 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 01 · VERIFIED SUPPLIERS"
          title="Where Chinese FRP capacity actually lives"
        />
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Chinese composites capacity is regionally clustered. Each province specializes
          in a specific slice of the value chain — knowing this saves weeks of RFQ
          blast. Click a region to see its verified suppliers.
        </p>

        {/* Stat strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Verified suppliers" value={total} />
          <StatCard label="Provinces covered" value={provinceCounts.length} />
          <StatCard label="Certified (ISO 9001+)" value={certCount("ISO 9001")} />
          <StatCard label="Export-ready (CE/ASME/API)" value={certCount("CE") + certCount("ASME") + certCount("API")} />
        </div>

        {/* Regional grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chinaFrpProvinces.map((p) => {
            const count = provinceMap.get(p.name) ?? 0;
            return (
              <Link
                key={p.code}
                href={`/suppliers?province=${encodeURIComponent(p.name)}` as never}
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/suppliers?verified=1"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Browse all verified suppliers
          </Link>
          <Link
            href="/ai?q=Find+a+verified+Chinese+supplier+for+FRP+gratings+with+CE+marking"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Ask AI to match a supplier →
          </Link>
        </div>
      </section>

      {/* ═══ 02 — Export readiness ═══ */}
      <section id="certs" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 02 · EXPORT READINESS"
          title="Certifications that actually unlock cross-border purchase orders"
        />
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          A certification only matters when your end-market requires it. This decodes
          the ones overseas buyers screen by, and shows how many suppliers on the
          platform currently hold each one.
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
          <strong>Note:</strong> A certificate is necessary but not sufficient — always
          cross-check scope (which products the cert covers), current status (not
          expired), and issuing body accreditation (CNAS / IAF / ANAB).
        </div>
      </section>

      {/* ═══ 03 — Standards crosswalk ═══ */}
      <section id="standards" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 03 · STANDARDS CROSSWALK"
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

      {/* ═══ 04 — Sourcing playbook ═══ */}
      <section id="playbook" className="mt-20 scroll-mt-20">
        <PlatformSectionHeading
          eyebrow="MODULE 04 · SOURCING PLAYBOOK"
          title="From specification to delivered cargo — the 6-step path"
        />
        <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          A condensed operational guide for first-time buyers of Chinese FRP. Each
          step links to the platform tool that accelerates it.
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

      {/* CTA */}
      <section className="mt-20 border border-border/70 bg-foreground p-10 text-background sm:p-14">
        <div className="max-w-3xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            ASK THE AI
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Get a shortlist in 30 seconds
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-background/80">
            Describe your product, target market, and required certifications.
            The AI will draw on the full supplier, material, and standards database
            to return a matched shortlist with evidence links.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/ai?q=I+need+to+source+FRP+gratings+with+EN+13706+E23+class+and+CE+marking+for+the+EU+market.+Recommend+verified+Chinese+suppliers."
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Try a sample sourcing query →
            </Link>
            <a
              href="mailto:doris.li@f1composite.com"
              className="inline-flex items-center gap-1.5 rounded-md border border-background/30 px-4 py-2 text-sm text-background transition-colors hover:bg-background/10"
            >
              Talk to our sourcing desk
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
