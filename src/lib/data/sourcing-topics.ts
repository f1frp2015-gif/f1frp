// Hub-and-spoke landing pages for getfrp.com's mid-tail and long-tail
// keyword warfare. Each topic is a buying-intent question or a sourcing-
// adjacent compliance pain point; the page rendered from this data ranks
// for one A/B-tier keyword cluster and feeds RFQs back to /rfq.
//
// Content authored by the f1frp editorial team. Keep tone factual,
// engineer-readable, light on marketing claims — Google's helpful-content
// updates penalize fluff and AI search engines (Perplexity / ChatGPT)
// extract from concrete sentences, not adjectives.

export interface SourcingFAQ {
  question: string;
  answer: string;
}

export interface SourcingSection {
  heading: string;
  body: string[];
}

export interface SourcingTopic {
  slug: string;
  pillar: "product" | "compliance" | "standards" | "process";
  /** Phrase planted into H1 and OG-image. Should contain at least one A-tier kw. */
  title: string;
  /** Hero line under H1; one factual sentence. */
  intro: string;
  /** Slightly longer (60-100 words) deck above the first section. */
  deck: string;
  metaTitle: string;
  metaDescription: string;
  /** Stat strip shown above the deck, four entries max. */
  stats: Array<{ label: string; value: string }>;
  sections: SourcingSection[];
  faqs: SourcingFAQ[];
  /** Cross-links rendered in the related-links footer. Hub link is implicit. */
  related: Array<{ label: string; href: string }>;
  /** Filters applied if user clicks "browse suppliers in this category". */
  supplierFilter?: { category?: string; cert?: string; province?: string };
}

