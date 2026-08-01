import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { RfqForm } from "./rfq-form";

export const metadata: Metadata = {
  title: "Submit RFQ — China Composites Sourcing",
  description:
    "Tell us what you need to source from China — fibers, resins, equipment, molds, or finished composite parts. Our team responds within 24 hours.",
  robots: { index: false, follow: false },
  alternates: alternates("/rfq"),
};

export default async function RfqPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ supplier?: string }>;
}) {
  const { locale } = await params;
  const { supplier: requestedSupplierId } = await searchParams;
  setRequestLocale(locale);

  const [targetSupplier] = requestedSupplierId
    ? await db
        .select({ id: supplierListings.id, name: supplierListings.nameEn })
        .from(supplierListings)
        .where(
          and(
            eq(supplierListings.id, requestedSupplierId),
            eq(supplierListings.verified, true),
            isNotNull(supplierListings.enterpriseId),
          ),
        )
        .limit(1)
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="border-b border-border/70 pb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          REQUEST FOR QUOTATION
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {targetSupplier
            ? `Contact ${targetSupplier.name ?? "supplier"}`
            : "Source composites from China"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {targetSupplier
            ? "Send a product or project inquiry through GetFRP. We route it to the verified company contact and track delivery through the sourcing desk."
            : "Tell us what you need — raw materials, equipment, tooling, molds, or finished parts. We match you with verified Chinese manufacturers and respond within 24 hours."}
        </p>
      </div>

      <div className="mt-10">
        <RfqForm
          targetSupplierId={targetSupplier?.id}
          targetSupplierName={targetSupplier?.name ?? undefined}
        />
      </div>

      <div className="mt-12 border-t border-border/70 pt-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          WHAT TO EXPECT
        </div>
        <ol className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="font-semibold text-foreground">1. Match</span> —
            We screen suppliers in our network for fit (capacity,
            certifications, target market).
          </li>
          <li>
            <span className="font-semibold text-foreground">2. Quote</span> —
            You receive 1–3 quotes within 24h, with samples available on
            request.
          </li>
          <li>
            <span className="font-semibold text-foreground">3. Deliver</span> —
            We handle pre-shipment QC, logistics, and export documentation —
            FOB/CIF as principal, with your duty exposure (AD/CVD, Section 301)
            flagged by HS code.
          </li>
        </ol>
      </div>
    </main>
  );
}
