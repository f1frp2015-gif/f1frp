import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import { RfqForm } from "./rfq-form";

export const metadata: Metadata = {
  title: "Submit RFQ — China Composites Sourcing",
  description:
    "Tell us what you need to source from China — fibers, resins, equipment, molds, or finished composite parts. Our team responds within 24 hours.",
  alternates: alternates("/rfq"),
};

export default async function RfqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="border-b border-border/70 pb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          REQUEST FOR QUOTATION
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Source composites from China
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Tell us what you need — raw materials, equipment, tooling, molds, or
          finished parts. We match you with verified Chinese manufacturers and
          respond within 24 hours.
        </p>
      </div>

      <div className="mt-10">
        <RfqForm />
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
