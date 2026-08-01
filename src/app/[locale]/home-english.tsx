import { and, asc, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Factory,
  FileBadge,
  FlaskConical,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  Ship,
} from "lucide-react";
import Image from "next/image";

import { JsonLd } from "@/components/json-ld";
import { SupplierCategoryCardImage } from "@/components/supplier-category-card-image";
import { Link } from "@/i18n/navigation";
import { ANON_CHAT_LIMIT } from "@/lib/auth-gate";
import { getSessionUid } from "@/lib/auth/current-user";
import { SUPPLIER_CATEGORY_PAGES } from "@/lib/data/supplier-category-pages";
import { db } from "@/lib/db";
import {
  materials as materialsTable,
  papers as papersTable,
  standards as standardsTable,
  supplierListings,
} from "@/lib/db/schema";

import { ChatHero, type ExampleGroup } from "./chat-hero";

const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    category: "Find a factory",
    prompts: [
      "Find a verified Chinese supplier for FRP gratings with CE marking, MOQ 200 m².",
      "Shortlist pultrusion factories with ISO 9001 and EN 13706 capability.",
    ],
  },
  {
    category: "Check a spec",
    prompts: [
      "Which GB standard maps to ASTM D3039 for tensile properties?",
      "What EN 13706 grade do I need for a structural walkway?",
    ],
  },
  {
    category: "Select materials",
    prompts: [
      "Recommend a vinyl ester resin for 30% HCl service at 60 °C.",
      "Compare GFRP vs CFRP for a 3 m marine spar.",
    ],
  },
  {
    category: "Cost & compliance",
    prompts: [
      "Estimate FOB Shanghai cost for 20 tons of FRP profiles.",
      "Flag import compliance risks for FRP grating entering the EU.",
    ],
  },
];

const CATEGORY_META = {
  "frp-grating": {
    code: "GRT",
    description: "Molded · pultruded · stair treads",
  },
  "pultruded-profiles": {
    code: "PLT",
    description: "Standard sections · custom profiles",
  },
  "fiberglass-sheet": {
    code: "SHT",
    description: "Panels · laminates · insulation sheet",
  },
  "frp-rebar": {
    code: "RBR",
    description: "GFRP · BFRP · sand-coated bar",
  },
  "frp-pipe": {
    code: "PIP",
    description: "Pipe · fittings · process equipment",
  },
  "smc-bmc": {
    code: "SMC",
    description: "Compounds · molded components",
  },
  "resin-gelcoat": {
    code: "RSN",
    description: "Polyester · vinyl ester · gelcoat",
  },
  "fiber-glass": {
    code: "FBR",
    description: "Roving · mat · fabric · chopped strand",
  },
} as const;

const CHAIN_STEPS = [
  {
    number: "01",
    title: "Define",
    body: "Drawing, resin, performance, volume and destination normalized into one RFQ pack.",
    Icon: PackageSearch,
  },
  {
    number: "02",
    title: "Match",
    body: "Factories filtered by process, scale, certification scope and current capacity.",
    Icon: Factory,
  },
  {
    number: "03",
    title: "Verify",
    body: "Samples, material evidence and production controls checked against the frozen spec.",
    Icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Export",
    body: "One commercial route for QA, documents, packing and FOB/CIF shipment.",
    Icon: Ship,
  },
] as const;

const CLUSTERS = [
  {
    province: "Jiangsu",
    cities: "Nantong · Nanjing · Changzhou",
    focus: "Pultrusion · grating · resin systems",
    code: "CN-JS",
  },
  {
    province: "Shandong",
    cities: "Weihai · Dezhou · Qingdao",
    focus: "Carbon fiber · profiles · volume production",
    code: "CN-SD",
  },
  {
    province: "Hebei",
    cities: "Hengshui · Zaoqiang",
    focus: "Pipe · tanks · anti-corrosion equipment",
    code: "CN-HE",
  },
  {
    province: "Zhejiang",
    cities: "Jiaxing · Hangzhou · Ningbo",
    focus: "Precision profiles · panels · fabrication",
    code: "CN-ZJ",
  },
] as const;

