// Static GB ⇄ ASTM / EN / ISO crosswalk for FRP composite materials.
// Curated by technical editorial, not auto-generated. Covers the
// standards overseas sourcing engineers most often ask about.

export type CrosswalkRow = {
  topic: string;
  topicEn: string;
  gb: string;
  gbTitle: string;
  intl: Array<{ code: string; title: string; body: "ASTM" | "ISO" | "EN" | "DIN" }>;
  note?: string;
};

export const crosswalk: CrosswalkRow[] = [
  {
    topic: "拉伸性能",
    topicEn: "Tensile properties",
    gb: "GB/T 1447-2005",
    gbTitle: "Fiber-reinforced plastics — Determination of tensile properties",
    intl: [
      { code: "ASTM D3039", title: "Tensile properties of polymer matrix composites", body: "ASTM" },
      { code: "ISO 527-4 / 527-5", title: "Tensile properties of fiber-reinforced plastics", body: "ISO" },
      { code: "EN ISO 527-4", title: "European adoption of ISO 527-4", body: "EN" },
    ],
    note: "GB/T 1447 aligns structurally with ISO 527-4/5. ASTM D3039 uses different specimen geometry — conversion factors may apply.",
  },
  {
    topic: "弯曲性能",
    topicEn: "Flexural properties",
    gb: "GB/T 1449-2005",
    gbTitle: "Fiber-reinforced plastics — Determination of flexural properties",
    intl: [
      { code: "ASTM D7264", title: "Flexural properties of polymer matrix composites", body: "ASTM" },
      { code: "ASTM D790", title: "Flexural properties of reinforced / unreinforced plastics", body: "ASTM" },
      { code: "ISO 14125", title: "Flexural properties of fiber-reinforced plastics", body: "ISO" },
      { code: "EN ISO 14125", title: "European adoption of ISO 14125", body: "EN" },
    ],
  },
  {
    topic: "压缩性能",
    topicEn: "Compressive properties",
    gb: "GB/T 1448-2005",
    gbTitle: "Fiber-reinforced plastics — Determination of compressive properties",
    intl: [
      { code: "ASTM D695", title: "Compressive properties of rigid plastics", body: "ASTM" },
      { code: "ASTM D6641", title: "Compressive properties using combined-loading fixture", body: "ASTM" },
      { code: "ISO 14126", title: "Compressive properties in the in-plane direction", body: "ISO" },
    ],
  },
  {
    topic: "层间剪切",
    topicEn: "Interlaminar shear strength",
    gb: "GB/T 1450.1-2005",
    gbTitle: "Fiber-reinforced plastics — Interlaminar shear (short-beam)",
    intl: [
      { code: "ASTM D2344", title: "Short-beam strength of polymer matrix composites", body: "ASTM" },
      { code: "ISO 14130", title: "Apparent interlaminar shear strength by short-beam method", body: "ISO" },
    ],
  },
  {
    topic: "冲击性能",
    topicEn: "Impact resistance (Charpy)",
    gb: "GB/T 1451-2005",
    gbTitle: "Fiber-reinforced plastics — Simple-beam impact (Charpy)",
    intl: [
      { code: "ASTM D7136", title: "Drop-weight impact damage resistance of laminates", body: "ASTM" },
      { code: "ISO 179", title: "Charpy impact properties of plastics", body: "ISO" },
    ],
  },
  {
    topic: "阻燃/火焰传播",
    topicEn: "Flame / fire performance",
    gb: "GB/T 8924-2005",
    gbTitle: "FRP — Determination of non-metallic material smoke density",
    intl: [
      { code: "ASTM E84", title: "Surface burning characteristics of building materials", body: "ASTM" },
      { code: "ASTM D635", title: "Rate of burning of self-supporting plastics", body: "ASTM" },
      { code: "ISO 5660-1", title: "Reaction to fire — heat release (cone calorimeter)", body: "ISO" },
      { code: "EN 45545-2", title: "Railway applications — fire protection of rolling stock", body: "EN" },
    ],
  },
  {
    topic: "玻璃纤维织物",
    topicEn: "Glass fiber woven fabric",
    gb: "GB/T 18370-2014",
    gbTitle: "Glass fiber stitched fabrics",
    intl: [
      { code: "ASTM D579", title: "Greige woven glass fabrics", body: "ASTM" },
      { code: "ISO 2113", title: "Reinforcements — Woven fabrics — Basis for specification", body: "ISO" },
    ],
  },
  {
    topic: "玻璃纤维无捻粗纱",
    topicEn: "Glass fiber roving",
    gb: "GB/T 18369-2014",
    gbTitle: "Glass fiber direct rovings",
    intl: [
      { code: "ASTM D578", title: "Glass fiber strands", body: "ASTM" },
      { code: "ISO 1889", title: "Reinforcement yarns — linear density determination", body: "ISO" },
    ],
  },
  {
    topic: "拉挤型材",
    topicEn: "Pultruded profiles",
    gb: "GB/T 31539-2015",
    gbTitle: "Fiber-reinforced thermoset plastic pultruded profiles — structural",
    intl: [
      { code: "ASTM D3917", title: "Dimensional tolerance of pultruded profiles", body: "ASTM" },
      { code: "ASTM D4385", title: "Classification of visual defects in pultruded profiles", body: "ASTM" },
      { code: "EN 13706", title: "Structural pultruded profiles — specification", body: "EN" },
    ],
    note: "EN 13706 is the primary European pultrusion reference. GB/T 31539 is closely modeled on it but with national grade classifications.",
  },
  {
    topic: "玻璃钢管道",
    topicEn: "FRP piping",
    gb: "GB/T 21238-2016",
    gbTitle: "Glass-fiber reinforced plastic mortar pipes",
    intl: [
      { code: "ASTM D3517", title: "Fiberglass pressure pipe", body: "ASTM" },
      { code: "ASTM D3754", title: "Fiberglass sewer and industrial pressure pipe", body: "ASTM" },
      { code: "ISO 10467", title: "Plastics piping systems for pressure and non-pressure drainage — GRP", body: "ISO" },
      { code: "EN 14364", title: "Plastics piping systems — GRP based on unsaturated polyester", body: "EN" },
    ],
  },
  {
    topic: "玻璃钢储罐",
    topicEn: "FRP storage tanks",
    gb: "GB/T 21493-2008",
    gbTitle: "Filament-wound glass-fiber-reinforced plastic tanks",
    intl: [
      { code: "ASTM D3299", title: "Filament-wound GRP corrosion-resistant tanks", body: "ASTM" },
      { code: "ASTM D4097", title: "Contact-molded glass-fiber-reinforced thermoset tanks", body: "ASTM" },
      { code: "EN 13121", title: "GRP tanks and vessels for above-ground use", body: "EN" },
    ],
  },
  {
    topic: "环氧树脂",
    topicEn: "Epoxy resin",
    gb: "GB/T 13657-2011",
    gbTitle: "Bisphenol-A epoxy resin",
    intl: [
      { code: "ASTM D1652", title: "Epoxy content of epoxy resins", body: "ASTM" },
      { code: "ISO 3001", title: "Plastics — Epoxy compounds — determination of epoxy equivalent", body: "ISO" },
    ],
  },
];

