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
    title: "CBAM and FRP from China — what's actually in scope (and what isn't)",
    intro:
      "A straight answer for importers: EU CBAM does not currently cover fibre-reinforced polymers. The constraint that actually moves your FRP landed cost from China is trade remedy — anti-dumping and countervailing duties — not the carbon border tax.",
    deck:
      "Overseas buyers keep asking for a 'CBAM document pack' for FRP. The honest answer is that they almost certainly don't need one yet. CBAM's definitive period, which began in January 2026, applies to six high-carbon goods — iron and steel, aluminium, cement, fertilisers, electricity and hydrogen. Fibre-reinforced polymers (GFRP / CFRP / BFRP) are not on that list, and the EU has only floated possibly extending CBAM to polymers later this decade. What genuinely changes the cost — and sometimes the feasibility — of importing Chinese FRP is the web of anti-dumping (AD), countervailing (CVD) and Section 301 measures on glass fibre and certain finished products. This page draws the line precisely and points you to the measures that do apply.",
    metaTitle: "CBAM & FRP from China — is fibre-reinforced plastic in scope?",
    metaDescription:
      "Does EU CBAM cover FRP imported from China? Not under the 2026 definitive scope (six high-carbon goods only). The real landed-cost driver is anti-dumping / CVD on glass fibre and Section 301 — mapped here, scoped honestly.",
    stats: [
      { label: "CBAM definitive period (6 sectors only)", value: "Since 2026" },
      { label: "FRP / polymers in CBAM scope", value: "Not yet" },
      { label: "EU AD on Chinese glass-fibre fabric", value: "up to ~69%" },
      { label: "US Section 301 exclusion expiry", value: "Nov 2026" },
    ],
    takeaways: [
      "Why FRP / GFRP / CFRP is not in the EU CBAM definitive scope today — and which six goods are",
      "The earliest realistic timeline for any CBAM extension to polymers",
      "The measures that actually rewrite your FRP landed cost: AD / CVD on glass fibre + Section 301",
      "What documentation is genuinely worth requesting now (MTC, ISO 9001, REACH) vs the CBAM pack you don't need yet",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy: "Reviewed against the EU CBAM Regulation (EU) 2023/956 definitive-period scope and cross-checked with EUR-Lex / USTR trade-remedy notices",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "What EU CBAM actually covers — and why FRP isn't in it",
        body: [
          "CBAM's definitive period began in January 2026 after the 2023–2025 transitional reporting phase. Its product scope is six high-carbon, high-trade-exposure goods: iron and steel, aluminium, cement, fertilisers, electricity and hydrogen. The scope is defined by CN code, and fibre-reinforced polymers — whether you classify them under CN 3916 (profiles), CN 3925 / 3926 (builders' ware and other plastics) or CN 7019 (glass fibre and articles) — are not on the CBAM list.",
          "In practice that means an importer of Chinese FRP gratings, profiles, rebar or panels has no CBAM declaration obligation and does not need an embedded-carbon document pack to clear EU customs. A supplier or intermediary selling you a 'CBAM-ready FRP pack' today is selling a document you are not required to file.",
          "The one nuance: if an FRP item ships as part of an in-scope assembly (for example a steel-framed structure), the steel or aluminium content can carry its own CBAM obligation. The polymer portion still doesn't.",
        ],
      },
      {
        heading: "Will CBAM ever extend to polymers / composites?",
        body: [
          "Possibly, but not soon. The European Commission is mandated to review extending CBAM to further products, and polymers and organic chemicals are among the categories named for assessment — not for adoption. Any extension would need its own legislative proposal, impact assessment and phase-in, which realistically puts a polymer CBAM no earlier than the late 2020s.",
          "The sensible posture for an FRP importer: don't build a CBAM documentation pipeline now, but keep the supplier relationship capable of producing province-specific grid-emission and on-site fuel data later. getfrp tracks the CBAM review and will flag the moment composites move from 'assessed' to 'proposed'.",
        ],
      },
      {
        heading: "What actually changes your FRP landed cost from China",
        body: [
          "Because GFRP is glass fibre plus resin, the binding measures are the trade-remedy duties on glass fibre and on specific finished FRP goods — not a carbon tax. On the EU side: anti-dumping duties on Chinese glass-fibre fabrics (in the tens of percent), provisional measures on glass-fibre rovings, and anti-circumvention duties extended to fibre routed via Egypt, Bahrain, Thailand, Morocco and Turkey. A continuous-filament glass-fibre countervailing measure is also under expiry review.",
          "On the US side: anti-dumping / countervailing duties on certain Chinese fiberglass products, plus Section 301 tariffs whose product exclusions are scheduled to expire in late 2026. Whether a measure bites depends on the exact HS classification of your product, which is why duty exposure has to be checked per shipment.",
          "For the rates, scope and HS-code detail, see the dedicated China FRP import-tariffs breakdown — this is where the real money is, not CBAM.",
        ],
      },
      {
        heading: "What documentation is genuinely worth requesting now",
        body: [
          "Skip the CBAM pack. Do request: a Material Test Certificate (MTC) per batch, the supplier's ISO 9001 certificate, REACH / SVHC declarations where the resin system matters, and the product certifications your end-market screens for (CE / EN 13706 for EU pultrusion, ASTM-tested mill sheets for North America).",
          "If you want to be ahead of a future CBAM extension, ask whether the plant can produce a province-specific grid emission factor and on-site fuel data. Useful to have on file later — not required now.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does EU CBAM apply to FRP imported from China?",
        answer:
          "No — not under the definitive scope that began in 2026. CBAM covers six goods: iron and steel, aluminium, cement, fertilisers, electricity and hydrogen. Fibre-reinforced polymers (GFRP / CFRP / BFRP) are not in scope, so there is no CBAM declaration obligation and no embedded-carbon document pack required to import Chinese FRP into the EU.",
      },
      {
        question: "If not CBAM, what duties actually affect Chinese FRP imports?",
        answer:
          "Trade remedy, not carbon. On the EU side, anti-dumping and countervailing duties on glass-fibre fabrics and rovings (including anti-circumvention duties on fibre routed through third countries); on the US side, AD / CVD on certain fiberglass products plus Section 301 tariffs. Whether a given measure applies depends on the product's HS classification, so exposure is checked per shipment. See the China FRP import-tariffs guide for rates and scope.",
      },
      {
        question: "Should I prepare CBAM documentation for FRP now, just in case?",
        answer:
          "There's no need to build a CBAM pipeline today. Any extension of CBAM to polymers would require its own legislation and phase-in, realistically not before the late 2020s. Keep your supplier capable of producing energy-mix and embedded-carbon data, and request the documentation that matters now — MTC, ISO 9001, REACH and market-specific product certificates.",
      },
    ],
    related: [
      { label: "China FRP import tariffs, AD/CVD & Section 301", href: "/sourcing/china-frp-import-tariffs" },
      { label: "Standards & test method crosswalk", href: "/standards" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
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
      { label: "China FRP trade-remedy tracker (AD/CVD/301 table)", href: "/data/china-frp-trade-remedies" },
      { label: "CBAM for Chinese FRP — buyer's compliance guide", href: "/sourcing/cbam-frp-china" },
      { label: "Source FRP from China — directory & playbook", href: "/source-from-china" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
  },

  {
    slug: "pultruded-profiles",
    pillar: "product",
    title: "Source pultruded FRP profiles from China — I-beam, channel, angle, tube",
    intro:
      "Verified Chinese pultruders of structural FRP profiles — I-beams, channels, angles, tubes and SHS — graded to EN 13706, with the resin systems and tolerances overseas structural buyers screen for.",
    deck:
      "Pultruded structural profiles are the highest-tonnage engineered FRP category in cross-border trade — the corrosion-proof substitute for hot-dip galvanised steel in walkways, platforms, cable supports, handrail and process structures. China has the deepest pultrusion line capacity in the world, but quality splits sharply between commodity and structural-grade plants. This page maps the Chinese profile supply base by section type and resin system, explains the EN 13706 E17 / E23 grades a specifier will ask for, and flags the tolerance and straightness checks that separate a structural pultruder from a fence-post extruder.",
    metaTitle: "Pultruded FRP profiles from China — I-beam, channel, EN 13706",
    metaDescription:
      "Source structural pultruded FRP profiles from verified Chinese pultruders: I-beams, channels, angles, tubes and SHS, graded to EN 13706 E17 / E23, with resin-system, tolerance and straightness checks for overseas structural buyers.",
    stats: [
      { label: "Common structural grade", value: "EN 13706 E23" },
      { label: "Standard resin systems", value: "ISO / VE / Phenolic" },
      { label: "Typical glass content", value: "60–70% wt" },
      { label: "Order that clears export overhead", value: "~1–2 t" },
    ],
    takeaways: [
      "The five profile families Chinese pultruders run (I / wide-flange, channel, angle, square & rectangular tube, flat & rod) and what each is for",
      "EN 13706 E17 vs E23 — what the grade actually guarantees, and when a specifier requires it",
      "Resin system selection: isophthalic polyester vs vinyl ester vs phenolic, by corrosion and fire exposure",
      "The tolerance, straightness and surface-veil checks that separate structural-grade from commodity pultrusion",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Reviewed against EN 13706 (structural pultruded profiles) and ASTM pultrusion test methods; tolerances cross-checked with verified plant data sheets",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "The five profile families and where they're used",
        body: [
          "Structural pultruded FRP comes in five repeatable section families: I-beams and wide-flange sections (primary beams and columns), channels (secondary framing, purlins, edge trim), equal and unequal angles (bracing, ladders, supports), square and rectangular hollow sections / SHS-RHS (posts, frames, handrail), and flats, rods and round tube (grating bearing bars, rungs, infill). Most overseas projects buy a kit across two or three families rather than a single section.",
          "The corrosion case is the reason to buy: a pultruded GFRP frame doesn't rust, needs no galvanising or painting, and weighs roughly a quarter of steel — which is why it dominates water and wastewater plants, chemical and electroplating plants, offshore and coastal walkways, and electrified-rail and substation structures where a non-conductive, non-magnetic frame is an advantage.",
        ],
      },
      {
        heading: "EN 13706 grades — what E17 and E23 actually mean",
        body: [
          "EN 13706 is the European standard for structural pultruded profiles and the one a serious specifier names. It defines two minimum grades by full-section axial tensile modulus: E17 (≥17 GPa) and E23 (≥23 GPa). E23 is the structural default for load-bearing frames; E17 is acceptable for lighter secondary members. The standard also fixes minimum tensile, flexural, shear and pin-bearing strengths and the test methods to prove them.",
          "Ask any candidate plant for an EN 13706 classification report — not just a generic data sheet. The gap between a plant that can produce a third-party EN 13706 E23 report and one that quotes nominal catalogue numbers is the single clearest screen for structural capability.",
        ],
      },
      {
        heading: "Resin system: match it to the exposure, not the price",
        body: [
          "Isophthalic polyester is the economical default for general structural and outdoor use. Vinyl ester is the upgrade for chemical, wastewater and saline / offshore exposure, where it resists acids, alkalis and chlorides far better. Phenolic is the choice where fire performance governs — rail, tunnel, offshore and public-access structures — because it gives low flame spread, low smoke and low toxicity, and is often required to EN 45545 or an equivalent.",
          "All three are typically E-glass reinforced and finished with a synthetic surface veil plus a UV-stabilised resin-rich surface. For long outdoor service, confirm the profile carries a surface veil and UV package — a bare-glass surface fibre-blooms within a year or two of UV exposure.",
        ],
      },
      {
        heading: "What to verify before the PO",
        body: [
          "Dimensional tolerance and straightness: structural pultrusion holds tight wall and flange tolerances and low bow / twist over length. Ask for the plant's tolerance table and a straightness spec and write them into the PO; commodity lines run loose, which shows up as poor fit-up on site.",
          "Glass content and cure: request glass content (loss-on-ignition) and Barcol hardness on the production batch as a cure check, plus the EN 13706 (or ASTM-tested) mechanical report. For visible or wet structures, also specify the surface veil and colour, since pultruded colour is integral and can't be touched up like paint.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between EN 13706 E17 and E23 pultruded profiles?",
        answer:
          "Both are minimum structural grades in EN 13706, distinguished by full-section axial tensile modulus: E17 guarantees ≥17 GPa and E23 ≥23 GPa, alongside minimum tensile, flexural, shear and pin-bearing strengths. E23 is the usual specification for load-bearing frames and beams; E17 suits lighter secondary members. Always request the plant's third-party EN 13706 classification report rather than catalogue nominal values.",
      },
      {
        question: "Which resin system should I choose for pultruded FRP profiles?",
        answer:
          "Match it to exposure: isophthalic polyester for general structural and outdoor use, vinyl ester for chemical, wastewater and saline / offshore environments, and phenolic where fire performance governs (rail, tunnel, offshore, public access) because it delivers low flame spread, smoke and toxicity. For outdoor service confirm a synthetic surface veil and UV-stabilised resin surface.",
      },
      {
        question: "Are Chinese pultruded FRP profiles suitable for structural use?",
        answer:
          "Yes, when sourced from a structural-grade pultruder — China has the deepest pultrusion capacity globally and several plants produce EN 13706 E23 profiles with third-party classification reports. The risk is buying commodity-grade product on price: screen for an EN 13706 (or ASTM-tested) mechanical report, a published tolerance and straightness spec, glass content and Barcol hardness on the batch, and a UV surface package for outdoor use.",
      },
    ],
    related: [
      { label: "FRP grating supplier shortlist", href: "/sourcing/frp-grating" },
      { label: "GB ⇄ ASTM ⇄ EN test method crosswalk", href: "/sourcing/gb-vs-astm-frp" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
    supplierFilter: { category: "manufacturer" },
  },

  {
    slug: "frp-cable-tray",
    pillar: "product",
    title: "Source FRP cable tray & ladder from China — NEMA FG-1 corrosion-proof",
    intro:
      "Verified Chinese manufacturers of FRP cable tray, ladder and trunking — the non-corroding, non-conductive cable support for chemical, coastal, offshore and tunnel installations, tested to NEMA FG-1 and IEC 61537.",
    deck:
      "FRP cable tray is the corrosion-proof alternative to hot-dip galvanised and stainless steel cable support, and a natural companion SKU to FRP grating and profiles. In chemical plants, coastal and offshore facilities, water treatment, tunnels and electrified rail, steel tray corrodes and stainless gets expensive fast — pultruded GFRP ladder and tray solve both while staying non-conductive and non-magnetic. This page maps the Chinese cable-tray supply base by type, explains the NEMA FG-1 and IEC 61537 load classes a specifier will quote, and lists the fire and span ratings that decide whether a tray passes.",
    metaTitle: "FRP cable tray from China — NEMA FG-1 ladder & trough suppliers",
    metaDescription:
      "Source corrosion-proof FRP cable tray, ladder and trunking from verified Chinese pultruders: NEMA FG-1 and IEC 61537 load classes, fire ratings, support-span data, and the resin systems for chemical, coastal and offshore use.",
    stats: [
      { label: "Reference standard (US)", value: "NEMA FG-1" },
      { label: "Reference standard (IEC)", value: "IEC 61537" },
      { label: "Typical resin for corrosion", value: "Vinyl ester" },
      { label: "Non-conductive / non-magnetic", value: "Yes" },
    ],
    takeaways: [
      "Tray types — ladder, solid-bottom trough, channel and trunking — and where each fits",
      "NEMA FG-1 vs IEC 61537: how cable-tray load classes and support spans are rated",
      "Resin and fire selection for chemical, coastal, offshore and tunnel installations",
      "Why FRP tray wins over galvanised and stainless on corrosion total cost",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Reviewed against NEMA FG-1 and IEC 61537 cable-tray classifications; load and span figures cross-checked with verified plant data",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "Tray types and where each is used",
        body: [
          "FRP cable management comes in four common forms: ladder tray (rungs on two side rails — the workhorse for power and heavy cabling, with good airflow), solid-bottom trough (continuous base, for small cables and fibre and where falling debris must be kept off the runs), channel / cable runway (single-piece small runs), and trunking / cable duct (enclosed, for protection and segregation). Side-rail height sets the load class; rung pitch (typically 150–300 mm) sets cable bearing.",
          "Because pultruded GFRP doesn't corrode and is non-conductive and non-magnetic, FRP tray dominates the same environments as FRP grating and profiles: chemical and electroplating plants, water and wastewater, coastal and offshore platforms, tunnels and electrified rail, and any installation where galvanised steel would rust out or stainless would blow the budget.",
        ],
      },
      {
        heading: "NEMA FG-1 and IEC 61537 — how tray is rated",
        body: [
          "NEMA FG-1 is the US standard for fiberglass cable tray; it defines load / span classes by the working load a tray supports at a given support spacing with a safety factor, plus the test methods to prove it. IEC 61537 is the international equivalent used in EU and Asia-Pacific specifications, rating safe working load against support span (e.g. 2 m or 3 m). A specifier quotes a class plus a support span, and the plant must show a load table that meets it.",
          "Ask for the manufacturer's load-deflection table tied to the standard and your support spacing — not a single headline number. FRP creeps under sustained load, so the rated working load already includes a long-term factor; confirm the table states the standard and the safety factor used.",
        ],
      },
      {
        heading: "Resin and fire — match to the environment",
        body: [
          "Vinyl ester is the default resin for FRP tray because most installations are chosen specifically for corrosion (chemical, wastewater, coastal, offshore). Where fire performance governs — tunnels, rail, offshore, enclosed public spaces — specify a fire-retardant or phenolic system with a documented flame-spread rating (ASTM E84 Class 1 in North America, or EN 45545 / IEC fire classifications in EU and rail).",
          "Confirm a UV-stabilised, surface-veiled finish for outdoor runs, and check the fittings (bends, tees, reducers, splice plates and supports) are from the same system — a corrosion-proof tray on steel supports defeats the purpose.",
        ],
      },
      {
        heading: "The corrosion total-cost case",
        body: [
          "Galvanised steel tray is cheapest at purchase and most expensive over life in a corrosive plant: it's replaced on a corrosion cycle and carries shutdown and labour cost each time. Stainless avoids corrosion but at a steep material premium and still conducts. FRP tray sits between them on first cost and wins on life: no corrosion replacement, no painting, lighter handling and install, and inherent electrical isolation.",
          "For the import-cost comparison, FRP tray is glass fibre plus resin, so check trade-remedy exposure on the glass content the same way you would for grating or profiles — see the import-tariffs guide.",
        ],
      },
    ],
    faqs: [
      {
        question: "What standards apply to FRP cable tray?",
        answer:
          "In the US, NEMA FG-1 is the reference standard for fiberglass cable tray, defining load / span classes and test methods. Internationally, IEC 61537 rates safe working load against support span and includes fire classifications. A specifier quotes a load class and a support spacing (e.g. 2 m or 3 m); the manufacturer must provide a load-deflection table tied to that standard and span, including the long-term safety factor.",
      },
      {
        question: "When should I use FRP cable tray instead of steel?",
        answer:
          "Whenever corrosion or electrical isolation matters: chemical and electroplating plants, water and wastewater, coastal and offshore platforms, tunnels and electrified rail. Pultruded GFRP tray doesn't corrode, needs no galvanising or painting, is non-conductive and non-magnetic, and is about a quarter the weight of steel. Galvanised steel is cheaper to buy but is replaced on a corrosion cycle; stainless avoids corrosion but at a large premium.",
      },
      {
        question: "Which resin should FRP cable tray use?",
        answer:
          "Vinyl ester is the usual default because most FRP-tray installations are chosen for corrosion resistance (chemical, wastewater, coastal, offshore). Where fire governs — tunnels, rail, offshore, enclosed public areas — specify a fire-retardant or phenolic system with a documented flame-spread rating (ASTM E84 Class 1 in North America, or EN 45545 for rail in Europe), and confirm a UV-stabilised surface veil for outdoor runs.",
      },
    ],
    related: [
      { label: "Pultruded FRP profiles from China", href: "/sourcing/pultruded-profiles" },
      { label: "FRP grating supplier shortlist", href: "/sourcing/frp-grating" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
    supplierFilter: { category: "manufacturer" },
  },

  {
    slug: "frp-baba-buy-america",
    pillar: "compliance",
    title: "FRP on US federal projects — Build America, Buy America (BABA) explained",
    intro:
      "An honest guide to whether Chinese-made FRP can be used on US federally funded infrastructure — what Build America, Buy America requires, where imported FRP is excluded, and when a waiver or domestic route applies.",
    deck:
      "If your FRP is going into a US project that touches federal infrastructure funding, Build America, Buy America (BABA) usually decides whether Chinese-origin material is even eligible — long before price or lead time matter. BABA, part of the 2021 Infrastructure Investment and Jobs Act, imposes domestic-content requirements on iron, steel, manufactured products and construction materials in federally funded infrastructure. This page explains, without spin, how FRP is classified under BABA, where imported product is excluded, the waiver routes that exist, and how to tell early whether your scope is federal or private.",
    metaTitle: "FRP & Build America Buy America (BABA) — federal eligibility",
    metaDescription:
      "Can Chinese-made FRP be used on US federally funded projects? An honest guide to Build America, Buy America (BABA): how FRP is classified, where imported product is excluded, waiver routes, and how to tell federal from private scope.",
    stats: [
      { label: "Statute", value: "BABA (IIJA, 2021)" },
      { label: "Manufactured-product domestic content", value: "≥55%*" },
      { label: "Applies to", value: "Federal infra funding" },
      { label: "Imported FRP on federal scope", value: "Usually excluded" },
    ],
    takeaways: [
      "What Build America, Buy America (BABA) is and which projects it touches",
      "How FRP is classified under BABA — manufactured product vs construction material — and why it matters",
      "Where imported (including Chinese) FRP is excluded, and the waiver routes that exist",
      "How to tell early whether your scope is federally funded or private / commercial",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Reviewed against the Build America, Buy America Act (IIJA 2021) and OMB BABA guidance; classification points flagged for project-counsel confirmation",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "What BABA is and when it applies",
        body: [
          "Build America, Buy America (BABA) is the domestic-content regime created by the 2021 Infrastructure Investment and Jobs Act. It requires that iron, steel, manufactured products and construction materials used in infrastructure projects receiving US federal financial assistance be produced in the United States. It covers the project's permanent materials, not contractor tools or equipment.",
          "The trigger is federal funding into infrastructure — highways, bridges, water, rail, broadband, ports, utilities and similar. Purely private or commercial work with no federal assistance is outside BABA. The first question on any US enquiry is therefore not price — it's whether the scope touches federal money.",
        ],
      },
      {
        heading: "How FRP is classified — and why it decides eligibility",
        body: [
          "BABA treats categories differently. For a manufactured product, the standard is that it is manufactured in the US and the cost of its US-made components exceeds a domestic-content threshold (currently 55%, subject to scheduled increases). For a construction material — and certain polymer-based building materials fall here — all manufacturing processes must occur in the US. FRP can be argued into either bucket depending on the item and how it's incorporated, and the determination materially changes whether an imported product can qualify.",
          "Because the classification is fact-specific and is the funding agency's call, treat any blanket claim that imported FRP is BABA-compliant with suspicion. In practice, Chinese-origin FRP rarely satisfies BABA on federal scope; the honest answer is usually that it does not qualify without a waiver.",
        ],
      },
      {
        heading: "Waivers and the domestic route",
        body: [
          "BABA allows agency waivers in three situations: non-availability (the product isn't produced in the US in sufficient quantity or quality), unreasonable cost (domestic product raises overall project cost unreasonably), or public interest. Waivers are project-specific, slow and posted for public comment — not a reliable plan for a standard procurement, but real where a US-made FRP equivalent genuinely doesn't exist.",
          "Where federal scope is firm and no waiver applies, the route is domestic or domestically finished FRP, not Chinese import. getfrp's role on those enquiries is to say so early and redirect to private / commercial scope where imported FRP is a clean fit — surfacing the constraint up front beats discovering it at inspection.",
        ],
      },
      {
        heading: "Tell federal from private early",
        body: [
          "Ask the buyer two questions before quoting: is the project receiving any US federal financial assistance, and is the FRP a permanent part of the infrastructure? If both are yes, assume BABA applies and that imported FRP is excluded unless a waiver is in hand. If either is no, BABA generally doesn't bite and imported FRP is eligible on its merits.",
          "This is distinct from tariffs and trade remedy, which apply to imports regardless of funding source — see the import-tariffs guide. BABA is an eligibility gate; tariffs are a cost. A project can clear BABA (private scope) and still carry AD/CVD or Section 301 exposure on the glass content.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can Chinese-made FRP be used on US federally funded projects?",
        answer:
          "Usually not without a waiver. Build America, Buy America (BABA) requires iron, steel, manufactured products and construction materials in federally funded infrastructure to be produced in the United States, and Chinese-origin FRP generally does not satisfy BABA on federal scope. It remains fully eligible on private or commercial projects with no federal funding.",
      },
      {
        question: "What is the BABA domestic-content threshold for FRP?",
        answer:
          "It depends on classification. If the FRP item is treated as a manufactured product, it must be made in the US with US-made components exceeding the domestic-content threshold (currently 55%, scheduled to rise). If treated as a construction material, all manufacturing processes must occur in the US. The classification is fact-specific and the funding agency's determination, so confirm it with project counsel rather than relying on a supplier claim.",
      },
      {
        question: "How do I know if Build America, Buy America applies to my project?",
        answer:
          "Ask whether the project receives any US federal financial assistance and whether the FRP is a permanent part of the infrastructure. If both are yes, assume BABA applies and that imported FRP is excluded unless an agency waiver (non-availability, unreasonable cost, or public interest) is in place. Private and commercial projects with no federal funding are outside BABA, and imported FRP is eligible there on its merits.",
      },
    ],
    related: [
      { label: "Buy America (BABA) checker — can you use imported FRP?", href: "/tools/buy-america-frp-checker" },
      { label: "China FRP import tariffs, AD/CVD & Section 301", href: "/sourcing/china-frp-import-tariffs" },
      { label: "CBAM & FRP — what actually applies", href: "/sourcing/cbam-frp-china" },
      { label: "Source FRP from China — directory & playbook", href: "/source-from-china" },
    ],
  },

  {
    slug: "frp-tanks-vessels",
    pillar: "product",
    title: "Source FRP / GRP tanks & vessels from China — ASME RTP-1, EN 13121",
    intro:
      "Verified Chinese fabricators of FRP/GRP corrosion-resistant tanks, vessels, scrubbers and ducting — filament-wound and contact-moulded, built to ASME RTP-1, ASTM D3299/D4097, BS 4994 or EN 13121.",
    deck:
      "Corrosion-resistant FRP tanks and vessels are where composites earn their keep: storing acids, caustics, chlorine, brine and wastewater that eat carbon steel and stress stainless. China has deep filament-winding and hand-lay capacity, but a tank is only as good as its corrosion barrier and the design code it's built to. This page maps the Chinese tank/vessel supply base by process, explains the ASME RTP-1 / EN 13121 / BS 4994 design codes a serious buyer specifies, and flags the corrosion-barrier, resin and inspection points that separate a 20-year tank from a 2-year failure.",
    metaTitle: "FRP / GRP tanks & vessels from China — ASME RTP-1, EN 13121",
    metaDescription:
      "Source corrosion-resistant FRP/GRP tanks, vessels, scrubbers and duct from verified Chinese fabricators: filament-wound vs contact-moulded, ASME RTP-1 / ASTM D3299 / BS 4994 / EN 13121 design codes, corrosion-barrier and resin selection, and the inspection points that matter.",
    stats: [
      { label: "US design code", value: "ASME RTP-1" },
      { label: "EU / UK design code", value: "EN 13121 / BS 4994" },
      { label: "Corrosion-barrier resin", value: "Vinyl ester" },
      { label: "Build methods", value: "Wound · contact-moulded" },
    ],
    takeaways: [
      "Filament-wound vs contact-moulded (hand-lay) — strength, cost and which suits your vessel",
      "The design codes that matter: ASME RTP-1 (US), EN 13121 / BS 4994 (EU/UK), ASTM D3299 / D4097",
      "Corrosion barrier: resin-rich liner + surfacing veil — the single biggest determinant of tank life",
      "Resin selection (iso polyester / vinyl ester / dual-laminate) by chemical service",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Reviewed against ASME RTP-1, EN 13121, BS 4994 and ASTM D3299 / D4097; corrosion-barrier guidance cross-checked with resin-supplier chemical-resistance tables",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "Filament-wound vs contact-moulded — choosing the build method",
        body: [
          "Two processes dominate FRP tank fabrication. Filament winding wraps resin-wetted glass roving onto a rotating mandrel at controlled angles, giving high, predictable hoop strength — ideal for cylindrical pressure and large vertical storage tanks. Contact moulding (hand lay-up / spray-up) builds the laminate by hand against a mould, which suits complex shapes, fittings, ducts, hoods and one-offs where winding can't reach. Many vessels combine both: a wound shell with hand-laid heads, nozzles and saddles.",
          "Process drives economics and inspection: wound tanks are more repeatable and material-efficient at volume; contact-moulded work depends more on the laminator's skill, so for hand-laid scope the QA on laminate thickness, glass content and cure matters even more.",
        ],
      },
      {
        heading: "Design codes — specify one, and get the calculation",
        body: [
          "A corrosion tank should be built to a recognised design code, not a catalogue. ASME RTP-1 (Reinforced Thermoset Plastic Corrosion-Resistant Equipment) is the US standard for atmospheric vessels and the one most US buyers name; EN 13121 (GRP tanks and vessels for use above ground) and BS 4994 are the European / UK equivalents. ASTM D3299 (filament-wound) and ASTM D4097 (contact-moulded) cover the laminate construction itself.",
          "Ask the fabricator for the design calculation to the named code (shell thickness, heads, nozzles, wind / seismic, hold-down) plus the laminate sequence — a plant that can produce a stamped RTP-1 design package is in a different tier from one quoting wall thickness off a chart.",
        ],
      },
      {
        heading: "The corrosion barrier is the whole game",
        body: [
          "Tank life is decided by the corrosion barrier on the wetted face: a resin-rich inner liner (typically 2.5–3 mm) reinforced with a chemically resistant surfacing veil (C-glass or synthetic) and chopped-strand mat plies, all in the corrosion-grade resin. Behind it sits the structural laminate. Get the barrier wrong — thin, under-cured, wrong veil — and the chemical reaches the structural glass and the tank fails early regardless of wall thickness.",
          "Specify the barrier resin to the service: vinyl ester (bisphenol-A or novolac epoxy vinyl ester) for most acids, caustics and oxidisers; dual-laminate (a thermoplastic liner such as PVC / PP / PVDF bonded to the FRP) for the most aggressive duties. Always give the chemical, concentration and temperature so the fabricator can pick the resin against a chemical-resistance table — don't accept a generic 'GRP' quote.",
        ],
      },
      {
        heading: "What to verify before the PO",
        body: [
          "Require: the design package to the named code, the laminate / barrier specification, resin and veil brand + corrosion-grade confirmation, Barcol hardness (and where specified an acetone-sensitivity test) as cure checks, and a hydrotest on completion. For larger vessels, a third-party design review or witnessed inspection (SGS / BV / TÜV) is worth the cost.",
          "Logistics: large tanks are volume, not weight — confirm shippable diameter (out-of-gauge / open-top container limits) early, or plan field assembly of wound segments. FRP is light, so the constraint is dimensions, not tonnage.",
        ],
      },
    ],
    faqs: [
      {
        question: "What design code should a Chinese FRP tank be built to?",
        answer:
          "Name one and require the calculation. ASME RTP-1 is the US standard for reinforced thermoset plastic corrosion-resistant equipment; EN 13121 and BS 4994 are the European / UK equivalents for above-ground GRP tanks; ASTM D3299 (filament-wound) and D4097 (contact-moulded) govern the laminate. A capable Chinese fabricator can produce a design package to the named code — treat a wall-thickness-off-a-chart quote as a red flag.",
      },
      {
        question: "What resin should an FRP tank use for chemical storage?",
        answer:
          "Match the corrosion-barrier resin to the chemical, concentration and temperature. Vinyl ester (bisphenol-A or novolac epoxy vinyl ester) handles most acids, caustics and oxidisers; isophthalic polyester suits milder service; dual-laminate (a PVC / PP / PVDF thermoplastic liner bonded to FRP) is used for the most aggressive duties. Always give the fabricator the full chemical spec so they can select against a chemical-resistance table.",
      },
      {
        question: "Filament-wound or contact-moulded FRP tank — which is better?",
        answer:
          "Neither universally — they suit different jobs. Filament winding gives high, repeatable hoop strength for cylindrical storage and pressure vessels and is material-efficient at volume. Contact moulding (hand lay-up) suits complex shapes, ducts, hoods, nozzles and one-offs. Many vessels use both. For hand-laid scope, scrutinise QA on laminate thickness, glass content and cure, since it's more operator-dependent.",
      },
    ],
    related: [
      { label: "FRP piping from China — GRE / GRP pressure pipe", href: "/sourcing/frp-piping" },
      { label: "GB ⇄ ASTM ⇄ EN test method crosswalk", href: "/sourcing/gb-vs-astm-frp" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
    supplierFilter: { category: "manufacturer" },
  },

  {
    slug: "frp-piping",
    pillar: "product",
    title: "Source FRP / GRP / GRE pipe from China — AWWA C950, ISO 14692",
    intro:
      "Verified Chinese manufacturers of FRP/GRP/GRE pipe and fittings — filament-wound pressure pipe for water, wastewater, seawater, firewater and oilfield service, built to AWWA C950, ASTM D3517 / D2996 or ISO 14692.",
    deck:
      "FRP pipe is the corrosion-proof workhorse for water, wastewater, desalination, firewater and oilfield fluid transport — lighter than ductile iron, immune to internal and external corrosion, and good for decades of buried or topside service. China has large filament-winding pipe capacity, but pressure and stiffness ratings, jointing and the design standard are where buyers get burned. This page maps the Chinese pipe supply base, explains the AWWA C950 / ASTM / ISO 14692 ratings a specifier quotes, and covers the jointing systems that decide install cost and reliability.",
    metaTitle: "FRP / GRP / GRE pipe from China — AWWA C950, ISO 14692 suppliers",
    metaDescription:
      "Source corrosion-proof FRP/GRP/GRE pressure pipe and fittings from verified Chinese manufacturers: AWWA C950 / ASTM D3517 / D2996 / ISO 14692 ratings, pressure (PN) and stiffness (SN) classes, jointing systems, and service from potable water to oilfield.",
    stats: [
      { label: "Water pressure-pipe std", value: "AWWA C950" },
      { label: "Oil & gas GRP/GRE std", value: "ISO 14692" },
      { label: "Rated by", value: "Pressure (PN) × stiffness (SN)" },
      { label: "Process", value: "Filament-wound (RTRP)" },
    ],
    takeaways: [
      "FRP/GRP vs GRE (glass-reinforced epoxy) — resin systems and where each is used",
      "The standards a specifier names: AWWA C950, ASTM D3517 / D2996, ISO 14692, API 15HR/15LR",
      "Pressure class (PN) × stiffness class (SN) — how FRP pipe is actually rated and ordered",
      "Jointing systems (bell-and-spigot, adhesive, butt-and-wrap, flanged) and their trade-offs",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Reviewed against AWWA C950, ASTM D3517 / D2996, ISO 14692 and API 15HR / 15LR; rating and jointing guidance cross-checked with manufacturer design manuals",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "GRP vs GRE — match the resin to the service",
        body: [
          "FRP pipe splits by resin. GRP (glass-reinforced polyester or vinyl ester) covers most water, wastewater, seawater and chemical service. GRE (glass-reinforced epoxy) is the higher-temperature, higher-pressure system used in firewater and oil & gas duties. Liners (resin-rich, sometimes thermoplastic) tailor the bore to the fluid. Specify the fluid, temperature and pressure and let that drive the resin choice.",
          "All are filament-wound (reinforced thermosetting resin pipe, RTRP), giving controlled hoop and axial strength. The same corrosion-immunity and light weight apply as for tanks — a buried FRP water main needs no cathodic protection and a fraction of the install plant of ductile iron.",
        ],
      },
      {
        heading: "Standards — name the one your specifier uses",
        body: [
          "Water and wastewater: AWWA C950 (fiberglass pressure pipe) is the US reference; ASTM D3517 (FRP pressure pipe), ASTM D3754 (FRP sewer and industrial pressure pipe) and the D2996 filament-wound RTRP specification sit alongside it. Oil & gas: ISO 14692 (GRP piping) is the global standard, with API 15HR (high-pressure) and 15LR (low-pressure) for line pipe. Ask which the project specifies and require the type-test / qualification evidence to it.",
          "Buried pipe is also governed by long-term performance: the hydrostatic design basis (HDB) and long-term stiffness, not just a short-term burst number. A serious manufacturer shows regression-tested long-term ratings, not only as-made values.",
        ],
      },
      {
        heading: "Pressure × stiffness — how pipe is ordered",
        body: [
          "FRP pipe is specified on two axes. Pressure class (PN, e.g. PN 6 / 10 / 16 / 25 bar) sets the wall against internal pressure. Stiffness class (SN, e.g. SN 2500 / 5000 / 10000 N/m²) sets the ring stiffness against external / burial loads and vacuum. A buried gravity sewer is stiffness-driven; a pumped main is pressure-driven; many specs require both. Order against the PN × SN the design calls for — under-spec stiffness is the classic buried-FRP failure.",
        ],
      },
      {
        heading: "Jointing and what to verify",
        body: [
          "Jointing decides install speed and leak risk. Bell-and-spigot with elastomeric seals (often with a locking key) is the fast, common choice for buried water / sewer; adhesive-bonded and butt-and-wrap (laminated) joints give a monolithic, high-integrity line for chemical and high-pressure service; flanged connections tie into pumps, valves and equipment. Match the joint to pressure, access and whether the line must be restrained against thrust.",
          "Before the PO require: the qualification / type-test to the named standard, PN and SN confirmation with a long-term (regression) basis, the jointing system and any required field-joint training, and a hydrotest regime. For oilfield / ISO 14692 work, confirm the manufacturer's qualification envelope covers your temperature and pressure.",
        ],
      },
    ],
    faqs: [
      {
        question: "What standards apply to Chinese FRP / GRP pressure pipe?",
        answer:
          "For water and wastewater, AWWA C950 is the US reference, with ASTM D3517 / D3754 and the D2996 filament-wound RTRP specification. For oil & gas, ISO 14692 is the global GRP-piping standard, supported by API 15HR (high-pressure) and 15LR (low-pressure). Name the standard your project uses and require the manufacturer's qualification / type-test evidence and long-term (regression-based) ratings to it.",
      },
      {
        question: "What is the difference between GRP and GRE pipe?",
        answer:
          "GRP (glass-reinforced polyester or vinyl ester) covers most water, wastewater, seawater and chemical service. GRE (glass-reinforced epoxy) is the higher-temperature, higher-pressure system used for firewater and oil & gas duties. Both are filament-wound; the resin (and any liner) is chosen for the fluid, temperature and pressure — specify all three so the manufacturer can match the system.",
      },
      {
        question: "How is FRP pipe rated and ordered?",
        answer:
          "On two axes: pressure class (PN, e.g. PN 10 / 16 / 25 bar) for internal pressure, and stiffness class (SN, e.g. SN 5000 / 10000 N/m²) for external and burial loads. Gravity sewers are stiffness-driven, pumped mains pressure-driven, and many specs require both. Order against the PN × SN the design calls for, with long-term (regression) ratings — under-specifying ring stiffness is the classic buried-FRP failure mode.",
      },
    ],
    related: [
      { label: "FRP / GRP tanks & vessels from China", href: "/sourcing/frp-tanks-vessels" },
      { label: "GB ⇄ ASTM ⇄ EN test method crosswalk", href: "/sourcing/gb-vs-astm-frp" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
    supplierFilter: { category: "manufacturer" },
  },

  {
    slug: "frp-conformity-china",
    pillar: "standards",
    title: "Will Chinese FRP pass my standard? — conformity, testing & acceptance",
    intro:
      "How to make sure Chinese FRP actually conforms to the ASTM, EN or ISO standard your specifier or authority requires — what to test, at which lab, and which certificates clear acceptance.",
    deck:
      "The question that decides most cross-border FRP deals isn't price — it's 'will it pass my standard?' Chinese plants test to GB by default, your specifier wants ASTM / EN / ISO, and a generic data sheet won't survive a submittal review or an authority-having-jurisdiction (AHJ) acceptance. This page is the conformity playbook: how GB maps to ASTM / EN, what to require (test to YOUR standard, at a named accredited lab, with first-article-to-production correlation), and which certificates actually unlock acceptance in each market.",
    metaTitle: "Will Chinese FRP pass my standard? Conformity & acceptance guide",
    metaDescription:
      "A conformity playbook for buyers of Chinese FRP: how GB maps to ASTM / EN / ISO, what to require (third-party testing to your standard at a named accredited lab, first-article-to-production correlation), and the certificates — CE, ICC-ES, classification reports — that clear acceptance.",
    stats: [
      { label: "China's default test base", value: "GB / GB/T" },
      { label: "Accreditation to require", value: "CNAS / ILAC" },
      { label: "Independent labs", value: "SGS · BV · Intertek · TÜV" },
      { label: "Rule of thumb", value: "Test to YOUR standard" },
    ],
    takeaways: [
      "Why a GB data sheet isn't conformity to ASTM / EN — and how the standards map (and don't)",
      "What to require: third-party testing to your standard at a CNAS / ILAC-accredited lab",
      "First-article vs production: proving the sample and the shipment are the same thing",
      "The acceptance certificates that matter per market (CE / EN 13706, ICC-ES, classification reports)",
    ],
    byline: "F1 Composite editorial desk",
    reviewedBy:
      "Reviewed against ASTM, EN and ISO FRP test methods and CNAS / ILAC accreditation practice; acceptance routes cross-checked per market",
    reviewedDate: "2026-06",
    sections: [
      {
        heading: "A GB data sheet is not conformity to your standard",
        body: [
          "Chinese plants design and test to GB / GB-T by default. GB methods are often close to — but not identical with — ASTM, EN or ISO: specimen geometry, conditioning, grip and reporting can differ enough that a GB number won't be accepted as an ASTM number in a submittal. The crosswalk tells you which GB method corresponds to which ASTM / EN method, but correspondence is not equivalence. For anything load-bearing or safety-related, the safe move is to have the property tested to your standard, not to accept a GB result relabelled.",
          "See the full GB ⇄ ASTM ⇄ EN test-method crosswalk for the method-by-method mapping; use it to write the test matrix into your PO.",
        ],
      },
      {
        heading: "Require testing to your standard, at a named accredited lab",
        body: [
          "The single most effective conformity clause: properties to be tested to the named ASTM / EN / ISO method at a CNAS- or ILAC-accredited laboratory, report issued before shipment. CNAS accreditation (China's signatory to the ILAC mutual-recognition arrangement) means the report is recognised internationally. The big independents — SGS, Bureau Veritas, Intertek, TÜV — run accredited labs in China and issue reports that travel.",
          "Name the lab or the accreditation in the PO, name the exact methods and the acceptance values, and require the report before the balance payment. 'We test in-house' is not the same as an accredited third-party report.",
        ],
      },
      {
        heading: "First-article to production — prove they're the same",
        body: [
          "A passing sample proves the sample passed — not that the shipment will. Close the gap: require a first-article inspection (FAI) on the qualified construction, then per-batch production evidence (glass content / loss-on-ignition, Barcol hardness, key dimensions) that correlates running production to the qualified first article. For composites, time-dependent properties (creep, UV, fatigue) can't be proven by one coupon, so for long-life structures specify the relevant durability or weathering test up front.",
          "This is also where a witnessed inspection or resident QA pays off: it ties the certificate to the product actually in the container.",
        ],
      },
      {
        heading: "Acceptance certificates by market",
        body: [
          "What clears a submittal differs by market and product. EU pultruded structural profiles: a CE mark where applicable plus an EN 13706 classification report. North American building products: an ICC-ES Evaluation Report (ESR) is often what an AHJ accepts, alongside ASTM-tested data. Marine / offshore: class-society approval (Lloyd's, DNV, ABS, CCS). Potable-water contact: NSF/ANSI 61 certification. Identify the certificate your specifier or AHJ screens by before you source, because retrofitting it after the order is slow and sometimes impossible.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does a GB test report prove a Chinese FRP product meets ASTM or EN?",
        answer:
          "Not on its own. GB methods often correspond to ASTM / EN / ISO methods but are rarely identical — specimen geometry, conditioning and reporting can differ enough that a GB result isn't accepted as an ASTM result in a submittal. Use the GB ⇄ ASTM ⇄ EN crosswalk to map methods, but for load-bearing or safety-critical use require the property to be tested to your standard rather than accepting a relabelled GB number.",
      },
      {
        question: "How do I make sure Chinese FRP conforms to my standard?",
        answer:
          "Write it into the PO: properties tested to the named ASTM / EN / ISO method at a CNAS- or ILAC-accredited laboratory (SGS, Bureau Veritas, Intertek and TÜV all run accredited China labs), with the report issued before the balance payment. Then require a first-article inspection plus per-batch production checks (glass content, Barcol hardness, key dimensions) so the shipment correlates to the qualified sample.",
      },
      {
        question: "What certificate do I need for Chinese FRP to be accepted in my market?",
        answer:
          "It depends on the product and market. EU structural pultrusion: CE where applicable plus an EN 13706 classification report. North American building products: often an ICC-ES Evaluation Report (ESR) plus ASTM-tested data. Marine / offshore: class-society approval (Lloyd's, DNV, ABS, CCS). Potable water: NSF/ANSI 61. Identify the certificate your specifier or AHJ screens by before sourcing.",
      },
    ],
    related: [
      { label: "GB ⇄ ASTM ⇄ EN test method crosswalk", href: "/sourcing/gb-vs-astm-frp" },
      { label: "Pultruded FRP profiles from China (EN 13706)", href: "/sourcing/pultruded-profiles" },
      { label: "Verified Chinese FRP suppliers", href: "/suppliers" },
    ],
  },
];

export const sourcingTopicSlugs = sourcingTopics.map((t) => t.slug);

export function findSourcingTopic(slug: string): SourcingTopic | undefined {
  return sourcingTopics.find((t) => t.slug === slug);
}
