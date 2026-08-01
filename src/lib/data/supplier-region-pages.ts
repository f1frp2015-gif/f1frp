import type { SupplierCategorySlug } from "./supplier-category-pages";

export type SupplierRegionSlug =
  | "jiangsu"
  | "shandong"
  | "zhejiang"
  | "guangdong"
  | "hebei";

export type SupplierRegionPage = {
  slug: SupplierRegionSlug;
  name: string;
  provinceToken: string;
  summary: string;
  overview: string[];
  categoryFocus: Array<{
    slug: SupplierCategorySlug;
    label: string;
    note: string;
  }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const SUPPLIER_REGION_PAGES: SupplierRegionPage[] = [
  {
    slug: "jiangsu",
    name: "Jiangsu",
    provinceToken: "江苏",
    summary:
      "Compare verified FRP and composite manufacturers in Jiangsu, China by resin, pultrusion, grating, sheet and export documentation capability.",
    overview: [
      "Jiangsu is one of the deepest composite manufacturing clusters in eastern China. The province combines resin and gelcoat production, pultruded profiles, molded grating, industrial panels, tanks and downstream fabrication within a dense logistics network around Nantong, Changzhou, Wuxi, Suzhou and Yancheng. That mix makes Jiangsu useful when a buyer needs more than a single finished part: resin compatibility, reinforcement supply, profile production and secondary machining can be evaluated as one regional sourcing route.",
      "A regional label is not a substitute for capability evidence. Factories in the same province can differ in die ownership, glass architecture, resin formulation, certificate scope, export experience and quality systems. A Jiangsu RFQ should therefore state the actual process, section or panel drawing, service chemistry, annual volume, required test methods, packaging and destination. getfrp uses the province as an initial cluster filter, then checks the offered product and evidence before introducing a commercial route.",
      "For overseas buyers, Jiangsu can also shorten sampling and consolidation cycles because multiple material and fabrication suppliers operate within practical trucking distance of major ports. The final shortlist still needs a plant-specific document review, sample approval, pre-shipment inspection plan and clear responsibility for transport damage. Use the category links below to move from a regional search to the exact FRP specification you need.",
    ],
    categoryFocus: [
      { slug: "pultruded-profiles", label: "Pultruded profiles", note: "Standard and custom constant-section profiles with die and tolerance review." },
      { slug: "frp-grating", label: "FRP grating", note: "Molded and pultruded panels for industrial walkways and platforms." },
      { slug: "resin-gelcoat", label: "Resin & gelcoat", note: "Polyester, vinyl ester and application-specific coating systems." },
      { slug: "fiberglass-sheet", label: "Fiberglass sheet", note: "Industrial laminate, panel and corrosion-resistant sheet capability." },
    ],
    faqs: [
      { question: "What FRP products are commonly made in Jiangsu?", answer: "Jiangsu has broad capability in resin, gelcoat, pultruded profiles, molded grating, industrial sheet and fabricated corrosion-resistant components. The exact factory fit still depends on process, resin, geometry and evidence." },
      { question: "Is Jiangsu suitable for export orders?", answer: "Many Jiangsu manufacturers serve export or coastal industrial supply chains, but export readiness must be verified per factory: English documents, packing, Incoterms, inspection access and a legal entity whose certificates cover the quoted product." },
      { question: "How should I compare Jiangsu suppliers with factories in other provinces?", answer: "Use one controlled RFQ and compare capability, test evidence, tolerance, lead time, landed logistics and quality controls. Province is a useful cluster signal, not a quality grade." },
    ],
  },
  {
    slug: "shandong",
    name: "Shandong",
    provinceToken: "山东",
    summary:
      "Browse verified Shandong FRP manufacturers and reinforcement suppliers for pipe, profiles, rebar, fiber and industrial composite applications.",
    overview: [
      "Shandong is a major northern China composite cluster with strong glass-fibre, carbon-fibre, industrial FRP, filament-wound pipe and anti-corrosion equipment capability. The province spans coastal ports and inland manufacturing centres, so the best route depends on whether the buyer prioritises reinforcement supply, large wound structures, pultruded profiles or a project-specific fabricated system.",
      "The most important regional comparison is process discipline. Wound pipe suppliers should demonstrate liner control, winding angle, hydrostatic or stiffness evidence and joint quality. Pultrusion suppliers should show laminate architecture, die stability, straightness and the property basis behind EN, ASTM or project specifications. Fibre suppliers need sizing, package, tex or tow and moisture controls tied to the buyer’s downstream process.",
      "Shandong is often competitive for volume and industrial projects, but a low ex-works price is meaningful only after packaging, inland haulage, port handling, test evidence and inspection access are normalised. Use the category pages below to turn a Shandong cluster search into a specification-led shortlist and request matched samples before a production commitment.",
    ],
    categoryFocus: [
      { slug: "frp-pipe", label: "FRP pipe", note: "Filament-wound and industrial piping systems with liner and pressure review." },
      { slug: "fiber-glass", label: "Fiber & glass", note: "Glass, carbon and reinforcement supply with sizing and package controls." },
      { slug: "frp-rebar", label: "FRP rebar", note: "GFRP/BFRP bar capability with tensile and bond evidence." },
      { slug: "pultruded-profiles", label: "Pultruded profiles", note: "Structural and industrial sections for corrosion-resistant assemblies." },
    ],
    faqs: [
      { question: "Which composite capabilities are strongest in Shandong?", answer: "Shandong is a useful cluster for industrial FRP, wound pipe, reinforcement, profiles and project fabrication. The strongest match depends on the actual geometry, service environment, test method and volume." },
      { question: "Does a Shandong factory automatically have export experience?", answer: "No. Confirm export documents, English technical files, packing history, port routing, inspection access and the legal entity named on certificates before treating the supplier as export-ready." },
      { question: "Can Shandong suppliers consolidate materials from other provinces?", answer: "Some can coordinate regional purchasing, but responsibility and traceability must be written into the RFQ and contract. For critical reinforcement or resin, verify the original producer and batch documents." },
    ],
  },
  {
    slug: "zhejiang",
    name: "Zhejiang",
    provinceToken: "浙江",
    summary:
      "Find verified Zhejiang FRP and composite manufacturers for profiles, sheets, fiber conversion, gelcoat and engineered components near eastern China export routes.",
    overview: [
      "Zhejiang has a diverse private-sector manufacturing base spanning fiberglass, fabrics, pultruded profiles, molded parts, architectural panels, gelcoat and engineered composite components. The cluster is especially useful when a buyer needs flexible customization, relatively fast sample iteration or secondary finishing alongside a standard FRP material.",
      "The same flexibility means procurement needs a firm drawing and revision process. Ask the factory to identify what is made in-house, what is subcontracted and which certificate or test report belongs to the actual production site. For profiles and sheets, define dimensional and appearance tolerances; for fabrics and rovings, define sizing, areal weight, package and splice controls; for gelcoat, define colour, gloss, film thickness and weathering evidence.",
      "Zhejiang’s coastal logistics can be attractive for smaller consolidated shipments, but the correct comparison is delivered and inspected cost. getfrp links the regional view to category specifications, standards and RFQ workflows so buyers can evaluate a flexible supplier without mistaking broad catalogues for proven capability.",
    ],
    categoryFocus: [
      { slug: "fiber-glass", label: "Fiber & glass", note: "Glass fibre, fabrics, mats and conversion capability." },
      { slug: "pultruded-profiles", label: "Pultruded profiles", note: "Custom profiles, ladders, tubes and precision finishing." },
      { slug: "fiberglass-sheet", label: "Fiberglass sheet", note: "Panels, laminates and architectural or industrial surfaces." },
      { slug: "resin-gelcoat", label: "Resin & gelcoat", note: "Specialty resin and colour-matched surface systems." },
    ],
    faqs: [
      { question: "Why consider Zhejiang for custom FRP work?", answer: "The province has a broad private manufacturing ecosystem and many downstream fabrication options. Buyers should still separate catalogue capability from proven production of the requested geometry and finish." },
      { question: "What should I verify when a Zhejiang supplier subcontracts?", answer: "Ask for the production-site legal entity, process responsibility, traceability, inspection access and certificate scope. Subcontracting is not automatically a problem, but it must be visible in the quality plan." },
      { question: "Is Zhejiang good for low-MOQ samples?", answer: "Some specialist factories are flexible on sampling, especially for custom profiles and panels. Tooling, setup and validation costs should be separated from the recurring unit price." },
    ],
  },
  {
    slug: "guangdong",
    name: "Guangdong",
    provinceToken: "广东",
    summary:
      "Compare verified Guangdong FRP suppliers for electrical, automotive, architectural, marine and export-oriented composite applications.",
    overview: [
      "Guangdong is a major South China manufacturing and export ecosystem. Its composite capability is often connected to electrical equipment, appliances, automotive components, marine products, architectural panels, molded parts and custom secondary fabrication. The province can be a practical sourcing base when the buyer needs responsive engineering, multi-material assembly or consolidation through South China ports.",
      "For a Guangdong supplier, review the boundary between compound, moulding, finishing and assembly. A factory may be highly capable in one stage but rely on a partner for tooling, inserts, coating or testing. The RFQ should define critical dimensions, flame or electrical requirements, colour and surface, annual volume, validation evidence and which party owns nonconforming-product decisions.",
      "South China logistics do not remove the need for technical controls. Samples should be made with the proposed production material and tool, and the final inspection plan should cover the properties that matter in the buyer’s market. Use the category pages below to connect a Guangdong regional search to standards, material specifications and a controlled RFQ.",
    ],
    categoryFocus: [
      { slug: "smc-bmc", label: "SMC / BMC", note: "Electrical, automotive and industrial compression moulding." },
      { slug: "fiberglass-sheet", label: "Fiberglass sheet", note: "Architectural, electrical and corrosion-resistant panel systems." },
      { slug: "frp-grating", label: "FRP grating", note: "Marine, industrial and South China project supply." },
      { slug: "resin-gelcoat", label: "Resin & gelcoat", note: "Marine, sanitary and decorative surface chemistry." },
    ],
    faqs: [
      { question: "Which Guangdong industries buy composite parts?", answer: "Electrical, automotive, marine, construction, appliance and industrial equipment supply chains are common application contexts. The factory’s actual process and validation evidence matter more than the province label." },
      { question: "Can Guangdong suppliers support assembly as well as molding?", answer: "Some can provide drilling, inserts, bonding, coating or assembly, while others focus only on compound or moulding. Put the full supply boundary and inspection responsibility in the RFQ." },
      { question: "Is South China consolidation useful for overseas buyers?", answer: "It can be, especially for smaller or multi-item shipments. Compare complete delivered logistics and packaging, not only the factory gate price." },
    ],
  },
  {
    slug: "hebei",
    name: "Hebei",
    provinceToken: "河北",
    summary:
      "Browse verified Hebei FRP manufacturers for filament-wound pipe, tanks, grating, anti-corrosion equipment and industrial composite systems.",
    overview: [
      "Hebei has a long-established industrial FRP base, particularly around filament-wound pipe, storage tanks, scrubbers, cooling-tower components, grating and anti-corrosion equipment. The region is relevant to water, chemical, municipal and industrial projects where the product is a complete engineered system rather than a commodity profile or sheet.",
      "For wound products, the critical questions are liner chemistry, structural wall design, winding angle, stiffness or pressure class, joint configuration, support spacing and inspection evidence. Tanks and towers also require nozzle, flange, ladder, platform and transport details. A regional directory result should never replace review of the actual process sheet, resin system, dimensions, test method and service chemistry.",
      "Hebei can be competitive for large or project-based fabricated products, but transport protection and site access deserve early attention. Confirm loading plans, lifting points, saddles, moisture protection, repair instructions and who carries risk for damage before unloading. The category links below make it easier to compare Hebei project capability with other Chinese clusters.",
    ],
    categoryFocus: [
      { slug: "frp-pipe", label: "FRP pipe", note: "Filament-wound pipe, tanks, fittings and anti-corrosion systems." },
      { slug: "frp-grating", label: "FRP grating", note: "Industrial platforms, stair treads and trench-cover systems." },
      { slug: "pultruded-profiles", label: "Pultruded profiles", note: "Ladders, supports and corrosion-resistant structural sections." },
      { slug: "smc-bmc", label: "SMC / BMC", note: "Industrial moulded components and equipment housings." },
    ],
    faqs: [
      { question: "What is Hebei known for in FRP manufacturing?", answer: "The province is a long-established cluster for wound pipe, tanks, scrubbers, cooling-tower components, grating and industrial anti-corrosion systems." },
      { question: "What documents should I request for a Hebei FRP tank or pipe?", answer: "Request the process sheet, resin and liner details, dimensional drawings, pressure or stiffness evidence, joint and flange details, inspection records, packing plan and batch traceability." },
      { question: "How should large Hebei FRP equipment be shipped?", answer: "Agree lifting points, saddles, bracing, moisture protection, loading photographs, unloading equipment and damage responsibility before production. Transport design is part of the technical specification." },
    ],
  },
];

export const SUPPLIER_REGION_SLUGS = SUPPLIER_REGION_PAGES.map((page) => page.slug);

export function getSupplierRegionPage(slug: string): SupplierRegionPage | undefined {
  return SUPPLIER_REGION_PAGES.find((page) => page.slug === slug);
}

export function getSupplierRegionByName(name: string): SupplierRegionPage | undefined {
  return SUPPLIER_REGION_PAGES.find((page) => page.name === name);
}
