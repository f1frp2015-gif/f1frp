import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import {
  ShieldCheck,
  MapPin,
  Building2,
  Award,
  Calendar,
  ArrowRight,
  ChevronRight,
  PackageOpen,
  Factory,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { supplierCategories, provincesEn } from "@/lib/data/suppliers";
import { chinaFrpProvinces } from "@/lib/data/china-standards-crosswalk";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { alternates } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";

// Cache for an hour: supplier data changes rarely, and a stale supplier page
// is far cheaper than re-querying Postgres on every crawl.
export const revalidate = 3600;
// Pre-render the top-200 most authoritative suppliers at build time. The
// rest are ISR-rendered on first hit (Vercel caches afterwards). 200 is the
// same cap used by /suppliers SSR, so we never have a supplier visible on
// the directory that isn't pre-rendered.
export const dynamicParams = true;

const TIER_LABEL: Record<string, { label: string; sentence: string }> = {
  XL: {
    label: "Major",
    sentence:
      "publicly listed groups and Tier-1 manufacturers, typical annual output above 50,000 tons",
  },
  L: {
    label: "Large",
    sentence:
      "established mid-cap producers with 10,000–50,000 tons annual capacity",
  },
  M: {
    label: "Mid",
    sentence:
      "regional specialists running 1,000–10,000 tons per year, usually with one to two flagship product lines",
  },
  S: {
    label: "Small",
    sentence:
      "SME niche players under 1,000 tons annually, typically the right fit when a major plant won't take the order",
  },
};

const CATEGORY_LABEL = new Map(
  supplierCategories.map((c) => [c.id, c.nameEn] as const),
);

// One-sentence "why this category matters" used in the programmatic About
// paragraph. Keeps every supplier page from reading identically while staying
// truthful to the role each player fills in the FRP value chain.
const CATEGORY_SENTENCE: Record<string, string> = {
  manufacturer:
    "finished-goods plants that convert resin and fiber into shippable parts (gratings, profiles, tanks, panels)",
  fiber:
    "upstream fiber houses — glass, carbon, basalt or aramid — that feed downstream pultrusion and composites lines",
  resin:
    "resin formulators (unsaturated polyester, vinyl ester, epoxy) whose batch quality decides what the laminate can do",
  additive:
    "additive and curing-agent suppliers whose dosage windows govern resin shelf life and exotherm",
  equipment:
    "machine builders for pultrusion lines, RTM presses, winding tables, autoclaves — the capex backbone of a plant",
  mold: "mold and die makers; without one of these the rest of the chain has nothing to shape against",
  tooling:
    "auxiliary tooling and NDT equipment vendors — fixtures, ultrasound benches, climate chambers",
  service:
    "third-party testing and certification houses — SGS / Bureau Veritas / TÜV / CNAS labs",
};

interface SupplierRow {
  id: string;
  name: string;
  nameEn: string | null;
  location: string | null;
  locationEn: string | null;
  province: string | null;
  category: string | null;
  productsEn: string[] | null;
  processListEn: string[] | null;
  certificationsEn: string[] | null;
  description: string | null;
  descriptionEn: string | null;
  website: string | null;
  scaleTier: string | null;
  established: number | null;
  verified: boolean | null;
  brandPriority: number;
  viewCount: number;
}

async function fetchSupplier(id: string): Promise<SupplierRow | null> {
  const rows = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, id))
    .limit(1);
  return (rows[0] as SupplierRow) ?? null;
}

async function fetchRelated(row: SupplierRow): Promise<SupplierRow[]> {
  if (!row.category) return [];
  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;
  const rows = await db
    .select()
    .from(supplierListings)
    .where(
      and(
        eq(supplierListings.category, row.category),
        eq(supplierListings.verified, true),
        isNotNull(supplierListings.nameEn),
        ne(supplierListings.id, row.id),
      ),
    )
    .orderBy(
      desc(tierRank),
      desc(supplierListings.brandPriority),
      desc(supplierListings.viewCount),
    )
    .limit(6);
  return rows as SupplierRow[];
}