export const sourcingTopics: SourcingTopic[] = [
  {
    slug: "frp-grating",
    pillar: "product",
    title: "Source FRP grating from China — supplier shortlist & specifications",
    intro:
      "Verified Chinese FRP grating manufacturers, classified by molded vs pultruded process, with the certifications overseas buyers actually screen by.",
    deck:
      "FRP grating is the highest-volume cross-border SKU in the Chinese composites trade and the easiest one to get wrong on the first import. Two manufacturing processes (molded and pultruded) produce visually similar products with very different load profiles, fire ratings and unit economics. This page maps the Chinese supply base by process, lists the certifications that matter per end-market, and points to the verified plants that already ship into US, EU, AU and ME projects.",
    metaTitle: "FRP grating supplier China — molded & pultruded shortlist",
    metaDescription:
      "Verified Chinese FRP grating manufacturers: molded vs pultruded process, CE / EN 13706 / DNV / ASTM-tested mill sheets, MOQ and lead-time benchmarks for export buyers.",
    stats: [
      { label: "FRP grating exporters indexed", value: "40+" },
      { label: "Typical MOQ (molded)", value: "200 m²" },
      { label: "Typical lead time, FOB", value: "25-35 days" },
      { label: "ISO 9001 share of indexed plants", value: "≥ 80%" },
    ],
    sections: [
      {
        heading: "Molded vs pultruded — pick the process before the supplier",
        body: [
          "Molded grating is built up panel-by-panel in an open mold. It carries lower MOQ, accepts custom shapes (curved walkways, scallops, fitted hatch openings) and gives you bi-directional load capacity. The downside: panel-to-panel cosmetic variance is higher, and labor cost dominates the unit price, so it stays profitable at mid-volume runs and gets expensive past 1,000 m² orders.",
          "Pultruded grating runs through a heated die in continuous lengths and is then cut to size. Strength is one-directional (along the bar), but the strength-to-weight ratio is higher than molded, surface finish is mill-consistent, and the unit cost drops as volume scales. Use pultruded when the load case is predictable (cable trays, walkways with known direction-of-travel) and the project is large enough to amortize the die setup cost.",
          "Most Chinese FRP grating plants run only one of the two processes — they specialize. A plant that quotes you both is almost always brokering one of them; verify the production photos match the process.",
        ],
      },
      {
        heading: "Certifications that unlock end-markets",
        body: [
          "EU: CE marking under EN 13706 (the European pultruded profile standard, applies to pultruded grating; molded grating uses EN 14710-2). Fire performance per EN 13501-1 class B-s1, d0 for indoor architectural use.",
          "United States: ASTM-tested mill sheets per ASTM D7032 (for the cross-bar bond) and ASTM E84 (Class A for fire spread). For offshore platforms, USCG-approved Level 1/2/3.",
          "Marine / offshore: DNV-GL, Lloyd's Register, or CCS approval. The mold/pultrusion line itself needs class society audit; ask for the certificate scope, not just the cert number.",
          "AU/NZ: AS/NZS 4264 for slip resistance is the gating spec for industrial walkways.",
        ],
      },
      {
        heading: "Pricing benchmarks (FOB CN, 2026 mid)",
        body: [
          "Molded ISO mesh 38mm × 38mm, 25mm panel: USD 28-38/m² FOB. Premium colored / UV-stabilized resin adds USD 4-7/m².",
          "Pultruded I-bar grating 38mm deep: USD 24-32/m² FOB at 1,000 m² volume. Add USD 2-5/m² for non-standard cross-bar pitch.",
          "Volume break: most Chinese plants give 5-8% off above 2,000 m² and 10-12% above 5,000 m². Don't expect more than that — material cost dominates the structure.",
          "Don't compare a plant's price to Alibaba listings — listings usually exclude the cross-bar fabric (the part that gives the grating its load rating) or quote bare-resin grades unsuitable for outdoor service.",
        ],
      },
      {
        heading: "Where the capacity lives",
        body: [
          "Jiangsu (around Nantong, Yangzhou) and Hebei (around Hengshui) are the two FRP grating clusters in China. Jiangsu is closer to Shanghai port, plants are larger and more export-experienced. Hebei is older capacity, often cheaper, sometimes patchier on certifications.",
          "Shandong has a smaller pultruded-grating cluster aligned with the carbon-fiber and offshore wind supply chains.",
          "Provincial concentration matters because the freight cost from inland to a coastal port can absorb 60-80% of the price advantage of buying from a non-cluster plant.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the minimum order quantity for FRP grating from China?",
        answer:
          "Most Chinese FRP grating plants quote a 200 m² minimum for molded grating and 500 m² for pultruded. Below those volumes, you'll either pay a small-batch surcharge (typically 8-15%) or be brokered to a smaller plant whose certifications you should re-verify.",
      },
      {
        question: "How long does it take to ship FRP grating from China?",
        answer:
          "Production lead time runs 25-35 days from PO for stock-color molded grating, 35-50 days for pultruded or custom-color. Add 28-35 days ocean freight to US East Coast, 30-40 to North Europe, 40-55 to South America. Plants with in-house finishing (UV coating, color matching) deliver faster than those subcontracting that step.",
      },
      {
        question: "Are Chinese FRP gratings tested to ASTM and EN standards?",
        answer:
          "Most export-grade Chinese plants test panels per ASTM D7032 (mechanical) and EN 13501-1 (fire) at CNAS-accredited third-party labs (SGS, Bureau Veritas, TÜV, Intertek). Always request the original test report PDF and verify the test panel was cut from the same mold/die as your production order — that's the most common failure point in disputes.",
      },
      {
        question: "Can I get fire-retardant FRP grating from Chinese suppliers?",
        answer:
          "Yes. Fire-retardant grades use modified vinyl ester or phenolic resin (vs general-purpose orthophthalic polyester). Expect a 15-25% premium and 1-2 weeks longer lead time. Confirm Class I fire rating per ASTM E84 (smoke spread) and EN 13501-1 (reaction to fire) — these are the two standards US and EU specifiers ask for.",
      },
    ],
    related: [
      { label: "Verified pultrusion suppliers", href: "/pultrusion" },
      { label: "Standards crosswalk (GB ⇄ ASTM ⇄ EN)", href: "/standards" },
      { label: "Sourcing playbook (RFQ → delivery)", href: "/source-from-china" },
    ],
    supplierFilter: { category: "manufacturer" },
  },

  {
    slug: "frp-rebar",
    pillar: "product",
    title: "Source FRP rebar from China — GFRP / BFRP / CFRP rebar suppliers",
    intro:
      "Verified Chinese FRP rebar manufacturers — glass, basalt and carbon fiber rebar — with the corrosion-resistant infrastructure pedigree your project specifier wants.",
    deck:
      "FRP rebar is the fastest-growing infrastructure SKU in cross-border Chinese composites trade. Substituting steel rebar in seawall, bridge deck, parking structure and chloride-exposed slab applications eliminates corrosion as a failure mode — and Chinese capacity for GFRP and BFRP rebar has scaled past the European supply by 2024. This page maps the Chinese FRP rebar supply base by fiber system, lists the ACI / ASTM / EN specs each plant tests against, and explains where the unit-cost math actually beats steel.",
    metaTitle: "FRP rebar supplier China — GFRP / BFRP / CFRP rebar export",
    metaDescription:
      "Verified Chinese FRP rebar manufacturers: GFRP, BFRP and CFRP rebar tested to ACI 440.6, ASTM D7957 and ISO 10406. Specifications, MOQs, and an export-ready shortlist.",
    stats: [
      { label: "FRP rebar exporters indexed", value: "25+" },
      { label: "Typical MOQ", value: "5 tons" },
      { label: "Premium vs epoxy-coated steel", value: "1.5-2.5×" },
      { label: "Service life in chloride exposure", value: "75-100 yr" },
    ],
    sections: [
      {
        heading: "Fiber system — match it to your durability case",
        body: [
          "GFRP (glass-fiber) rebar is the mainstream choice. It eliminates corrosion in chloride and de-icing-salt service, weighs ~75% less than steel, and costs 1.5-2× the steel rebar unit price. Tensile strength is 1.5-2× steel, but Young's modulus is only ~25% of steel — so deflection-controlled designs need re-checking.",
          "BFRP (basalt-fiber) rebar trades a 10-15% cost premium for higher temperature stability and slightly better long-term creep resistance. Use it where service temperatures exceed 80 °C or where the project specifier has an environmental sourcing requirement (basalt is geologically abundant).",
          "CFRP (carbon-fiber) rebar is the niche — 4-6× the cost of GFRP — and exists mainly for prestressed bridge tendons, post-tensioning, and the very-thin-cover applications GFRP can't handle. Don't quote CFRP on a slab job unless the specifier explicitly calls for it.",
        ],
      },
      {
        heading: "Standards and ACI compliance",
        body: [
          "Primary North American spec: ACI 440.6-08 (material spec) + ASTM D7957 (specification for solid round GFRP bars for concrete reinforcement). All export-ready Chinese GFRP rebar plants test against D7957 — request the report, including the bar dimensions tested, since D7957 has size-specific bar property tables.",
          "Europe and ME: ISO 10406-1:2015 (specification) + EN 17171-1 (Eurocode-compatible material spec). EU projects increasingly cite EAD 220066-00-0402 for the European Technical Assessment route.",
          "Chinese domestic spec: GB/T 26743-2020 covers GFRP bar properties; most plants test to GB/T in parallel to the international spec.",
          "On the design side, AASHTO LRFD Bridge Design Guide Specifications for GFRP-Reinforced Concrete (3rd ed., 2018) is the design code US DOTs cite. Chinese plants don't need to certify against AASHTO — but the spec sheet they hand you should have the engineering values AASHTO requires.",
        ],
      },
      {
        heading: "Pricing and unit-cost math",
        body: [
          "Mid-2026 FOB CN benchmark for #4 / #5 / #6 GFRP rebar at 5-10 ton MOQ: USD 1.4-1.9/m. Above 50 tons, expect USD 1.1-1.5/m. Logistics adds USD 0.10-0.20/m depending on destination.",
          "Compared to epoxy-coated steel rebar (the typical incumbent in chloride service), GFRP runs 1.5-2.5× higher per linear meter — but at 75% less weight, install labor drops 20-30%, and the service-life premium (75-100 years vs 25-40 for epoxy steel before re-bar) usually closes the gap on lifecycle cost.",
          "On a bridge deck retrofit job, GFRP rebar usually beats epoxy steel on first-cost too if the steel quote includes corrosion-allowance oversizing. Get both quotes specified to the same allowable stress level before comparing.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between GFRP and BFRP rebar?",
        answer:
          "GFRP rebar uses glass fibers (E-glass or ECR-glass) in a vinyl ester or epoxy resin matrix; it dominates the global FRP rebar market on cost. BFRP rebar uses basalt fibers in the same resin systems; it adds 10-15% to the cost but improves high-temperature stability and is preferred when sustainable/recyclable sourcing is a project requirement. Mechanical properties are similar; specifiers usually choose by environment and procurement-policy fit.",
      },
      {
        question: "Is FRP rebar from China compatible with ACI 440.6?",
        answer:
          "Most export-grade Chinese GFRP rebar plants test their product against ASTM D7957 (which is referenced by ACI 440.6 for material qualification). Always request the third-party test report from a CNAS-accredited lab, verify the tested bar size matches your project's, and confirm bond strength was tested per ASTM A944 modified for FRP bars — that's the bond-test method ACI 440.1R-15 references.",
      },
      {
        question: "What is the minimum order for FRP rebar from China?",
        answer:
          "Most Chinese GFRP rebar plants quote a 5-ton MOQ (~3,000 m of #5 bar). Below that, expect a small-batch surcharge or to be routed to a trader. For prequalification samples, plants will normally send 3-5 sample bars free of charge or for a USD 200-500 fee against the future PO.",
      },
      {
        question: "How does Chinese FRP rebar compare to Pultrall / Owens Corning?",
        answer:
          "On material properties, the top tier of Chinese GFRP rebar plants (the ones holding D7957 + ISO 10406 certifications and shipping into US DOT projects) hits the same property bands as North American incumbents. Where they differ is on QA documentation maturity and lot-traceability — the incumbents' QA paperwork is often easier to plug into a US bridge submittal. Chinese plants typically close the documentation gap when paired with a sourcing agent that handles spec submittals.",
      },
    ],
    related: [
      { label: "Verified manufacturer directory", href: "/suppliers" },
      { label: "Standards database (GB ⇄ ASTM ⇄ ISO ⇄ EN)", href: "/standards" },
      { label: "Sourcing playbook (RFQ → delivery)", href: "/source-from-china" },
    ],
    supplierFilter: { category: "manufacturer" },
  },

  {
    slug: "cbam-frp-china",
    pillar: "compliance",
    title: "CBAM compliance for FRP imports from China — the document pack",
    intro:
      "The exact carbon-data deliverables overseas importers need from a Chinese FRP supplier so the CBAM Registry entry clears customs without a delay.",
    deck:
      "EU CBAM (Carbon Border Adjustment Mechanism) started phasing in for composites-adjacent goods in 2024 and is now the most frequent customs hold-up for FRP shipments into Germany, the Netherlands, France and Italy. The Chinese supply side wasn't designed for it — plants don't routinely produce embedded-carbon documentation in the format the EU CBAM Registry expects. This page lists the exact document pack you should request before the first PO, explains how to calculate or accept the EU default values, and points to the labs that can generate the missing pieces in China.",
    metaTitle: "CBAM compliance for FRP from China — document pack & deadlines",
    metaDescription:
      "EU CBAM compliance for Chinese FRP imports: required documents, embedded carbon calculation routes, accredited Chinese labs, and the timeline that keeps your CBAM Registry entry clean at customs.",
    stats: [
      { label: "Full reporting obligation since", value: "Jan 2026" },
      { label: "Quarterly CBAM Registry filing", value: "Required" },
      { label: "Default-value fallback (loses 20-30% allowance)", value: "Available" },
      { label: "Pre-shipment doc-pack lead time", value: "2-3 weeks" },
    ],
    sections: [
      {
        heading: "The five-document CBAM pack to request from a Chinese supplier",
        body: [
          "1. Verified business license + Unified Social Credit Code (USCC). This is the entity that owns the production site and is named on the CBAM declaration.",
          "2. Material Test Certificate (MTC) per shipment batch. Composition (fiber-resin ratio), fiber type, resin type. The MTC ties a specific quantity of product to a specific production run.",
          "3. Energy mix declaration covering the production site. Grid-electricity emission factor (province-specific in China — Inner Mongolia is dirtier than Sichuan), plus any on-site fuel use. This is the field most Chinese plants don't have ready.",
          "4. Embedded-carbon calculation, in kgCO₂e per kg of finished FRP product. Either the plant calculates installation-specific data using ISO 14067 LCA boundaries, or you accept the EU Commission's CBAM Default Values (which intentionally penalize 20-30% to discourage default-value usage).",
          "5. Third-party verification of the embedded-carbon number by an accredited verifier. The EU accepts a limited list: TÜV Rheinland, Bureau Veritas, SGS, DEKRA — and a handful of Chinese national bodies under mutual recognition.",
        ],
      },
      {
        heading: "Default values vs installation-specific data — the tradeoff",
        body: [
          "Using the EU CBAM Default Values means you don't need the plant to produce installation-specific carbon data — the EU publishes per-product-category defaults and you use those. The catch: defaults are intentionally set 20-30% higher than typical real-world emissions, which translates directly into CBAM certificate cost.",
          "Installation-specific data — calculated using the plant's actual energy mix and production efficiency — usually beats the default by exactly that 20-30% margin. But it requires the plant to set up the LCA documentation, which costs USD 8,000-25,000 one-time and 2-3 months elapsed.",
          "Rule of thumb: if your annual import volume into the EU exceeds 50 tons of FRP product, the installation-specific route pays for itself within the first year. Below that, use defaults.",
        ],
      },
      {
        heading: "Chinese labs that can verify the embedded-carbon number",
        body: [
          "TÜV Rheinland Shanghai, TÜV Süd Shanghai, Bureau Veritas Shanghai and SGS-CSTC operate accredited LCA verification services in China and produce reports the EU Customs Authority accepts without further validation.",
          "Domestic Chinese verifiers — CTI, CQM, and a few province-level bodies — have mutual recognition under specific EU bilateral arrangements but the import broker on the EU side may require additional documentation.",
          "Plan 8-12 weeks for the first verification cycle (longer if the plant doesn't have prior LCA work). Subsequent cycles (annual updates) typically run 3-4 weeks.",
        ],
      },
      {
        heading: "How the timeline plays into your purchase order",
        body: [
          "The CBAM declaration is filed quarterly by the EU importer of record, covering shipments that landed in the previous quarter. The supplier-side carbon documentation needs to be in hand before the shipment leaves China — not after — because the EU customs declaration line item references the CBAM Registry entry.",
          "If documentation is missing at customs, the importer can claim default values as a stopgap but takes the 20-30% penalty, and the importer-of-record is on the hook for any subsequent verification.",
          "Build a 4-6 week buffer between the supplier's documentation deadline and the PSI date. The most common failure mode is the plant promising the docs in 2 weeks and delivering them in 6.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does CBAM apply to FRP products?",
        answer:
          "CBAM's product scope is expanding in phases. As of 2026, fiber-reinforced composite products are within scope for embedded-carbon reporting when imported into the EU. The applicable CN code determines which CBAM product category and default values apply — typically CN 3926 (other articles of plastics) or CN 7019 (glass fibers and articles thereof), depending on whether the finished product is fiber-dominant or matrix-dominant.",
      },
      {
        question: "Can a Chinese FRP supplier provide CBAM documentation?",
        answer:
          "Most large Chinese FRP exporters can produce the document pack with 4-8 weeks of lead time, but few have it pre-staged. Smaller plants will typically need to be paired with a third-party LCA consultant. getfrp's sourcing desk pre-generates the document pack on first shipment with an accredited verifier (TÜV / Bureau Veritas / SGS) so the EU importer's CBAM Registry entry is ready before customs.",
      },
      {
        question: "What is the difference between CBAM default values and installation-specific data?",
        answer:
          "Default values are EU-published per-product carbon factors that you can use without supplier-side measurement — they're intentionally set 20-30% higher than typical real-world values. Installation-specific data is the supplier's actual measured carbon intensity for their plant, calculated under ISO 14067 LCA boundaries and verified by an accredited third party. Above ~50 tons of annual FRP imports, installation-specific data pays for itself; below that, defaults are usually more economical.",
      },
    ],
    related: [
      { label: "Standards & test method crosswalk", href: "/standards" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
      { label: "Sourcing playbook", href: "/source-from-china" },
    ],
  },

  {
    slug: "gb-vs-astm-frp",
    pillar: "standards",
    title: "GB vs ASTM for FRP composites — test method equivalents",
    intro:
      "Side-by-side equivalents for the most-cited FRP test methods between Chinese GB standards and US ASTM / international ISO and EN specs.",
    deck:
      "Chinese FRP plants test to GB (Guobiao) standards by default. Overseas buyers usually source projects against ASTM, ISO or EN specs. The two systems are converging but not identical — and the gaps are often where a first-time import goes wrong. This page tabulates the equivalents most overseas buyers ask for, explains where the methods diverge in practice, and recommends which CNAS-accredited labs in China can test to either system on the same sample run.",
    metaTitle: "GB vs ASTM FRP standards — test method crosswalk",
    metaDescription:
      "FRP test method equivalents: China GB/T standards mapped to US ASTM, ISO and EN — tensile, flexural, ILSS, fire, water absorption, and where the methods actually diverge in practice.",
    stats: [
      { label: "Test methods mapped", value: "30+" },
      { label: "GB test-method update cycle", value: "5-7 years" },
      { label: "ASTM update cycle", value: "5 years (revisit)" },
      { label: "CNAS-accredited labs in CN", value: "100+" },
    ],
    sections: [
      {
        heading: "The four test methods you'll always need",
        body: [
          "Tensile: GB/T 1447-2005 vs ASTM D3039 / ISO 527-4. Specimen geometry differs slightly — GB uses a fixed dog-bone, ASTM allows straight-sided coupons with end tabs. For safety-critical structural parts, request the panel be cut to ASTM D3039 dimensions and tested at a CNAS-accredited lab.",
          "Flexural: GB/T 1449-2005 vs ASTM D790 / ISO 14125. Three-point bend is the default in both. Span-to-depth ratio differs (GB 16:1, ASTM D790 typically 32:1 for FRP) — the value at one span isn't directly comparable to the other.",
          "Interlaminar shear (ILSS): GB/T 1450.1-2005 vs ASTM D2344 / ISO 14130. Short-beam shear method is the same; specimen geometry differs by ~10%. Acceptance limits should always be cited against one specific method, not both.",
          "Fiber/resin ratio: GB/T 2577-2005 vs ASTM D2584 / ISO 1172. Both are calcination methods at 600 °C; results are interchangeable.",
        ],
      },
      {
        heading: "Fire performance and durability",
        body: [
          "Fire spread (architectural FRP): GB 8624-2012 class A1 / B1 vs ASTM E84 class A / B vs EN 13501-1 class A1-A2 / B-s1, d0. The three are not directly convertible — they measure different aspects of fire behavior. A B-rated material under GB may or may not meet ASTM E84 class B.",
          "Smoke generation: GB/T 8323 vs ASTM E662 — same NBS smoke chamber method, results comparable.",
          "Water absorption: GB/T 1462 vs ASTM D570 vs ISO 62 — all comparable, gravimetric method.",
          "Glass transition (Tg): GB/T 22567 vs ASTM E1640 / ISO 6721 — DMA-based, results comparable.",
        ],
      },
      {
        heading: "Pultruded profile product standards",
        body: [
          "Chinese GB/T 31539-2015 covers pultruded structural profiles and is the rough analogue of EN 13706. The two standards specify different test panels (EN 13706 has more sub-cases for marine and architectural exposure), so an EN 13706-rated plant has slightly more documentation than a GB/T 31539-only plant.",
          "ASCE Pre-Standard for LRFD of Pultruded FRP Structures (2010) is the US design-side counterpart; it references ASTM material tests rather than EN methods.",
          "Most export-grade Chinese pultrusion plants test to GB/T 31539 + at least one of EN 13706 or the ASCE Pre-Standard references.",
        ],
      },
      {
        heading: "Which lab can test to either system",
        body: [
          "SGS-CSTC, Bureau Veritas, TÜV Rheinland and Intertek operate CNAS-accredited labs in China that test FRP samples to both GB and ASTM/ISO/EN methods in the same run. Expect USD 500-2,000 per test panel depending on the method set.",
          "Chinese national labs like CFC (Composite Research Center, Beijing) and the Composite Materials Research Centre at Harbin Institute of Technology run accredited services for GB methods; for ASTM cross-tests, the international labs are usually faster.",
          "Always specify in the RFQ: 'Test report must include both GB/T and ASTM/EN method values on the same specimen set.' That single sentence saves the back-and-forth of re-testing.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the GB equivalent of ASTM D3039?",
        answer:
          "GB/T 1447-2005 is China's analog to ASTM D3039 for tensile properties of fiber-reinforced plastics. The specimen geometry and gripping conditions are similar but not identical; for safety-critical structural parts, request the test panel be cut to ASTM D3039 dimensions and tested at a CNAS-accredited lab (SGS / Bureau Veritas / Intertek / TÜV China).",
      },
      {
        question: "Are GB and ASTM test results directly comparable for FRP?",
        answer:
          "Some methods (water absorption, fiber/resin ratio, smoke chamber) give comparable numbers. Others (flexural, fire spread, fatigue) measure different aspects and the numbers are not directly convertible. Always tie acceptance criteria to a specific method — the contract should name 'tested per ASTM D790' or 'tested per GB/T 1449,' not just 'flexural strength ≥ X.'",
      },
      {
        question: "Can a single Chinese lab test to both GB and ASTM?",
        answer:
          "Yes. The major international labs operating in China (SGS, Bureau Veritas, TÜV Rheinland, Intertek) maintain CNAS accreditation for both GB and ASTM/ISO/EN test methods. Specify in the RFQ that test reports must include both system's values on the same specimen set to avoid the back-and-forth of separate retest cycles.",
      },
      {
        question: "Where can I find a full GB ⇄ ASTM ⇄ ISO ⇄ EN crosswalk?",
        answer:
          "getfrp's standards crosswalk page lists the equivalents for tensile, flexural, ILSS, fire, water absorption, glass transition, and several product-level standards. For deeper coverage, the ASTM D30 Committee publishes an annual digest of international FRP standard equivalents, and the China Construction Industry Press publishes a similar reference in Mandarin every 3-4 years.",
      },
    ],
    related: [
      { label: "Standards database", href: "/standards" },
      { label: "Verified suppliers by category", href: "/source-from-china" },
      { label: "Process wiki & calculators", href: "/tech" },
    ],
  },
];

export const sourcingTopicSlugs = sourcingTopics.map((t) => t.slug);

export function findSourcingTopic(slug: string): SourcingTopic | undefined {
  return sourcingTopics.find((t) => t.slug === slug);
}
