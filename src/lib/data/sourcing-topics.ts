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
  /** "What you'll learn" bullets shown near the top — Western scan UX. */
  takeaways: string[];
  sections: SourcingSection[];
  faqs: SourcingFAQ[];
  /** Cross-links rendered in the related-links footer. Hub link is implicit. */
  related: Array<{ label: string; href: string }>;
  /** Filters applied if user clicks "browse suppliers in this category". */
  supplierFilter?: { category?: string; cert?: string; province?: string };
  /** Editorial attribution — Western readers distrust anonymous content.
   *  Use a desk + a credentials line; named-author optional once we have
   *  consent from a specific composites engineer on the team. */
  byline?: string;
  reviewedBy?: string;
  reviewedDate?: string;
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
      { label: "Typical MOQ (molded)", value: "200 m² / 2,150 sq ft" },
      { label: "Typical lead time, FOB", value: "25-35 days" },
      { label: "ISO 9001 share of indexed plants", value: "≥ 80%" },
    ],
    takeaways: [
      "How to pick molded vs pultruded process before contacting suppliers (it saves three weeks)",
      "Which certifications unlock each end-market (CE / DNV / ASTM / AS/NZS)",
      "Mid-2026 FOB price benchmarks for ISO mesh and pultruded I-bar grating",
      "Which Chinese provinces actually produce grating at export scale (and which don't)",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy: "Reviewed by F1 Composite sourcing engineers (China-based, hands-on plant visits since 2022)",
    reviewedDate: "2026-05",
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
      { label: "Typical MOQ", value: "5 tons / 11,000 lb" },
      { label: "Premium vs epoxy-coated steel", value: "1.5-2.5×" },
      { label: "Service life in chloride exposure", value: "75-100 yr" },
    ],
    takeaways: [
      "When GFRP beats steel rebar on lifecycle cost (it's earlier than you think)",
      "Match the fiber system (GFRP / BFRP / CFRP) to your durability case",
      "Which Chinese plants test to ACI 440.6 + ASTM D7957 vs only GB/T",
      "Real FOB pricing benchmarks for #4/#5/#6 GFRP bar at 5+ ton volumes",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy: "Reviewed by F1 Composite sourcing engineers · cross-checked against ACI 440 design committee references",
    reviewedDate: "2026-05",
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
    takeaways: [
      "The exact five-document pack to request from your Chinese supplier (and which one most plants don't have)",
      "Default values vs installation-specific data — when each is the right call",
      "Which Chinese labs (TÜV / Bureau Veritas / SGS) the EU will accept without re-verification",
      "How to build a buffer into your PO timeline so customs doesn't hold the shipment",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy: "Reviewed by F1 Composite compliance partners + cross-checked against EU Commission CBAM guidance (Q1 2026 edition)",
    reviewedDate: "2026-05",
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
    takeaways: [
      "Which GB and ASTM methods give comparable numbers (and which only look the same)",
      "How to specify a test report so it covers both systems on one specimen run",
      "When pultruded profiles tested to GB/T 31539 also satisfy EN 13706",
      "Which CNAS-accredited labs in China can test to both systems on the same sample",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy: "Reviewed by F1 Composite engineering team · cross-referenced against ASTM D30 Committee 2025 digest and GB/T National Standards 2023 revisions",
    reviewedDate: "2026-05",
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
  {
    slug: "china-frp-import-tariffs",
    pillar: "compliance",
    title:
      "China FRP import tariffs, anti-dumping & Section 301 — what actually applies",
    intro:
      "A plain-English map of the duties that hit Chinese FRP/GFRP on import into the US, EU and Canada — MFN tariffs, anti-dumping/countervailing (AD/CVD), Section 301 and CBAM — and, just as important, which ones do NOT apply to ordinary pultruded profiles.",
    deck:
      "The biggest landed-cost surprise on a first Chinese FRP import is a trade-remedy duty nobody priced in. But the headline numbers — EU anti-dumping of 34–69%, US Section 301 of 25% — are scoped to specific products (glass-fibre fabric, fiberglass door panels), not to every FRP part. This page separates the duty that always applies (the MFN tariff) from the conditional ones (AD/CVD, Section 301) that depend on HS classification and country of origin, and names the authoritative measures so you can verify each one yourself before you commit.",
    metaTitle: "China FRP import tariffs & anti-dumping duty — US / EU / Canada",
    metaDescription:
      "Do anti-dumping or Section 301 duties apply to Chinese FRP? MFN tariffs by HS code (3916 / 3925 / 7019), EU glass-fibre AD 34–69%, US door-panel AD/CVD, the 2026-11-10 Section 301 cliff, and CBAM — scoped honestly for pultruded profiles, with sources.",
    stats: [
      { label: "MFN import duty, FRP profiles", value: "≈ 5–6.5% of CIF" },
      { label: "EU anti-dumping, glass-fibre fabric", value: "34–69%" },
      { label: "US Section 301 exclusion expiry", value: "2026-11-10" },
      { label: "Markets mapped", value: "US · EU · Canada" },
    ],
    takeaways: [
      "The MFN duty that always applies by HS chapter (3916 profiles, 3925 grating/panel, 7019 glass fibre)",
      "Why EU anti-dumping (34–69%) hits glass-fibre FABRIC, not pultruded profiles — and when a profile can still get caught",
      "What the 2026-11-10 Section 301 exclusion expiry means for US-bound FRP",
      "Where CBAM, Buy America and ICC-ES quietly block or tax an order before tariffs even apply",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Cross-checked against EUR-Lex, the US Federal Register and USTR notices. Trade-remedy figures are ceilings, not quotes — verify HS classification and country of origin per shipment.",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "The duty that always applies: MFN import tariff by HS code",
        body: [
          "Every FRP import pays the most-favoured-nation (MFN) import duty for its HS chapter, independent of any anti-dumping case. For Chinese FRP the three chapters that matter are 3916 (pultruded profiles, rod, tube — the bulk of structural FRP), 3925 (gratings and building panels) and 7019 (glass fibre and its fabrics/rovings).",
          "Indicative MFN rates as a share of CIF value: United States roughly 4.9–6.5% (3916 ≈ 6.5%, 3925 ≈ 5.3%, 7019 ≈ 4.9%); European Union roughly 6.0–6.5% across the three chapters; Canada roughly 0–6.5%, with 7019 glass fibre often entering duty-free. Treat these as order-of-magnitude: the exact line rate depends on the 8–10 digit subheading, which is only fixed once the spec is locked.",
          "China currently rebates 13% export VAT on these HS chapters. That rebate is already priced into a normal FOB quote — it is not an extra discount to negotiate.",
        ],
      },
      {
        heading: "Anti-dumping & countervailing (AD/CVD): scoped, not blanket",
        body: [
          "This is where the alarming numbers live, and where most buyers misread the risk. The active EU measure — re-imposed and extended by Regulation (EU) 2026/1203 — is an anti-dumping duty of 34–69% on Chinese woven/stitched glass-fibre fabrics (GFF), an INPUT material under HS 7019. A 2026 anti-circumvention ruling extends that same China rate to GFF routed through Morocco and Türkiye, so a naive 'China+1' transhipment does not escape it.",
          "Crucially, this duty is on the glass-fibre fabric itself — not on a finished pultruded profile, grating or rod. A pultruded I-beam (HS 3916) is generally outside the GFF scope. It can still be caught if it is classified into a covered subheading or is treated as essentially un-pultruded fabric, which is exactly why HS classification and origin must be confirmed per shipment rather than assumed.",
          "In the United States, an AD/CVD order on Chinese fiberglass door panels was finalized on 2026-06-15 (Federal Register) — again a specific finished product (HS 3925/3926), not profiles or grating. A separate EU countervailing measure on continuous-filament glass-fibre products (GFR, distinct from GFF fabric) is in sunset review, so its future rate is undecided; we treat it as an uncertainty flag, not a number.",
          "Our rule, and the one we would urge any buyer to adopt: never assume a single hard AD/CVD rate for a pultruded profile. Report the ceiling of any measure that could apply, name the measure, and verify the HS classification and country of origin before committing. The figures above are indicative ceilings, not a quote.",
        ],
      },
      {
        heading: "US Section 301: the 2026-11-10 cliff",
        body: [
          "Section 301 is the China-specific US tariff layer that sits on top of MFN. After the November 2025 US–China understanding, USTR extended 178 product exclusions to 2026-11-10 (Federal Register, 2025-12-01). While an exclusion is in force, the affected HS lines avoid the extra 301 duty; once it lapses, some FRP-relevant lines (within 3916 / 3925 / 7019) could revert to an added duty of up to 25%.",
          "Practically: if you are sourcing US-bound FRP for delivery near or after November 2026, build the scenario where Section 301 returns into your landed-cost model, and confirm your specific HTS line's exclusion status close to shipment rather than at the quote stage.",
        ],
      },
      {
        heading: "Before tariffs: the compliance walls that block or tax an order",
        body: [
          "CBAM (EU): any EU import triggers Carbon Border Adjustment reporting. FRP/GFRP is mostly glass and resin, so embedded carbon is low versus steel or aluminium, but the importer must still file — we supply the embedded-carbon documentation on shipment.",
          "Buy America (US): on federally funded or public-infrastructure scope, Chinese-origin FRP is generally excluded under the Build America, Buy America Act (BABA). We flag this honestly and serve private/commercial scope instead, rather than risk a non-compliant order.",
          "Fire rating: building and transit-interior uses usually require a fire class (US ASTM E84 Class A flame-spread; EU EN 13501-1 Euroclass). Fire-retardant resin systems exist but must be specified up front.",
          "ICC-ES (US structural): code approval for load-bearing FRP often needs an ICC-ES Evaluation Report (ESR), which most Chinese pultruders do not hold — a design-by-test or alternative-means path may be required.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are there anti-dumping duties on FRP imported from China?",
        answer:
          "Yes, but they are scoped to specific products, not all FRP. The EU levies 34–69% anti-dumping on Chinese woven/stitched glass-fibre FABRIC (HS 7019), extended to Morocco and Türkiye transhipment by Regulation (EU) 2026/1203. The US finalized AD/CVD on Chinese fiberglass DOOR PANELS on 2026-06-15. Ordinary pultruded profiles, rod and grating (HS 3916/3925) are usually outside these orders — but classification is case-by-case, so the HS code and origin must be verified per shipment.",
      },
      {
        question: "What is the import duty on FRP grating or profiles from China?",
        answer:
          "The MFN (baseline) duty is roughly 5–6.5% of CIF value into the US or EU, and 0–6.5% into Canada, depending on HS chapter (3916 profiles, 3925 grating/panel, 7019 glass fibre). That is the duty that always applies; anti-dumping, countervailing and US Section 301 are conditional layers on top that depend on the exact product and origin.",
      },
      {
        question: "Does US Section 301 apply to Chinese FRP profiles?",
        answer:
          "It can. Section 301 exclusions covering many FRP-relevant HS lines were extended to 2026-11-10. While an exclusion holds, the line avoids the extra 301 duty; after it lapses, some lines could revert to up to 25% on top of MFN. Confirm your specific HTS line's exclusion status close to shipment, especially for delivery near or after November 2026.",
      },
      {
        question: "Does CBAM apply to FRP composites?",
        answer:
          "EU CBAM reporting applies to the import, but FRP/GFRP carries low embedded carbon — it is mostly glass and resin, not energy-intensive metal — so the carbon liability is small relative to steel or aluminium. The obligation is mainly documentary: the importer files, and we provide the embedded-carbon paperwork on shipment.",
      },
      {
        question: "Can I use Chinese FRP on a US federal infrastructure project?",
        answer:
          "Generally no. Federally funded and public-infrastructure scope falls under Build America, Buy America (BABA), which excludes Chinese-origin material. We flag this up front and serve private/commercial scope instead — surfacing the constraint early beats discovering it at customs.",
      },
    ],
    related: [
      { label: "CBAM for Chinese FRP — buyer's compliance guide", href: "/sourcing/cbam-frp-china" },
      { label: "Source FRP from China — directory & playbook", href: "/source-from-china" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
  },
];

export const sourcingTopicSlugs = sourcingTopics.map((t) => t.slug);

export function findSourcingTopic(slug: string): SourcingTopic | undefined {
  return sourcingTopics.find((t) => t.slug === slug);
}
