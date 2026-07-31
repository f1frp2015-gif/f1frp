import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  FileCheck2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { JsonLd } from "@/components/json-ld";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import {
  getSupplierCategoryPage,
  SUPPLIER_CATEGORY_SLUGS,
  supplierMatchesCategory,
  type SupplierCategoryPage,
} from "@/lib/data/supplier-category-pages";
import { provincesEn } from "@/lib/data/suppliers";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return SUPPLIER_CATEGORY_SLUGS.map((id) => ({ id }));
}

type NetworkRow = {
  id: string;
  province: string | null;
  category: string | null;
  productsEn: string[] | null;
  capabilities: string[] | null;
  processListEn: string[] | null;
  certificationsEn: string[] | null;
  scaleTier: string | null;
  exportReady: boolean;
};

async function loadCategoryNetwork(
  category: SupplierCategoryPage,
): Promise<NetworkRow[]> {
  try {
    const rows = await db
      .select({
        id: supplierListings.id,
        province: supplierListings.province,
        category: supplierListings.category,
        productsEn: supplierListings.productsEn,
        capabilities: supplierListings.capabilities,
        processListEn: supplierListings.processListEn,
        certificationsEn: supplierListings.certificationsEn,
        scaleTier: supplierListings.scaleTier,
        exportReady: supplierListings.exportReady,
      })
      .from(supplierListings)
      .where(eq(supplierListings.verified, true))
      .orderBy(
        desc(supplierListings.exportReady),
        desc(supplierListings.brandPriority),
        desc(supplierListings.viewCount),
      );
    return rows.filter((row) => supplierMatchesCategory(category, row));
  } catch {
    return [];
  }
}

function normalizedCerts(row: NetworkRow): string[] {
  return Array.from(
    new Set(
      (row.certificationsEn ?? [])
        .map((cert) => cert.trim())
        .filter(Boolean),
    ),
  );
}