export async function generateStaticParams() {
  // EN-only routes — skip pre-rendering on the zh deploy.
  if (process.env.NEXT_PUBLIC_LOCALES === "zh") return [];
  const rows = await db
    .select({
      id: supplierListings.id,
    })
    .from(supplierListings)
    .where(
      and(
        eq(supplierListings.verified, true),
        isNotNull(supplierListings.nameEn),
        ne(supplierListings.nameEn, ""),
      ),
    )
    .orderBy(
      desc(supplierListings.brandPriority),
      desc(supplierListings.viewCount),
      asc(supplierListings.nameEn),
    )
    .limit(200);
  return rows.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (locale !== "en") return {};
  const row = await fetchSupplier(id);
  if (!row || !row.nameEn) {
    return { robots: { index: false, follow: false } };
  }
  const cat = row.category ? CATEGORY_LABEL.get(row.category) ?? row.category : "supplier";
  const province = row.province ? provincesEn[row.province] ?? row.province : null;
  const tier = row.scaleTier ? TIER_LABEL[row.scaleTier]?.label ?? "" : "";
  const certs = (row.certificationsEn ?? []).slice(0, 2).join(", ");

  const title = province
    ? `${row.nameEn} — Chinese FRP ${cat.toLowerCase()} in ${province}`
    : `${row.nameEn} — Chinese FRP ${cat.toLowerCase()}`;

  const descParts = [
    `${row.nameEn} is a verified Chinese FRP ${cat.toLowerCase()}`,
    province ? `based in ${province}` : null,
    tier ? `(${tier} tier)` : null,
    row.established ? `est. ${row.established}` : null,
    certs ? `certifications include ${certs}` : null,
  ].filter(Boolean) as string[];
  // Pad to clear the 120-char floor: getfrp's tagline cleanly fits.
  const tail = " — request a quote or shortlist via the getfrp China desk.";
  const description = `${descParts.join(", ")}${tail}`;

  return {
    title,
    description,
    alternates: alternates(`/suppliers/${id}`),
  };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (locale !== "en") notFound();

  const row = await fetchSupplier(id);
  if (!row || !row.nameEn) notFound();

  const cat = row.category
    ? CATEGORY_LABEL.get(row.category) ?? row.category
    : "Supplier";
  const catSentence = row.category
    ? CATEGORY_SENTENCE[row.category] ?? "verified Chinese composites supplier"
    : "verified Chinese composites supplier";
  const tier = row.scaleTier ?? "M";
  const tierMeta = TIER_LABEL[tier] ?? TIER_LABEL.M;
  const province = row.province ? provincesEn[row.province] ?? row.province : null;
  const provinceCtx = chinaFrpProvinces.find(
    (p) => p.name === province,
  );
  const products = row.productsEn ?? [];
  const processes = row.processListEn ?? [];
  const certs = row.certificationsEn ?? [];
  const related = await fetchRelated(row);

  const orgJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${CURRENT_SITE_URL}/suppliers/${row.id}#organization`,
    name: row.nameEn,
    alternateName: row.name && row.name !== row.nameEn ? [row.name] : undefined,
    description: row.descriptionEn ?? undefined,
    foundingDate: row.established ? `${row.established}` : undefined,
    url: row.website ?? `${CURRENT_SITE_URL}/suppliers/${row.id}`,
    address: row.locationEn
      ? {
          "@type": "PostalAddress",
          addressCountry: "CN",
          addressRegion: province ?? undefined,
          addressLocality: row.locationEn,
        }
      : undefined,
    knowsAbout: products.length > 0 ? products : undefined,
    hasCredential: certs.length > 0 ? certs : undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={orgJsonLd} />

      <PageBreadcrumbs
        trail={[
          { label: "Suppliers", href: "/suppliers" },
          { label: row.nameEn, href: `/suppliers/${row.id}` },
        ]}
      />

      {/* ─────────── Hero ─────────── */}
      <header className="mb-10 border-b border-border/70 pb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          VERIFIED · {cat.toUpperCase()}
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {row.nameEn}
        </h1>

        {/* Meta strip */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
          {province && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-foreground/70" />
              {row.locationEn ?? province}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={14} className="text-foreground/70" />
            <span>
              Scale tier:{" "}
              <strong className="text-foreground">{tierMeta.label}</strong>
            </span>
          </span>
          {row.established && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-foreground/70" />
              Est. {row.established}
            </span>
          )}
          {certs.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-foreground/70" />
              {certs.length} certifications on file
            </span>
          )}
        </div>

        {/* Primary CTAs */}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/rfq?supplier=${encodeURIComponent(row.id)}` as never}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Request a quote
            <ArrowRight size={14} />
          </Link>
          <Link
            href={`/ai?q=${encodeURIComponent(
              `Tell me about ${row.nameEn} — what they make, scale, certifications, and how they compare to similar Chinese ${cat.toLowerCase()}s.`,
            )}` as never}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-5 py-2.5 text-sm transition-colors hover:bg-muted"
          >
            Ask AI for context
          </Link>
        </div>
      </header>

      {/* ─────────── About paragraph (programmatic) ─────────── */}
      <section className="prose prose-neutral mb-12 max-w-3xl text-[15px] leading-[1.75] text-foreground dark:prose-invert">
        <p>
          <strong>{row.nameEn}</strong> is a verified Chinese FRP{" "}
          {cat.toLowerCase()} —{" "}
          {catSentence}
          {province ? ` — operating out of ${province} province` : ""}
          {row.established ? `, founded in ${row.established}` : ""}.
          Independently verified business license, scale tier and certifications on
          file. Categorized as <strong>{tierMeta.label}</strong> on the
          getfrp scale: {tierMeta.sentence}.
        </p>
        {row.descriptionEn && row.descriptionEn.length > 30 && (
          <p>{row.descriptionEn}</p>
        )}
        {provinceCtx && (
          <p>
            <strong>{province} composites context.</strong>{" "}
            {provinceCtx.specialty} Buyers sourcing in this category from{" "}
            {province} typically cross-check the regional supply chain
            advantages against logistics cost to the destination port —
            ports of {province === "Jiangsu" ? "Shanghai / Ningbo" : province === "Shandong" ? "Qingdao" : province === "Zhejiang" ? "Ningbo / Shanghai" : "the nearest east-coast hub"}{" "}
            are usually the deciding factor for FCL/LCL economics.
          </p>
        )}
      </section>

      {/* ─────────── Products ─────────── */}
      {products.length > 0 && (
        <section className="mb-12">
          <SectionHeading
            label="MODULE 01 · CAPABILITY"
            title="Products & finished goods"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {products.map((p) => (
              <Badge
                key={p}
                variant="outline"
                className="px-3 py-1 text-[13px] font-normal"
              >
                {p}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── Processes ─────────── */}
      {processes.length > 0 && (
        <section className="mb-12">
          <SectionHeading
            label="MODULE 02 · PROCESS"
            title="In-house forming processes"
          />
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
            Process knowledge usually predicts quality risk better than scale
            does. Cross-check each named process against our{" "}
            <Link href="/tech" className="underline">
              process wiki
            </Link>{" "}
            for typical defect modes and inspection points.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {processes.map((p) => (
              <Badge
                key={p}
                variant="outline"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-normal"
              >
                <Factory size={12} className="text-muted-foreground" />
                {p}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── Certifications ─────────── */}
      {certs.length > 0 && (
        <section className="mb-12">
          <SectionHeading
            label="MODULE 03 · EXPORT READINESS"
            title="Certifications on file"
          />
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
            A certificate is necessary but not sufficient — always verify the
            scope (which products), the renewal status, and the issuing body's
            accreditation chain (CNAS / IAF / ANAB). See{" "}
            <Link href="/source-from-china#certs" className="underline">
              the export-readiness module
            </Link>{" "}
            for what each cert actually unlocks in your end-market.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 border border-border/70 bg-background px-3 py-2 text-[13px]"
              >
                <Award size={14} className="shrink-0 text-foreground/70" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── Related suppliers ─────────── */}
      {related.length > 0 && (
        <section className="mb-12">
          <SectionHeading
            label="MODULE 04 · COMPARE"
            title={`Other verified Chinese ${cat.toLowerCase()}s`}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => {
              const rTier = TIER_LABEL[r.scaleTier ?? "M"] ?? TIER_LABEL.M;
              const rProv = r.province ? provincesEn[r.province] ?? r.province : null;
              return (
                <Link
                  key={r.id}
                  href={`/suppliers/${r.id}` as never}
                  className="group flex flex-col gap-2 border border-border/70 bg-background p-4 transition-colors hover:border-foreground"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-sm font-semibold tracking-tight">
                      {r.nameEn}
                    </span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="font-mono uppercase tracking-wider">
                      {rTier.label}
                    </span>
                    {rProv && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={10} />
                        {rProv}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─────────── CTA ─────────── */}
      <section className="mt-16 border border-border/70 bg-foreground p-10 text-background sm:p-12">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            <PackageOpen size={11} className="mr-1 inline-block" /> READY TO RFQ?
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Let our China desk handle the sourcing conversation.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-background/80">
            Submit a structured RFQ and our bilingual sourcing engineers will
            translate it into Mandarin, chase the sample, walk the floor for
            QA, and route the payment. The first thing they&apos;ll do is
            cross-check whether {row.nameEn} is the best fit, or whether
            another verified plant in the same category beats them on price /
            MOQ / lead time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/rfq?supplier=${encodeURIComponent(row.id)}` as never}
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Submit RFQ for {row.nameEn}
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/source-from-china"
              className="inline-flex items-center gap-1.5 rounded-md border border-background/30 px-5 py-2.5 text-sm text-background transition-colors hover:bg-background/10"
            >
              See the full sourcing playbook
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ label, title }: { label: string; title: string }) {
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
    </div>
  );
}