// Export readiness certifications that overseas buyers screen by.
export const exportReadinessCerts = [
  {
    id: "iso9001",
    name: "ISO 9001",
    scope: "Quality management",
    why: "Minimum baseline required by most Tier-1 OEMs for supplier onboarding.",
  },
  {
    id: "iso14001",
    name: "ISO 14001",
    scope: "Environmental management",
    why: "Mandatory for EU customers governed by ESG / supply-chain-due-diligence rules.",
  },
  {
    id: "iso45001",
    name: "ISO 45001",
    scope: "Occupational health & safety",
    why: "Increasingly expected by automotive and energy buyers.",
  },
  {
    id: "ce",
    name: "CE marking",
    scope: "EU product conformity",
    why: "Required for construction products (CPR), machinery, PPE when sold in the EU / EEA.",
  },
  {
    id: "asme",
    name: "ASME",
    scope: "Pressure vessels & piping (US)",
    why: "Required for FRP pressure vessels and process piping sold into the US market.",
  },
  {
    id: "api",
    name: "API",
    scope: "Oil & gas (upstream / midstream)",
    why: "API-15HR / 15LR / 15S certify FRP pipe for oilfield and petrochemical duty.",
  },
  {
    id: "ccs",
    name: "CCS / DNV / ABS / LR",
    scope: "Marine classification",
    why: "Required for FRP vessels, piping, gratings used in ships and offshore platforms.",
  },
  {
    id: "as9100",
    name: "AS9100",
    scope: "Aerospace quality",
    why: "Required for any CFRP structure entering aerospace and defense supply chains.",
  },
  {
    id: "iatf",
    name: "IATF 16949",
    scope: "Automotive quality",
    why: "Mandatory for Tier-1 / Tier-2 automotive CFRP and SMC structural suppliers.",
  },
  {
    id: "ul",
    name: "UL",
    scope: "North American fire / safety",
    why: "UL-94 flame rating is required for FRP used in electrical enclosures and cable trays.",
  },
];

// Province-level counts for the heatmap (values are illustrative fallbacks —
// real data comes from supplier_listings.province at runtime).
export const chinaFrpProvinces = [
  { code: "JS", name: "Jiangsu", specialty: "Pultrusion, gratings, profiles" },
  { code: "ZJ", name: "Zhejiang", specialty: "Resins, gelcoats, auxiliaries" },
  { code: "SD", name: "Shandong", specialty: "Tanks, pipes, wind blade fabrics" },
  { code: "GD", name: "Guangdong", specialty: "CFRP parts, autoclave, trade" },
  { code: "HB", name: "Hebei", specialty: "Pipes, tanks, industrial FRP" },
  { code: "HN", name: "Hunan", specialty: "Carbon fiber production" },
  { code: "JX", name: "Jiangxi", specialty: "Glass fiber (Taishan Fiberglass)" },
  { code: "SH", name: "Shanghai", specialty: "Trade houses, QC labs, certification" },
  { code: "LN", name: "Liaoning", specialty: "Marine FRP, ship-yard composites" },
  { code: "FJ", name: "Fujian", specialty: "Boats, recreational composites" },
];