function scaleLabel(tier: string | null): string {
  switch (tier) {
    case "XL":
      return "Major scale";
    case "L":
      return "Large scale";
    case "M":
      return "Mid scale";
    case "S":
      return "Specialist scale";
    default:
      return "Scale under review";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const category = getSupplierCategoryPage(id);
  if (locale !== "en" || !category) {
    return {
      robots: { index: false, follow: false },
      alternates: alternates(`/suppliers/${id}`),
    };
  }
  const title = `${category.name} Suppliers China — ${category.snapshotCount} Verified Factories | getfrp`;
  return {
    title: { absolute: title },
    description: category.summary,
    alternates: alternates(`/suppliers/${category.slug}`),
    openGraph: og(`/suppliers/${category.slug}`, {
      title,
      description: category.summary,
    }),
  };
}

export default async function SupplierCategoryPageRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const category = getSupplierCategoryPage(id);
  if (locale !== "en" || !category) notFound();

  const network = await loadCategoryNetwork(category);
  const provinceCounts = new Map<string, number>();
  for (const row of network) {
    if (!row.province) continue;
    const label = provincesEn[row.province] ?? row.province;
    provinceCounts.set(label, (provinceCounts.get(label) ?? 0) + 1);
  }
  const provinces = [...provinceCounts.entries()].sort((a, b) => b[1] - a[1]);
  const provinceCount =
    provinces.length || Object.keys(category.provinceNotes).length;
  const liveCeCount = network.filter((row) =>
    normalizedCerts(row).some((cert) => /\bce\b/i.test(cert)),
  ).length;
  const liveIsoCount = network.filter((row) =>
    normalizedCerts(row).some((cert) => /iso\s*9001/i.test(cert)),
  ).length;
  const featured = network.slice(0, 6);

  const pageUrl = `${CURRENT_SITE_URL}/suppliers/${category.slug}`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: category.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `China ${category.name} Manufacturers — Verified Supply Network`,
    description: category.summary,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: { "@id": `${CURRENT_SITE_URL}/#website` },
    about: {
      "@type": "Thing",
      name: `${category.name} manufacturing in China`,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `Anonymous verified ${category.name} capability records`,
      numberOfItems: category.snapshotCount,
    },
  };

  return (
    <main>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${CURRENT_SITE_URL}/` },
          { name: "Suppliers", url: `${CURRENT_SITE_URL}/suppliers` },
          { name: category.shortName, url: pageUrl },
        ]}
      />

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/suppliers" className="hover:text-foreground">Suppliers</Link>
            <span className="mx-2">›</span>
            <span>{category.shortName}</span>
          </nav>
          <div className="mt-6 max-w-4xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              VERIFIED CHINA SUPPLY NETWORK
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
              China {category.name} Manufacturers — Verified Supply Network
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
              {category.summary}
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <Factory size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">{category.snapshotCount}</div>
              <div className="mt-1 text-xs text-muted-foreground">Verified network records</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <MapPin size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">{provinceCount}</div>
              <div className="mt-1 text-xs text-muted-foreground">Production clusters covered</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <FileCheck2 size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">
                {category.certifiedSnapshot?.count ?? liveIsoCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {category.certifiedSnapshot?.label ?? "ISO 9001 records in live match"}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <ShieldCheck size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">
                {liveCeCount || "RFQ"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {liveCeCount ? "CE records in live match" : "Evidence rechecked before release"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Network counts are a July 2026 verified-data snapshot. Certification
            scope and validity are rechecked against the offered product before
            each commercial shortlist.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              CAPABILITY OVERVIEW
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              What to compare before requesting prices
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-7 text-muted-foreground">
              {category.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-xl border border-border/70 bg-muted/20 p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MATCHING PRINCIPLE
            </div>
            <h2 className="mt-2 text-lg font-semibold">
              Capability first. Identity after fit.
            </h2>
            <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
              {[
                "Factory legal identity and manufacturing status checked",
                "Product and process capability matched to the RFQ",
                "Certificate scope and validity reviewed before reliance",
                "Samples and inspection criteria tied to one specification",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            TYPICAL SPECIFICATIONS
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Build a quote sheet factories can answer consistently
          </h2>
          <div className="mt-7 overflow-hidden rounded-xl border border-border/70 bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-border/70 bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Field</th>
                    <th className="px-5 py-3 font-medium">Typical range</th>
                    <th className="px-5 py-3 font-medium">Sourcing note</th>
                  </tr>
                </thead>
                <tbody>
                  {category.specifications.map((spec) => (
                    <tr key={spec.field} className="border-b border-border/50 last:border-0">
                      <th className="px-5 py-4 font-medium text-foreground">{spec.field}</th>
                      <td className="px-5 py-4 text-foreground/85">{spec.typicalRange}</td>
                      <td className="px-5 py-4 text-muted-foreground">{spec.sourcingNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-10">
            <h3 className="text-lg font-semibold tracking-tight">
              Procurement checks before supplier release
            </h3>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {category.buyingChecks.map((check) => (
                <li
                  key={check}
                  className="flex gap-3 rounded-lg border border-border/70 bg-background p-4 text-[13px] leading-relaxed text-muted-foreground"
                >
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0 text-foreground"
                  />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            NETWORK COMPOSITION
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Anonymous capability profiles from the verified network
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These cards expose the evidence needed for a first-pass comparison,
            while factory names and direct contact details remain protected until
            the RFQ has been matched.
          </p>

          {featured.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((row, index) => {
                const products = [
                  ...(row.capabilities ?? []),
                  ...(row.productsEn ?? []),
                ].filter(Boolean).slice(0, 4);
                const certs = normalizedCerts(row).slice(0, 4);
                return (
                  <article
                    key={row.id}
                    className="rounded-xl border border-border/70 bg-background p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">
                        Verified #{category.slug.slice(0, 3).toUpperCase()}-{String(index + 1).padStart(3, "0")}
                      </Badge>
                      {row.exportReady && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Export-ready
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-sm font-medium">
                      <MapPin size={14} />
                      {provincesEn[row.province ?? ""] ?? row.province ?? "China"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {scaleLabel(row.scaleTier)}
                    </div>
                    {products.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {products.map((product) => (
                          <span key={product} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                            {product}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 border-t border-border/60 pt-4 text-[12px] leading-relaxed text-muted-foreground">
                      {certs.length > 0
                        ? `Documents on file: ${certs.join(" · ")}`
                        : "Product evidence reviewed during RFQ matching."}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
              Live capability cards are being refreshed. The verified network
              snapshot and sourcing specification above remain available; submit
              an RFQ to receive a current evidence-based shortlist.
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            PROVINCE DISTRIBUTION
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            China production clusters in this category
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(category.provinceNotes).map(([province, note]) => (
              <article key={province} className="rounded-xl border border-border/70 bg-background p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{province}</h3>
                  {provinceCounts.has(province) && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {provinceCounts.get(province)} matched
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            BUYER FAQ
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Questions specific to sourcing {category.shortName}
          </h2>
          <div className="mt-7 divide-y divide-border/70 border-y border-border/70">
            {category.faqs.map((faq) => (
              <article key={faq.question} className="py-6">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-[14px] leading-7 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground py-14 text-background">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/65">
            MATCHED WITHIN 24 HOURS
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Need this category? Submit one controlled RFQ.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-background/75">
            Send the specification, quantity, destination and required
            documentation. We compare the verified network, flag gaps and return
            a shortlist without exposing your request to an open marketplace.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={"/rfq" as never}
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              Submit RFQ <ArrowRight size={15} />
            </Link>
            <Link
              href="/suppliers"
              className="inline-flex items-center rounded-md border border-background/30 px-5 py-2.5 text-sm hover:bg-background/10"
            >
              Browse all categories
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
