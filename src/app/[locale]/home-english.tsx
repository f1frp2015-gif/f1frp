import { sql, isNotNull, eq, and } from "drizzle-orm";
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Building2,
  ArrowRight,
  ArrowUpRight,
  MessagesSquare,
  Database,
  FileBadge,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import {
  supplierListings,
  materials as materialsTable,
  standards as standardsTable,
  papers as papersTable,
} from "@/lib/db/schema";
import { JsonLd } from "@/components/json-ld";
import { ChatHero } from "./chat-hero";

// English-side homepage — AI-Concierge first.
//
// Premise: 2026-era overseas FRP engineers and procurement increasingly
// land via ChatGPT / Perplexity-style flows rather than database browsing.
// getfrp's defensible edge isn't the SKU count (that's a fight against
// Alibaba / MIC we can't win) — it's a curated bilingual knowledge graph
// behind a chat interface, with Doris as the human escalation path.
//
// Information architecture:
//   1. Chat input dominates the hero (Perplexity-style, single focal point)
//   2. Six example prompts inline as starting points
//   3. Tiny trust strip ("verified · standards mapped · CBAM-ready")
//   4. Three-step "how it works": Ask → AI cites verified data → Human if needed
//   5. Below-fold: small browse links + Doris escalation
//
// The full source-from-china directory is still reachable as a secondary
// path for users who prefer browsing — it's just not the default UX.

const EXAMPLE_PROMPTS = [
  "Find a verified Chinese supplier for FRP gratings with CE marking, MOQ 200 m².",
  "Compare GFRP vs CFRP for a 3 m marine spar — strength, weight, cost, suppliers.",
  "What CBAM data should I request from a Chinese FRP profile manufacturer?",
  "Which GB standard maps to ASTM D3039 for tensile properties?",
  "Recommend a vinyl ester resin for 30% HCl service at 60 °C.",
  "ISO 9001 + EN 13706 certified pultrusion suppliers in Jiangsu, ranked by scale.",
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

async function countVerifiedSuppliersWithEn(): Promise<number> {
  try {
    const rows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierListings)
      .where(
        and(eq(supplierListings.verified, true), isNotNull(supplierListings.nameEn)),
      );
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

export async function HomePageEnglish() {
  const [verifiedSupplierCount, materialsCount, standardsCount, papersCount] =
    await Promise.all([
      countVerifiedSuppliersWithEn(),
      countOne(materialsTable),
      countOne(standardsTable),
      countOne(papersTable),
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
              name: "getfrp — AI sourcing assistant for FRP composites from China",
              inLanguage: "en",
              description:
                "Ask in plain English. Get a verified Chinese supplier, an ASTM-mapped spec sheet, and a CBAM-ready paperwork plan in the same answer.",
            },
            {
              "@type": "Service",
              "@id": "https://getfrp.com/#service",
              name: "China FRP sourcing assistant",
              serviceType: "AI-assisted composites sourcing",
              areaServed: ["US", "DE", "FR", "GB", "IT", "ES", "NL", "PL", "AU", "CA"],
              provider: { "@id": "https://getfrp.com/#organization" },
            },
          ],
        }}
      />

      {/* ─────────── Chat hero ─────────── */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-sm opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <Sparkles size={11} />
              AI SOURCING ASSISTANT FOR FRP COMPOSITES
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-[56px]">
              Ask in plain English.
              <br />
              <span className="text-muted-foreground">
                Get a verified China FRP supplier.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
              An ASTM-mapped spec sheet. A CBAM-ready paperwork plan. A
              shortlist of verified Chinese FRP manufacturers — in the same
              answer. A human takes over when you&apos;re ready to RFQ.
            </p>
          </div>

          <ChatHero examples={[...EXAMPLE_PROMPTS]} />

          {/* Trust micro-strip directly under the chat input — proof-at-a-glance
              without forcing the user to scroll. Numbers are live. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-foreground/70" />
              <strong className="text-foreground">
                {verifiedSupplierCount.toLocaleString()}
              </strong>{" "}
              verified Chinese suppliers
            </span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <FileBadge size={13} className="text-foreground/70" />
              <strong className="text-foreground">
                {standardsCount.toLocaleString()}
              </strong>{" "}
              GB / ASTM / ISO / EN mapped
            </span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Database size={13} className="text-foreground/70" />
              <strong className="text-foreground">
                {materialsCount.toLocaleString()}
              </strong>{" "}
              materials indexed
            </span>
          </div>
        </div>
      </section>

      {/* ─────────── How it works ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              HOW IT WORKS
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              From question to PO, with verified facts at every step.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                Icon: Bot,
                step: "01",
                title: "Ask anything",
                body: "Specs, suppliers, standards, compliance. The assistant answers in your unit system, with inline citations to the underlying source.",
              },
              {
                Icon: Building2,
                step: "02",
                title: "We match verified suppliers",
                body: "Every recommendation comes from a curated registry — business license cross-checked, scale tier field-validated, certifications on file.",
              },
              {
                Icon: MessagesSquare,
                step: "03",
                title: "Doris takes it from there",
                body: "When you're ready to RFQ, our China sourcing desk handles paperwork, on-site QA, payment routing, and end-to-end logistics.",
              },
            ].map((s) => {
              const I = s.Icon;
              return (
                <div
                  key={s.step}
                  className="rounded-xl border border-border/70 bg-background p-6"
                >
                  <div className="flex items-center justify-between">
                    <I size={20} strokeWidth={1.5} className="text-foreground" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      STEP {s.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── Below-fold: prefer to browse? ─────────── */}
      <section className="border-b border-border/80 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                PREFER TO BROWSE?
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                The full directory and standards crosswalk are still here.
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                Skip the chat and walk through the verified supplier
                directory by category, the GB ⇄ ASTM standards crosswalk,
                or the 6-step sourcing playbook. Every page has an
                &ldquo;Ask AI&rdquo; button when you want a second opinion.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                <Link
                  href={"/source-from-china" as never}
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  Sourcing playbook
                  <ArrowUpRight size={13} />
                </Link>
                <Link
                  href={"/suppliers?verified=1" as never}
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  Verified suppliers ({verifiedSupplierCount.toLocaleString()})
                  <ArrowUpRight size={13} />
                </Link>
                <Link
                  href={"/standards" as never}
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  Standards ({standardsCount.toLocaleString()})
                  <ArrowUpRight size={13} />
                </Link>
                <Link
                  href={"/materials" as never}
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  Materials ({materialsCount.toLocaleString()})
                  <ArrowUpRight size={13} />
                </Link>
                <Link
                  href={"/papers" as never}
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  Papers ({papersCount.toLocaleString()})
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Doris escalation ─────────── */}
      <section className="bg-foreground py-14 text-background sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            READY TO RFQ?
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Let a human take over.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-background/80">
            Doris Li runs our China sourcing desk — composites engineer,
            English / Mandarin, ten years on the ground. She handles
            paperwork, QA, payment routing, and the conversations that
            sink most overseas RFQs.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:doris.li@f1composite.com"
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Email Doris
              <ArrowRight size={14} />
            </a>
            <Link
              href={"/rfq" as never}
              className="inline-flex items-center gap-1.5 rounded-md border border-background/30 px-5 py-2.5 text-sm transition-colors hover:bg-background/10"
            >
              Submit a structured RFQ
            </Link>
            <Link
              href={"/about" as never}
              className="inline-flex items-center gap-1.5 text-sm text-background/70 transition-colors hover:text-background"
            >
              About F1 Composite
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
