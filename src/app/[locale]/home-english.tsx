import { sql, isNotNull, ne, eq, and, desc, asc } from "drizzle-orm";
import {
  Sparkles,
  Check,
  Bot,
  ShieldCheck,
  Building2,
  ArrowRight,
  ArrowUpRight,
  MessagesSquare,
  Database,
  FileBadge,
  BookOpen,
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

// 8 KB 是经验阈值: 超过此数字的内联 helper 抽到单独 module 才有意义。
// 当前 helper 不大, 留在本文件里维持单一阅读路径。
async function loadFeatured() {
  const safe = async <T,>(p: Promise<T>): Promise<T | []> => {
    try {
      return await p;
    } catch {
      return [] as unknown as T;
    }
  };
  const [topStandards, topPapers, topSuppliers] = await Promise.all([
    safe(
      db
        .select({
          id: standardsTable.id,
          code: standardsTable.code,
          titleEn: standardsTable.titleEn,
        })
        .from(standardsTable)
        .where(and(isNotNull(standardsTable.titleEn), ne(standardsTable.titleEn, "")))
        .orderBy(asc(standardsTable.code))
        .limit(6),
    ),
    safe(
      db
        .select({
          id: papersTable.id,
          slug: papersTable.slug,
          titleEn: papersTable.titleEn,
          year: papersTable.year,
        })
        .from(papersTable)
        .where(
          and(
            isNotNull(papersTable.titleEn),
            ne(papersTable.titleEn, ""),
            // 仅展示 abstract 已翻译的 paper, 与 sitemap 一致
            sql`length(coalesce(${papersTable.abstractEn}, '')) >= 80`,
          ),
        )
        .orderBy(desc(papersTable.citationCount), desc(papersTable.year))
        .limit(6),
    ),
    safe(
      db
        .select({
          id: supplierListings.id,
          nameEn: supplierListings.nameEn,
          locationEn: supplierListings.locationEn,
          category: supplierListings.category,
        })
        .from(supplierListings)
        .where(
          and(eq(supplierListings.verified, true), isNotNull(supplierListings.nameEn)),
        )
        .orderBy(desc(supplierListings.brandPriority), desc(supplierListings.viewCount))
        .limit(6),
    ),
  ]);
  return { topStandards, topPapers, topSuppliers };
}

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
//   3. Tiny trust strip ("plants audited · standards mapped · materials indexed")
//   4. Three-step "how it works": Ask → AI cites verified data → Human if needed
//   5. Below-fold: small browse links + Doris escalation
//
// The full source-from-china directory is still reachable as a secondary
// path for users who prefer browsing — it's just not the default UX.

const EXAMPLE_PROMPTS = [
  "Find a verified Chinese supplier for FRP gratings with CE marking, MOQ 200 m².",
  "Compare GFRP vs CFRP for a 3 m marine spar — strength, weight, cost, suppliers.",
  "Map my BOM to Chinese FRP suppliers — resin, fiber, profiles, lead times.",
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
  const [verifiedSupplierCount, materialsCount, standardsCount, papersCount, featured] =
    await Promise.all([
      countVerifiedSuppliersWithEn(),
      countOne(materialsTable),
      countOne(standardsTable),
      countOne(papersTable),
      loadFeatured(),
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
              name: "China's FRP supply chain, AI-native and export-ready | getfrp",
              inLanguage: "en",
              description:
                "China's entire FRP supply chain in one AI-native workspace: 200+ on-the-ground-audited factories, raw materials to finished pultrusions, GB ⇄ ASTM ⇄ EN standards mapped. Ask in English; our China desk runs the RFQ and ships.",
              primaryImageOfPage: { "@id": "https://getfrp.com/og-icon.png" },
              about: [
                { "@type": "Thing", name: "FRP sourcing" },
                { "@type": "Thing", name: "China FRP supplier" },
                { "@type": "Thing", name: "Chinese FRP manufacturer" },
              ],
            },
            {
              "@type": "Service",
              "@id": "https://getfrp.com/#service",
              name: "FRP sourcing from China",
              alternateName: [
                "China FRP supplier matching",
                "Chinese FRP manufacturer sourcing",
                "GFRP / CFRP / BFRP sourcing from China",
              ],
              serviceType:
                "End-to-end FRP / GFRP / CFRP / BFRP supply-chain sourcing from China — verified factories, GB ⇄ ASTM ⇄ EN standards crosswalk, and RFQ-to-delivery handling for overseas buyers",
              areaServed: [
                "US",
                "DE",
                "FR",
                "GB",
                "IT",
                "ES",
                "NL",
                "PL",
                "AU",
                "CA",
              ],
              provider: { "@id": "https://getfrp.com/#organization" },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Supply-chain capabilities",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Verified Chinese FRP supplier matching",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "ASTM ⇄ GB ⇄ ISO ⇄ EN standards crosswalk",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "AD/CVD & Section 301 duty-exposure flagging by HS code (advisory)",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "On-site QA, payment routing, and logistics",
                    },
                  },
                ],
              },
            },
            {
              "@type": "FAQPage",
              "@id": "https://getfrp.com/#faq",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How do I source FRP from China?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Start with a verified-supplier directory like getfrp.com that has independently checked the factory's business license, certifications, and manufacturing scale. Shortlist 3–5 plants by product category and Chinese province (Jiangsu = resin, Shandong = fiber, Zhejiang = mid-volume manufacturing). Submit identical RFQ packets with specification, target volume, Incoterms, and required documentation. Standard payment terms are 30% deposit / 70% on B/L copy; for first orders above USD 50,000, use an LC at sight.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is the best Chinese FRP supplier for export?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "The strongest export-ready Chinese FRP suppliers hold ISO 9001 plus the certification your end-market screens for (CE / EN 13706 for EU pultrusion, ASTM-tested mill sheets for North America, Lloyd's / CCS / DNV for marine). Scale tier matters: Major (publicly listed, >50,000 t/yr) and Large (10,000–50,000 t/yr) plants carry export documentation overhead easily, while Mid and Small plants win on niche capability. getfrp ranks every supplier by manufacturing scale and field-validates the tier with site visits.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is it safe to buy FRP from China?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "It is, if you separate the three failure modes overseas buyers usually conflate: (1) supplier legitimacy — checked once by verifying the business license, USCC, and certifications against the issuing authority; (2) product conformity — verified per shipment with a Material Test Certificate and pre-shipment inspection (SGS / Bureau Veritas / TÜV); (3) payment risk — handled with 30/70 terms or an LC at sight. getfrp pre-handles (1), advises on (2) and (3).",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is the GB equivalent of ASTM D3039?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "GB/T 1447-2005 is China's analog to ASTM D3039 for tensile properties of fiber-reinforced plastics. The specimen geometry and gripping conditions are similar but not identical; for safety-critical structural parts, request the test panel be cut to ASTM D3039 dimensions and tested at a CNAS-accredited lab (SGS / Bureau Veritas / Intertek / TÜV China). The getfrp standards crosswalk maps all common GB ⇄ ASTM ⇄ ISO ⇄ EN equivalents.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Does FRP imported from China fall under EU CBAM?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Not under the current scope. CBAM's definitive period from 2026 covers six high-carbon goods — iron and steel, aluminium, cement, fertilisers, electricity and hydrogen; fibre-reinforced polymers (GFRP / CFRP / BFRP) are not included, and the EU has only signalled possibly extending CBAM to polymers later this decade. What actually changes your FRP landed cost from China today is trade remedy, not CBAM: EU anti-dumping and countervailing duties on glass fibre (fabrics and rovings), and US Section 301 plus AD/CVD on certain fiberglass products. getfrp flags which of these measures apply to your HS code so you can price your own landed cost, ships FOB/CIF as principal, and tracks any future CBAM extension to composites — duty-paid (DDP) delivery is on our roadmap.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do you ship DDP, or what Incoterms do you use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Today we ship FOB or CIF to your port and your customs broker clears the import, so you keep control of duties and entry — the arrangement most experienced importers prefer. We flag your AD/CVD and Section 301 duty exposure by HS code up front, so the duty picture is transparent before you commit and there are no surprises at the border. Duty-paid (DDP) delivery and a guaranteed landed-cost figure are on our roadmap; until then we make the duty exposure clear so you can price your own landed cost.",
                  },
                },
              ],
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
              AI-NATIVE · CHINA&apos;S FRP SUPPLY CHAIN, EXPORTED
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-[56px]">
              China&apos;s entire FRP supply chain.
              <br />
              <span className="text-muted-foreground">
                Queried by AI. Exported by us.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
              Most of the world&apos;s FRP is made in China — but that supply
              chain is opaque, Chinese-only, and hard to audit from overseas. We
              turned it into one AI-native workspace —{" "}
              <strong className="font-semibold text-foreground">200+ factories
              audited on the ground since 2022</strong>, GB ⇄ ASTM ⇄ EN mapped —
              backed by one accountable desk: we find the right factory for your
              spec, control quality with pre-shipment QA, and ship to your port
              as principal. Your contract is with us, not a factory you&apos;ve
              never met.
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
              plants audited on the ground
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

      {/* ─────────── One-stop chain: ribbon + the difference ─────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {/* Static chain ribbon — asserts the whole supply chain with no live
              count to come back empty (equipment/tooling/molds have 0 rows). */}
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              ONE CHAIN · ONE WORKSPACE · ONE DESK
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[12px] sm:text-[13px]">
              <span className="text-muted-foreground">Resin</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-muted-foreground">Fiber</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-muted-foreground">Profiles &amp; gratings</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-muted-foreground">Finished parts</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="font-semibold text-foreground">Exported by us</span>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              The whole chain — raw material to delivered PO — verified and
              queryable in one place.
            </p>
          </div>

          {/* The difference: scattered status quo vs one accountable workspace */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                THE STATUS QUO
              </div>
              <h3 className="mt-2 text-base font-semibold tracking-tight">
                Scattered, opaque, Chinese-only.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Hundreds of relevant factories spread across Alibaba and 1688
                listings you can&apos;t audit from overseas. Specs in Chinese.
                No standards crosswalk. No one accountable when the sample never
                shows.
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                WITH GETFRP
              </div>
              <h3 className="mt-2 text-base font-semibold tracking-tight">
                One verified, AI-queryable workspace.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                200+ plants audited on the ground since 2022, GB ⇄ ASTM ⇄ EN
                mapped — we match the right one to your spec, control quality
                with pre-shipment QA, and ship FOB/CIF as principal. One
                contract, one accountable counterparty.
              </p>
            </div>
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
              From raw material to delivered PO — verified at every step.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                Icon: Bot,
                step: "01",
                title: "Ask anything",
                body: "Specs, GB-vs-ASTM mappings, lead times — answered in your unit system, each linked to the source row in our database so you can verify before forwarding.",
              },
              {
                Icon: Building2,
                step: "02",
                title: "We match verified suppliers",
                body: "Every supplier has a checked business license and a scale tier we set by visiting the plant. Certs on file. If we can't verify a claim, we say so.",
              },
              {
                Icon: MessagesSquare,
                step: "03",
                title: "We run QA & ship as principal",
                body: "Our China desk chases the sample, walks the floor for pre-shipment QA, holds batch-to-batch consistency, and ships FOB/CIF — with your AD/CVD & Section 301 duty exposure flagged up front. One contract, with us.",
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

      {/* ─────────── What the desk handles — honest scope (today vs roadmap) ───────────
          Western B2B buyers read a clear scope as credibility, not weakness.
          Lead with what every order includes today (FOB/CIF as principal, QA,
          duty exposure flagged); be upfront that DDP / a guaranteed landed-cost
          figure is still on the roadmap. No overselling. */}
      <section className="border-b border-border/80 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              WHAT THE DESK HANDLES
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Clear on what we do — and what we don&apos;t, yet.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              You contract with us, not a factory you&apos;ve never met. Here is
              exactly what that covers today.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {/* Today */}
            <div className="rounded-xl border border-border/70 bg-background p-6 sm:p-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
                INCLUDED ON EVERY ORDER
              </div>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed">
                {[
                  "Match the right factory for your spec — vetted, scale-rated, audited on the ground",
                  "Spec & standards crosswalk: GB ⇄ ASTM ⇄ ISO ⇄ EN, in your unit system",
                  "Pre-shipment QA and batch-to-batch consistency control",
                  "Export documentation handled end to end",
                  "Shipped FOB / CIF to your port — as principal, one contract, one accountable counterparty",
                  "AD/CVD & Section 301 duty exposure flagged by HS code, before you commit",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-foreground" />
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Roadmap */}
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-6 sm:p-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ON THE ROADMAP
              </div>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                {[
                  "Duty-paid (DDP) delivery to your door",
                  "Guaranteed landed-cost figure, duties included",
                  "Buyer financing & open-account terms",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-dashed border-muted-foreground/50" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground/80">
                Until these ship, we keep the duty picture transparent so you can
                price your own landed cost — and clear import with your own
                broker, on your terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── THE INDEX — live DB shelf + always-on browse row ─────
          Three columns of real database entries, linking deep into
          /standards/[id] /papers/[id] /suppliers/[id]. Purposes:
            1) Distribute PageRank from homepage into deep pages so
               Googlebot doesn't have to crawl 4 levels to find them.
            2) Give returning visitors a fresh shelf each week (sort
               keys change as new data is ingested).
            3) Prove the database is real and curated, not a placeholder.
          The grid is guarded on having rows; the browse row below renders
          ALWAYS so the crawl paths survive a cold/empty DB. */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              THE INDEX
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              A real, queryable database — not a placeholder.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              Sample rows from what we&apos;ve indexed. New entries land most
              weekdays.
            </p>
          </div>

          {(featured.topStandards.length || featured.topPapers.length || featured.topSuppliers.length) > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {/* Standards */}
              <div className="rounded-xl border border-border/70 bg-background p-6">
                <div className="flex items-center justify-between">
                  <FileBadge size={18} strokeWidth={1.5} className="text-foreground" />
                  <Link
                    href={"/standards" as never}
                    className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                  >
                    Browse all →
                  </Link>
                </div>
                <h3 className="mt-4 text-sm font-semibold tracking-tight">
                  Standards crosswalk
                </h3>
                <ul className="mt-3 space-y-2 text-[13px]">
                  {featured.topStandards.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/standards/${s.id}` as "/standards/[id]"}
                        className="block leading-snug text-foreground/90 hover:text-foreground hover:underline"
                      >
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {s.code}
                        </span>{" "}
                        <span className="line-clamp-1">{s.titleEn}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Papers */}
              <div className="rounded-xl border border-border/70 bg-background p-6">
                <div className="flex items-center justify-between">
                  <BookOpen size={18} strokeWidth={1.5} className="text-foreground" />
                  <Link
                    href={"/papers" as never}
                    className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                  >
                    Browse all →
                  </Link>
                </div>
                <h3 className="mt-4 text-sm font-semibold tracking-tight">
                  Top-cited papers
                </h3>
                <ul className="mt-3 space-y-2 text-[13px]">
                  {featured.topPapers.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/papers/${p.slug ?? p.id}` as "/papers/[id]"}
                        className="block leading-snug text-foreground/90 hover:text-foreground hover:underline"
                      >
                        <span className="line-clamp-2">{p.titleEn}</span>
                        {p.year ? (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {p.year}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suppliers */}
              <div className="rounded-xl border border-border/70 bg-background p-6">
                <div className="flex items-center justify-between">
                  <Building2 size={18} strokeWidth={1.5} className="text-foreground" />
                  <Link
                    href={"/suppliers?verified=1" as never}
                    className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                  >
                    Browse all →
                  </Link>
                </div>
                <h3 className="mt-4 text-sm font-semibold tracking-tight">
                  Verified Chinese suppliers
                </h3>
                <ul className="mt-3 space-y-2 text-[13px]">
                  {featured.topSuppliers.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/suppliers/${s.id}` as "/suppliers/[id]"}
                        className="block leading-snug text-foreground/90 hover:text-foreground hover:underline"
                      >
                        <span className="line-clamp-1">{s.nameEn}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {[s.category, s.locationEn].filter(Boolean).join(" · ")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Always-on browse row — carries every crawl path the old
              "prefer to browse" band had, and survives a cold/empty DB. */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px]">
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
      </section>

      {/* ─────────── Sourcing-desk escalation ─────────── */}
      <section className="bg-foreground py-14 text-background sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            READY TO RFQ?
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Let a human take over.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-background/80">
            Our China desk is run by bilingual composites engineers
            who&apos;ve walked these plant floors for a decade. Hand off the
            RFQ — they chase the sample, translate the spec, run QA, and route
            the payment, then ship as principal.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:f1frp2015@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Email tech support
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