async function countOne(
  table: Parameters<ReturnType<typeof db.select>["from"]>[0],
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

async function loadFeatured() {
  const safe = async <T,>(promise: Promise<T>): Promise<T | []> => {
    try {
      return await promise;
    } catch {
      return [] as unknown as T;
    }
  };

  const [topStandards, topPapers] = await Promise.all([
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
        .limit(4),
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
            sql`length(coalesce(${papersTable.abstractEn}, '')) >= 80`,
          ),
        )
        .orderBy(desc(papersTable.citationCount), desc(papersTable.year))
        .limit(4),
    ),
  ]);

  return { topStandards, topPapers };
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#087f79]">
        <span className="h-px w-7 bg-[#0d9b92]" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-[#0a2233] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-[15px] leading-7 text-[#566976]">{body}</p>
    </div>
  );
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-white/15 pl-4 first:border-l-0 first:pl-0 sm:pl-6">
      <div className="font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#9eb6c2]">
        {label}
      </div>
    </div>
  );
}

export async function HomePageEnglish() {
  const [verifiedCount, materialsCount, standardsCount, papersCount, featured, uid] =
    await Promise.all([
      countVerifiedSuppliersWithEn(),
      countOne(materialsTable),
      countOne(standardsTable),
      countOne(papersTable),
      loadFeatured(),
      getSessionUid(),
    ]);

  // Static category pages are a durable fallback when the live database is
  // unavailable during a cold build. These baselines match the published
  // library copy elsewhere on the site; live counts replace them when present.
  const supplierRecords = verifiedCount || 199;
  const materialRecords = materialsCount || 4_300;
  const standardRecords = standardsCount || 95;
  const paperRecords = papersCount || 698;

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
              name: "China FRP Supply Chain — Verified Factories, QA and Export",
              inLanguage: "en",
              description:
                "Source FRP materials, profiles and finished components from a verified Chinese factory network with standards mapping, pre-shipment QA and export coordination.",
              about: [
                { "@type": "Thing", name: "FRP sourcing" },
                { "@type": "Thing", name: "China FRP supplier" },
                { "@type": "Thing", name: "Composite manufacturing" },
              ],
            },
            {
              "@type": "Service",
              "@id": "https://getfrp.com/#service",
              name: "FRP sourcing from China",
              serviceType:
                "End-to-end FRP supply-chain sourcing from China, including supplier matching, specification alignment, quality control and export coordination",
              areaServed: ["US", "DE", "FR", "GB", "NL", "AU", "CA"],
              provider: { "@id": "https://getfrp.com/#organization" },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "FRP supply-chain capabilities",
                itemListElement: [
                  "Verified supplier matching",
                  "Standards and specification crosswalk",
                  "Sample and pre-shipment inspection",
                  "FOB and CIF export coordination",
                ].map((name) => ({
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name },
                })),
              },
            },
          ],
        }}
      />

      {/* Hero: industrial supply-chain positioning, with the product itself in view. */}
      <section className="relative overflow-hidden bg-[#061927] text-white">
        <div className="absolute inset-y-0 right-0 hidden w-[57%] lg:block">
          <Image
            src="/images/getfrp-supply-chain-hero.png"
            alt="Glass fiber, FRP profiles, grating and filament-wound pipe"
            fill
            priority
            sizes="57vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#061927] via-[#061927]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061927] via-transparent to-[#061927]/20" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center px-4 pb-28 pt-20 sm:px-6 lg:grid-cols-12 lg:pb-32 lg:pt-24">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2c5262] bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#a9c8d1] backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#51d2bd] opacity-60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#51d2bd]" />
              </span>
              China network · sourcing desk online
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-[76px]">
              China&apos;s FRP
              <br />
              supply chain,
              <br />
              <span className="text-[#69d2ca]">under control.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-7 text-[#bfd0d7] sm:text-[17px]">
              Source resin, reinforcement, profiles and finished composite parts
              through one specialist China desk. We align the specification,
              qualify the factory, control the shipment and keep one accountable
              commercial route.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/rfq"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#f0b449] px-6 text-sm font-semibold text-[#132433] transition-colors hover:bg-[#ffc45c]"
              >
                Submit your RFQ <ArrowRight size={15} />
              </Link>
              <Link
                href="/suppliers"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/25 bg-white/[0.04] px-6 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                Explore the factory network <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#a9bec7]">
              {["Factory identity checked", "Spec-led matching", "FOB / CIF export desk"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={13} className="text-[#59cbb8]" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative mt-14 lg:col-span-5 lg:mt-0">
            <div className="ml-auto max-w-[360px] border border-white/15 bg-[#0b2434]/85 p-1 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9db5bf]">
                  Active sourcing route
                </div>
                <span className="rounded-full bg-[#1d4d47] px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[#83dfcf]">
                  Live
                </span>
              </div>
              <div className="space-y-px bg-white/10">
                {[
                  ["Material", "Vinyl ester / ECR glass", "specified"],
                  ["Process", "Pultrusion + CNC", "matched"],
                  ["Evidence", "EN 13706 / ISO 9001", "review"],
                  ["Delivery", "FOB Shanghai", "planned"],
                ].map(([label, value, status]) => (
                  <div key={label} className="grid grid-cols-[76px_1fr_auto] items-center gap-3 bg-[#0b2434] px-4 py-3.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#829da8]">
                      {label}
                    </span>
                    <span className="text-[12px] text-white">{value}</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#67ccbc]">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 text-[10px] text-[#93acb6]">
                <ShieldCheck size={12} className="text-[#5bc9b8]" />
                Evidence refreshed against the live RFQ
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#071b2a]/95 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-4 py-5 sm:grid-cols-4 sm:px-6">
            <Metric value={`${supplierRecords}+`} label="verified network records" />
            <Metric value={`${standardRecords.toLocaleString()}+`} label="standards indexed" />
            <Metric value={`${materialRecords.toLocaleString()}+`} label="materials mapped" />
            <Metric value="4" label="core production clusters" />
          </div>
        </div>
      </section>

      {/* Supply chain rail */}
      <section className="border-b border-[#d9e1e5] bg-[#f4f7f8]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.8fr] lg:items-end">
            <SectionHeading
              eyebrow="One connected route"
              title="Not a directory. A controlled purchase path."
              body="The factory list is only the beginning. getfrp connects technical definition, supplier evidence, production QA and export execution in the same workflow."
            />
            <div className="grid overflow-hidden border border-[#cfdadd] bg-[#cfdadd] sm:grid-cols-2 xl:grid-cols-4">
              {CHAIN_STEPS.map(({ number, title, body, Icon }) => (
                <div key={number} className="group relative bg-white p-5 sm:min-h-[220px] sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#80919b]">{number}</span>
                    <Icon size={19} strokeWidth={1.5} className="text-[#0a756f]" />
                  </div>
                  <h3 className="mt-10 text-lg font-semibold text-[#102b3b]">{title}</h3>
                  <p className="mt-3 text-[13px] leading-6 text-[#64747e]">{body}</p>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-[#0a9389] transition-transform group-hover:scale-x-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="border-b border-[#dde4e7] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Product networks"
              title="Built around what you need to buy."
              body="Every category has its own factory pool, specification checklist, certification logic and production-cluster knowledge."
            />
            <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b756f] hover:underline">
              Browse all supplier records <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-12 grid border-l border-t border-[#dbe3e6] sm:grid-cols-2 lg:grid-cols-4">
            {SUPPLIER_CATEGORY_PAGES.map((category) => {
              const meta = CATEGORY_META[category.slug];
              return (
                <Link
                  key={category.slug}
                  href={`/suppliers/${category.slug}` as "/suppliers/[id]"}
                  className="group overflow-hidden border-b border-r border-[#dbe3e6] transition-colors hover:bg-[#f3f8f7]"
                >
                  <SupplierCategoryCardImage slug={category.slug} />
                  <div className="p-6">
                    <div className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#0b857d]">
                      {meta.code}
                    </div>
                    <h3 className="mt-7 text-xl font-semibold tracking-[-0.025em] text-[#0d2939]">
                      {category.shortName}
                    </h3>
                    <p className="mt-2 text-[12px] text-[#6d7e87]">{meta.description}</p>
                    <div className="mt-7 flex items-center gap-2 border-t border-[#e2e8ea] pt-4 text-[11px] text-[#6c7c85]">
                      <Building2 size={13} className="text-[#0b857d]" />
                      <strong className="font-mono text-[#163343]">{category.snapshotCount}</strong>
                      verified factory records
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operational control */}
      <section className="overflow-hidden border-b border-[#173646] bg-[#0a2231] text-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="px-4 py-20 sm:px-6 sm:py-24 lg:pr-16">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64cfc2]">
              Purchase control
            </div>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
              One specification. One evidence trail. One export desk.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#a9bec8]">
              We keep the approved sample, inspection criteria and commercial
              terms connected, so the product quoted is the product that leaves
              the factory.
            </p>

            <div className="mt-10 space-y-px border border-white/10 bg-white/10">
              {[
                ["RFQ intake", "Drawing revision, application and acceptance criteria frozen"],
                ["Supplier pack", "Legal identity, process, capacity and certificate scope reviewed"],
                ["Quality plan", "Sample, MTC, dimensional checks and PSI linked to the PO"],
                ["Export pack", "Invoice, packing list, origin documents and shipment status aligned"],
              ].map(([title, body], index) => (
                <div key={title} className="grid gap-3 bg-[#0a2231] p-5 sm:grid-cols-[42px_130px_1fr] sm:items-start">
                  <span className="font-mono text-[10px] text-[#6f8c98]">0{index + 1}</span>
                  <span className="text-sm font-semibold text-white">{title}</span>
                  <span className="text-[12px] leading-5 text-[#9eb5be]">{body}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative border-t border-white/10 bg-[#0d2939] px-4 py-20 sm:px-8 sm:py-24 lg:border-l lg:border-t-0 lg:px-14">
            <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative mx-auto max-w-lg border border-white/15 bg-[#071c2a] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#78949f]">Project file</div>
                  <div className="mt-1 text-sm font-semibold">GF-PUL-2407 / Structural channel</div>
                </div>
                <div className="rounded border border-[#38685f] bg-[#123a38] px-2 py-1 font-mono text-[9px] uppercase text-[#76d5c6]">
                  Gate 03
                </div>
              </div>
              <div className="grid grid-cols-3 border-b border-white/10">
                {[["3", "factories"], ["11", "documents"], ["2", "samples"]].map(([value, label]) => (
                  <div key={label} className="border-r border-white/10 px-5 py-4 last:border-r-0">
                    <div className="font-mono text-xl font-semibold">{value}</div>
                    <div className="mt-1 text-[9px] uppercase tracking-wider text-[#738f9a]">{label}</div>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#78949f]">Release gates</div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Business identity", "Passed"],
                    ["Technical deviation list", "Passed"],
                    ["Golden sample", "In review"],
                    ["Pre-shipment inspection", "Scheduled"],
                  ].map(([label, status], index) => (
                    <div key={label} className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 text-[12px] last:border-0">
                      <span className="inline-flex items-center gap-2 text-[#bed0d6]">
                        {index < 2 ? <CheckCircle2 size={14} className="text-[#5bc8b7]" /> : <span className="ml-0.5 h-2.5 w-2.5 rounded-full border border-[#78949f]" />}
                        {label}
                      </span>
                      <span className={index < 2 ? "text-[#69d0c1]" : "text-[#78949f]"}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Production clusters */}
      <section className="border-b border-[#dde4e7] bg-[#f4f7f8]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <SectionHeading
                eyebrow="China factory network"
                title="Source by production cluster, not search rank."
                body="China's FRP capabilities are regional. We route each requirement to the cluster where the process, raw-material base and export experience overlap."
              />
              <div className="mt-8 flex items-start gap-3 border-l-2 border-[#e5ad45] bg-white p-5 text-[13px] leading-6 text-[#5d707b] shadow-sm">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#b97817]" />
                Factory identity stays private during the first capability
                comparison. Current evidence is released with the matched RFQ.
              </div>
            </div>

            <div className="border border-[#cedadd] bg-white">
              <div className="grid grid-cols-[72px_1fr] border-b border-[#dbe3e6] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#80919a] sm:grid-cols-[86px_140px_1fr_auto]">
                <span>Cluster</span>
                <span className="hidden sm:block">Province</span>
                <span>Capability focus</span>
                <span className="hidden sm:block">Coverage</span>
              </div>
              {CLUSTERS.map((cluster, index) => (
                <div key={cluster.code} className="group grid grid-cols-[72px_1fr] items-center border-b border-[#e0e6e8] px-5 py-6 last:border-b-0 hover:bg-[#f5f9f8] sm:grid-cols-[86px_140px_1fr_auto]">
                  <div className="font-mono text-[10px] font-semibold text-[#0d8880]">{cluster.code}</div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-[#102d3d]">{cluster.province}</div>
                    <div className="mt-1 text-[10px] text-[#84949d]">{cluster.cities}</div>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#253f4d]">{cluster.focus}</div>
                    <div className="mt-1 text-[10px] text-[#84949d] sm:hidden">{cluster.province} · {cluster.cities}</div>
                  </div>
                  <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#73858f] sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#49b8aa]" />
                    {index < 3 ? "Primary" : "Specialist"}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-4 bg-[#0c2737] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[13px] text-[#b5c8d0]">
                  Need a process not shown here? Route the requirement through the desk.
                </div>
                <Link href="/rfq" className="inline-flex items-center gap-2 text-sm font-semibold text-[#73d5c9] hover:text-white">
                  Match my project <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence and assurance */}
      <section className="border-b border-[#dde4e7] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <SectionHeading
              eyebrow="Evidence before claims"
              title="Qualification that follows the product."
              body="A logo on a PDF is not supplier qualification. We connect legal identity, certificate scope, product evidence and shipment inspection to the same buying requirement."
            />
            <div className="grid gap-px overflow-hidden border border-[#d5dfe2] bg-[#d5dfe2] sm:grid-cols-2">
              {[
                [ShieldCheck, "Legal identity", "Business license, unified social credit code, site address and operating scope."],
                [FileBadge, "Certificate scope", "Holder, issuing body, validity and relevance to the offered product."],
                [FlaskConical, "Product evidence", "Material system, test method, specimen and production batch traceability."],
                [ClipboardCheck, "Shipment release", "Approved sample, inspection plan, MTC and packing checks before dispatch."],
              ].map(([Icon, title, body]) => {
                const EvidenceIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={title as string} className="bg-[#f7f9fa] p-6">
                    <EvidenceIcon size={20} strokeWidth={1.5} className="text-[#0b847d]" />
                    <h3 className="mt-5 text-[15px] font-semibold text-[#102d3d]">{title as string}</h3>
                    <p className="mt-2 text-[12px] leading-5 text-[#697b85]">{body as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-[#e0e6e8] py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#687b85]">
            <span className="font-semibold text-[#163443]">Evidence framework</span>
            <span>ISO 9001</span>
            <span>EN 13706</span>
            <span>ASTM / GB / ISO crosswalk</span>
            <span>Batch MTC</span>
            <span>Pre-shipment inspection</span>
          </div>
        </div>
      </section>

      {/* AI is positioned as a procurement utility, not the entire proposition. */}
      <section className="border-b border-[#dde4e7] bg-[#eef3f4]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#dceae8] px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#0a756f]">
              <Bot size={12} /> Sourcing copilot
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#0a2636] sm:text-4xl">
              Ask the network before you send the RFQ.
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-[#5e717c]">
              Search the supplier graph, compare standards and pressure-test a
              material choice. Answers point back to indexed records so an
              engineer can verify the route.
            </p>
            <div className="mt-8 space-y-3 text-[12px] text-[#506772]">
              {[
                "Supplier shortlisting by process and certification",
                "GB ⇄ ASTM ⇄ ISO ⇄ EN standards mapping",
                "Material selection and sourcing-risk prompts",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0b9187]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#ccd9dc] bg-white p-4 shadow-[0_20px_60px_rgba(16,45,61,0.08)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[#e0e6e8] pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#102d3d]">
                <Search size={15} className="text-[#0b857d]" />
                Query the China FRP network
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#82939c]">
                Sources cited
              </span>
            </div>
            <ChatHero
              exampleGroups={EXAMPLE_GROUPS}
              anonLimit={ANON_CHAT_LIMIT}
              isSignedIn={!!uid}
            />
          </div>
        </div>
      </section>

      {/* Indexed knowledge */}
      <section className="border-b border-[#dde4e7] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Sourcing intelligence"
              title="The technical layer behind every shortlist."
              body="Supplier matching is grounded in structured material, standards and research records—not product-title keyword matching."
            />
            <div className="flex gap-7">
              <div>
                <div className="font-mono text-xl font-semibold text-[#0c2d3d]">{materialRecords.toLocaleString()}+</div>
                <div className="text-[10px] uppercase tracking-wider text-[#7b8c95]">materials</div>
              </div>
              <div>
                <div className="font-mono text-xl font-semibold text-[#0c2d3d]">{paperRecords.toLocaleString()}+</div>
                <div className="text-[10px] uppercase tracking-wider text-[#7b8c95]">papers</div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            <div className="border border-[#d9e2e5] p-6">
              <div className="flex items-center justify-between">
                <FileBadge size={19} className="text-[#0b857d]" />
                <Link href="/standards" className="text-[11px] text-[#6c7e87] hover:text-[#0b857d]">View index →</Link>
              </div>
              <h3 className="mt-5 text-base font-semibold text-[#102d3d]">Standards crosswalk</h3>
              <div className="mt-5 divide-y divide-[#e4e9eb]">
                {featured.topStandards.length ? (
                  featured.topStandards.map((standard) => (
                    <Link key={standard.id} href={`/standards/${standard.id}` as "/standards/[id]"} className="block py-3 first:pt-0 hover:text-[#0b857d]">
                      <div className="font-mono text-[10px] text-[#0b857d]">{standard.code}</div>
                      <div className="mt-1 line-clamp-1 text-[12px] text-[#5f727c]">{standard.titleEn}</div>
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-[12px] text-[#788991]">Browse GB, ASTM, ISO and EN references.</p>
                )}
              </div>
            </div>

            <div className="border border-[#d9e2e5] p-6">
              <div className="flex items-center justify-between">
                <Database size={19} className="text-[#0b857d]" />
                <Link href="/materials" className="text-[11px] text-[#6c7e87] hover:text-[#0b857d]">Search materials →</Link>
              </div>
              <h3 className="mt-5 text-base font-semibold text-[#102d3d]">Material systems</h3>
              <div className="mt-5 grid grid-cols-2 gap-px bg-[#e1e7e9]">
                {[["Resin", "UP · VE · EP"], ["Fiber", "Glass · Carbon"], ["Core", "Foam · Honeycomb"], ["Additives", "FR · UV · pigment"]].map(([label, value]) => (
                  <div key={label} className="bg-[#f7f9fa] p-4">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#7d8e97]">{label}</div>
                    <div className="mt-2 text-[11px] font-medium text-[#324d5b]">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#d9e2e5] p-6">
              <div className="flex items-center justify-between">
                <Boxes size={19} className="text-[#0b857d]" />
                <Link href="/papers" className="text-[11px] text-[#6c7e87] hover:text-[#0b857d]">Research library →</Link>
              </div>
              <h3 className="mt-5 text-base font-semibold text-[#102d3d]">Applied research</h3>
              <div className="mt-5 divide-y divide-[#e4e9eb]">
                {featured.topPapers.length ? (
                  featured.topPapers.map((paper) => (
                    <Link key={paper.id} href={`/papers/${paper.slug ?? paper.id}` as "/papers/[id]"} className="block py-3 first:pt-0">
                      <div className="line-clamp-2 text-[12px] leading-5 text-[#5f727c] hover:text-[#0b857d]">{paper.titleEn}</div>
                      {paper.year ? <div className="mt-1 font-mono text-[9px] text-[#8a999f]">{paper.year}</div> : null}
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-[12px] text-[#788991]">Browse curated FRP manufacturing research.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final conversion */}
      <section className="relative overflow-hidden bg-[#dfecea]">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(#aecbc6_1px,transparent_1px),linear-gradient(90deg,#aecbc6_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0b756f]">Start with the requirement</div>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#0a2838] sm:text-4xl">
              Send the drawing. We&apos;ll map the route through China.
            </h2>
            <p className="mt-4 max-w-xl text-[14px] leading-6 text-[#576e78]">
              Receive a structured response covering specification gaps, matched
              factory capabilities, evidence required and the next commercial step.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/rfq" className="inline-flex h-12 items-center gap-2 rounded-md bg-[#0a2a3a] px-6 text-sm font-semibold text-white hover:bg-[#12394b]">
              Build an RFQ <ArrowRight size={15} />
            </Link>
            <Link href="/source-from-china" className="inline-flex h-12 items-center gap-2 rounded-md border border-[#7fa29d] bg-white/50 px-6 text-sm font-semibold text-[#143543] hover:bg-white">
              See how sourcing works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
