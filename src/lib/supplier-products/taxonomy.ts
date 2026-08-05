/**
 * GetFRP supplier-product taxonomy.
 *
 * The classifier is deliberately deterministic: every suggestion can be
 * explained by a matched term and reproduced with a rule version. Suppliers
 * confirm (or override) the result; no rule result is presented as platform
 * verification.
 */

export const CLASSIFICATION_RULE_VERSION = "getfrp-product-v1.0";

export const OBJECT_TYPES = [
  "raw_material",
  "intermediate_material",
  "semi_finished_product",
  "component",
  "finished_product",
  "equipment_tooling",
  "service",
] as const;

export const PRODUCT_FAMILIES = [
  "reinforcements",
  "resin_matrices",
  "core_materials",
  "prepregs_compounds",
  "structural_profiles",
  "gratings_flooring",
  "pipes_tanks",
  "panels_sheets",
  "rods_rebars",
  "molded_components",
  "sandwich_structures",
  "equipment_tooling",
  "engineering_services",
  "other_composite_products",
] as const;

export const PRODUCT_FORMS = [
  "angle",
  "channel",
  "i_beam",
  "wide_flange_beam",
  "square_tube",
  "rectangular_tube",
  "round_tube",
  "flat_strip",
  "rod",
  "rebar",
  "grating",
  "sheet_panel",
  "custom_profile",
  "other",
] as const;

export const PROCESS_TYPES = [
  "hand_layup_spray_up",
  "vacuum_infusion_vartm",
  "rtm_lrtm",
  "compression_molding_smc_bmc",
  "pultrusion",
  "filament_winding",
  "prepreg_autoclave_oven",
  "continuous_lamination",
] as const;

export const MATERIAL_SYSTEMS = [
  "gfrp",
  "cfrp",
  "bfrp",
  "aramid_frp",
  "natural_fiber_composite",
  "hybrid_composite",
] as const;

export const RESIN_SYSTEMS = [
  "unsaturated_polyester",
  "vinyl_ester",
  "epoxy",
  "phenolic",
  "polyurethane",
  "thermoplastic",
] as const;

export const APPLICATIONS = [
  "construction_infrastructure",
  "electrical_utility",
  "industrial_corrosion",
  "transportation",
  "marine_offshore",
  "energy",
  "telecom",
  "water_wastewater",
  "aerospace_defense",
] as const;

export type ObjectType = (typeof OBJECT_TYPES)[number];
export type ProductFamily = (typeof PRODUCT_FAMILIES)[number];
export type ProductForm = (typeof PRODUCT_FORMS)[number];
export type ProcessType = (typeof PROCESS_TYPES)[number];
export type MaterialSystem = (typeof MATERIAL_SYSTEMS)[number];
export type ResinSystem = (typeof RESIN_SYSTEMS)[number];
export type Application = (typeof APPLICATIONS)[number];

type LocalizedLabel = { zh: string; en: string };

export const TAXONOMY_LABELS = {
  objectType: {
    raw_material: { zh: "原材料", en: "Raw material" },
    intermediate_material: { zh: "中间材料", en: "Intermediate material" },
    semi_finished_product: { zh: "半成品/标准型材", en: "Semi-finished / standard shape" },
    component: { zh: "零部件", en: "Component" },
    finished_product: { zh: "终端制品", en: "Finished product" },
    equipment_tooling: { zh: "设备/模具", en: "Equipment / tooling" },
    service: { zh: "工程服务", en: "Engineering service" },
  } satisfies Record<ObjectType, LocalizedLabel>,
  family: {
    reinforcements: { zh: "增强材料", en: "Reinforcements" },
    resin_matrices: { zh: "树脂基体", en: "Resin matrices" },
    core_materials: { zh: "芯材", en: "Core materials" },
    prepregs_compounds: { zh: "预浸料/模塑料", en: "Prepregs & molding compounds" },
    structural_profiles: { zh: "结构型材", en: "Structural profiles" },
    gratings_flooring: { zh: "格栅/铺面", en: "Gratings & flooring" },
    pipes_tanks: { zh: "管道/储罐", en: "Pipes & tanks" },
    panels_sheets: { zh: "板材/片材", en: "Panels & sheets" },
    rods_rebars: { zh: "棒材/筋材", en: "Rods & rebars" },
    molded_components: { zh: "模压/成型部件", en: "Molded components" },
    sandwich_structures: { zh: "夹芯结构", en: "Sandwich structures" },
    equipment_tooling: { zh: "复材设备/工装", en: "Composite equipment & tooling" },
    engineering_services: { zh: "工程/检测服务", en: "Engineering & testing services" },
    other_composite_products: { zh: "其他复材产品", en: "Other composite products" },
  } satisfies Record<ProductFamily, LocalizedLabel>,
  form: {
    angle: { zh: "角材", en: "Angle" },
    channel: { zh: "槽钢", en: "Channel" },
    i_beam: { zh: "工字梁", en: "I-beam" },
    wide_flange_beam: { zh: "宽翼缘梁", en: "Wide-flange beam" },
    square_tube: { zh: "方管", en: "Square tube" },
    rectangular_tube: { zh: "矩形管", en: "Rectangular tube" },
    round_tube: { zh: "圆管", en: "Round tube" },
    flat_strip: { zh: "扁条", en: "Flat strip" },
    rod: { zh: "棒材", en: "Rod" },
    rebar: { zh: "筋材", en: "Rebar" },
    grating: { zh: "格栅", en: "Grating" },
    sheet_panel: { zh: "板材", en: "Sheet / panel" },
    custom_profile: { zh: "异形型材", en: "Custom profile" },
    other: { zh: "其他形态", en: "Other form" },
  } satisfies Record<ProductForm, LocalizedLabel>,
  process: {
    hand_layup_spray_up: { zh: "手糊/喷射", en: "Hand lay-up / spray-up" },
    vacuum_infusion_vartm: { zh: "真空导入/VARTM", en: "Vacuum infusion / VARTM" },
    rtm_lrtm: { zh: "RTM/LRTM", en: "RTM / LRTM" },
    compression_molding_smc_bmc: { zh: "模压成型（SMC/BMC）", en: "Compression molding (SMC/BMC)" },
    pultrusion: { zh: "拉挤成型", en: "Pultrusion" },
    filament_winding: { zh: "纤维缠绕", en: "Filament winding" },
    prepreg_autoclave_oven: { zh: "预浸料/热压罐/烘箱", en: "Prepreg / autoclave / oven" },
    continuous_lamination: { zh: "连续板材成型", en: "Continuous lamination" },
  } satisfies Record<ProcessType, LocalizedLabel>,
  material: {
    gfrp: { zh: "玻璃纤维复合材料（GFRP）", en: "Glass fiber composite (GFRP)" },
    cfrp: { zh: "碳纤维复合材料（CFRP）", en: "Carbon fiber composite (CFRP)" },
    bfrp: { zh: "玄武岩纤维复合材料（BFRP）", en: "Basalt fiber composite (BFRP)" },
    aramid_frp: { zh: "芳纶纤维复合材料（AFRP）", en: "Aramid fiber composite (AFRP)" },
    natural_fiber_composite: { zh: "天然纤维复合材料", en: "Natural-fiber composite" },
    hybrid_composite: { zh: "混杂纤维复合材料", en: "Hybrid composite" },
  } satisfies Record<MaterialSystem, LocalizedLabel>,
  resin: {
    unsaturated_polyester: { zh: "不饱和聚酯", en: "Unsaturated polyester" },
    vinyl_ester: { zh: "乙烯基酯", en: "Vinyl ester" },
    epoxy: { zh: "环氧", en: "Epoxy" },
    phenolic: { zh: "酚醛", en: "Phenolic" },
    polyurethane: { zh: "聚氨酯", en: "Polyurethane" },
    thermoplastic: { zh: "热塑性树脂", en: "Thermoplastic matrix" },
  } satisfies Record<ResinSystem, LocalizedLabel>,
  application: {
    construction_infrastructure: { zh: "建筑与基础设施", en: "Construction & infrastructure" },
    electrical_utility: { zh: "电力电气", en: "Electrical & utility" },
    industrial_corrosion: { zh: "工业防腐", en: "Industrial corrosion" },
    transportation: { zh: "交通运输", en: "Transportation" },
    marine_offshore: { zh: "船舶海工", en: "Marine & offshore" },
    energy: { zh: "能源", en: "Energy" },
    telecom: { zh: "通信", en: "Telecom" },
    water_wastewater: { zh: "给排水", en: "Water & wastewater" },
    aerospace_defense: { zh: "航空航天与防务", en: "Aerospace & defense" },
  } satisfies Record<Application, LocalizedLabel>,
};

export type ClassificationInput = {
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  standards?: string;
};

export type ClassificationResult = {
  objectType: ObjectType;
  productFamily: ProductFamily;
  form: ProductForm;
  processes: ProcessType[];
  materials: MaterialSystem[];
  resins: ResinSystem[];
  applications: Application[];
  standards: string[];
  confidence: number;
  evidence: string[];
  ruleVersion: string;
};

type KeywordRule<T extends string> = { value: T; terms: string[]; reason: string };

function includesAny(haystack: string, terms: string[]): boolean {
  return terms.some((term) => haystack.includes(term));
}

function collectMatches<T extends string>(
  haystack: string,
  rules: KeywordRule<T>[],
  evidence: string[],
): T[] {
  const values: T[] = [];
  for (const rule of rules) {
    if (!includesAny(haystack, rule.terms)) continue;
    values.push(rule.value);
    evidence.push(rule.reason);
  }
  return Array.from(new Set(values));
}

export function normalizeStandards(value?: string): string[] {
  if (!value) return [];
  const matches = value.toUpperCase().match(
    /\b(?:EN|ISO|ASTM|DIN|BS|UL|IEC|AS|CSA|GB(?:\/T)?|JC\/T)\s*[-:]?\s*[A-Z0-9.\-/]+/g,
  );
  return Array.from(
    new Set((matches ?? []).map((item) => item.replace(/\s+/g, " ").trim())),
  ).slice(0, 12);
}

export function classifySupplierProduct(input: ClassificationInput): ClassificationResult {
  const haystack = [
    input.name,
    input.nameEn,
    input.description,
    input.descriptionEn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const evidence: string[] = [];

  const processRules: KeywordRule<ProcessType>[] = [
    { value: "pultrusion", terms: ["pultrud", "拉挤"], reason: "名称或说明命中 pultrusion / 拉挤" },
    { value: "filament_winding", terms: ["filament winding", "wound", "缠绕"], reason: "命中 filament winding / 缠绕" },
    { value: "compression_molding_smc_bmc", terms: ["compression mold", "smc", "bmc", "模压"], reason: "命中 compression molding / SMC / BMC" },
    { value: "vacuum_infusion_vartm", terms: ["vacuum infusion", "vartm", "真空导入", "真空灌注"], reason: "命中 vacuum infusion / VARTM" },
    { value: "rtm_lrtm", terms: ["l-rtm", "lrtm", "resin transfer molding", " rtm", "rtm ", "树脂传递模塑"], reason: "命中 RTM / LRTM" },
    { value: "hand_layup_spray_up", terms: ["hand lay", "spray-up", "spray up", "手糊", "喷射"], reason: "命中 hand lay-up / spray-up" },
    { value: "prepreg_autoclave_oven", terms: ["prepreg", "autoclave", "预浸料", "热压罐"], reason: "命中 prepreg / autoclave" },
    { value: "continuous_lamination", terms: ["continuous lamin", "continuous panel", "连续板"], reason: "命中 continuous lamination" },
  ];
  const processes = collectMatches(haystack, processRules, evidence);

  const materialRules: KeywordRule<MaterialSystem>[] = [
    { value: "gfrp", terms: ["gfrp", "glass fiber", "glass fibre", "fiberglass", "玻璃钢", "玻纤"], reason: "命中 GFRP / fiberglass / 玻璃钢" },
    { value: "cfrp", terms: ["cfrp", "carbon fiber", "carbon fibre", "碳纤维"], reason: "命中 CFRP / carbon fiber" },
    { value: "bfrp", terms: ["bfrp", "basalt fiber", "basalt fibre", "玄武岩纤维"], reason: "命中 BFRP / basalt fiber" },
    { value: "aramid_frp", terms: ["aramid", "afrp", "kevlar", "芳纶"], reason: "命中 AFRP / aramid" },
    { value: "natural_fiber_composite", terms: ["flax", "hemp", "jute", "natural fiber", "天然纤维", "亚麻"], reason: "命中 natural-fiber composite" },
    { value: "hybrid_composite", terms: ["hybrid composite", "混杂纤维"], reason: "命中 hybrid composite" },
  ];
  const materials = collectMatches(haystack, materialRules, evidence);

  const resinRules: KeywordRule<ResinSystem>[] = [
    { value: "vinyl_ester", terms: ["vinyl ester", "vinylester", "乙烯基酯", "乙烯基树脂"], reason: "树脂命中 vinyl ester" },
    { value: "unsaturated_polyester", terms: ["unsaturated polyester", "polyester resin", "upr", "不饱和聚酯"], reason: "树脂命中 unsaturated polyester" },
    { value: "epoxy", terms: ["epoxy", "环氧"], reason: "树脂命中 epoxy" },
    { value: "phenolic", terms: ["phenolic", "酚醛"], reason: "树脂命中 phenolic" },
    { value: "polyurethane", terms: ["polyurethane", "聚氨酯"], reason: "树脂命中 polyurethane" },
    { value: "thermoplastic", terms: ["thermoplastic", "pa6", "peek", "pps", "热塑"], reason: "树脂命中 thermoplastic" },
  ];
  const resins = collectMatches(haystack, resinRules, evidence);

  const formRules: KeywordRule<ProductForm>[] = [
    { value: "i_beam", terms: ["i-beam", "i beam", "工字梁", "工字钢"], reason: "形状命中 I-beam" },
    { value: "wide_flange_beam", terms: ["wide flange", "h-beam", "h beam", "h型", "宽翼缘"], reason: "形状命中 wide-flange beam" },
    { value: "square_tube", terms: ["square tube", "square hollow", "方管"], reason: "形状命中 square tube" },
    { value: "rectangular_tube", terms: ["rectangular tube", "rectangular hollow", "矩形管"], reason: "形状命中 rectangular tube" },
    { value: "round_tube", terms: ["round tube", "circular tube", "圆管"], reason: "形状命中 round tube" },
    { value: "channel", terms: ["channel", "u-shape", "u shape", "槽钢", "槽型"], reason: "形状命中 channel" },
    { value: "angle", terms: ["angle profile", "angle section", "l-angle", "角钢", "角材"], reason: "形状命中 angle" },
    { value: "flat_strip", terms: ["flat strip", "flat bar", "扁条", "扁钢"], reason: "形状命中 flat strip" },
    { value: "rebar", terms: ["rebar", "reinforcing bar", "筋材", "锚杆"], reason: "形状命中 rebar" },
    { value: "rod", terms: ["solid rod", "frp rod", "gfrp rod", "棒材", "圆棒"], reason: "形状命中 rod" },
    { value: "grating", terms: ["grating", "格栅"], reason: "形状命中 grating" },
    { value: "sheet_panel", terms: ["sheet", "panel", "板材", "面板"], reason: "形状命中 sheet / panel" },
    { value: "custom_profile", terms: ["custom profile", "custom section", "异形型材", "定制型材"], reason: "形状命中 custom profile" },
  ];
  const forms = collectMatches(haystack, formRules, evidence);
  let form = forms[0] ?? "other";

  let productFamily: ProductFamily = "other_composite_products";
  if (includesAny(haystack, ["resin", "epoxy", "polyester", "树脂", "胶衣"])) productFamily = "resin_matrices";
  if (includesAny(haystack, ["rovings", "roving", "fabric", "mat", "织物", "纤维毡", "纱"])) productFamily = "reinforcements";
  if (includesAny(haystack, ["core material", "foam core", "honeycomb", "芯材", "蜂窝"])) productFamily = "core_materials";
  if (includesAny(haystack, ["prepreg", "smc sheet", "bmc compound", "molding compound", "预浸料", "模塑料"])) productFamily = "prepregs_compounds";
  if (includesAny(haystack, ["grating", "格栅"])) productFamily = "gratings_flooring";
  if (includesAny(haystack, ["pipe", "tank", "duct", "管道", "储罐", "风管"])) productFamily = "pipes_tanks";
  if (includesAny(haystack, ["panel", "sheet", "板材", "面板"])) productFamily = "panels_sheets";
  if (includesAny(haystack, ["rebar", "rod", "筋材", "锚杆", "棒材"])) productFamily = "rods_rebars";
  if (includesAny(haystack, ["sandwich", "夹芯"])) productFamily = "sandwich_structures";
  if (includesAny(haystack, ["machine", "equipment", "mold", "tooling", "生产线", "设备", "模具"])) productFamily = "equipment_tooling";
  if (includesAny(haystack, ["testing service", "engineering service", "consulting", "检测服务", "工程服务", "咨询"])) productFamily = "engineering_services";
  if (
    processes.includes("pultrusion") ||
    includesAny(haystack, ["profile", "structural section", "beam", "channel", "angle", "型材", "槽钢", "角钢", "工字梁"])
  ) productFamily = "structural_profiles";
  evidence.push(`产品族规则归入 ${productFamily}`);

  let objectType: ObjectType = "finished_product";
  if (["reinforcements", "resin_matrices", "core_materials"].includes(productFamily)) objectType = "raw_material";
  if (productFamily === "prepregs_compounds") objectType = "intermediate_material";
  if (["structural_profiles", "panels_sheets", "rods_rebars"].includes(productFamily)) objectType = "semi_finished_product";
  if (["molded_components", "sandwich_structures"].includes(productFamily)) objectType = "component";
  if (productFamily === "equipment_tooling") objectType = "equipment_tooling";
  if (productFamily === "engineering_services") objectType = "service";
  evidence.push(`对象类型由产品族映射为 ${objectType}`);

  if (processes.length === 0 && productFamily === "structural_profiles") {
    processes.push("pultrusion");
    evidence.push("结构型材规则补全 pultrusion（需供应商确认）");
  }
  if (materials.length === 0 && includesAny(haystack, ["frp", "composite", "复合材料"])) {
    materials.push("gfrp");
    evidence.push("通用 FRP 词命中，建议 GFRP（需供应商确认）");
  }
  if (form === "other" && productFamily === "structural_profiles") form = "custom_profile";

  const applicationRules: KeywordRule<Application>[] = [
    { value: "construction_infrastructure", terms: ["construction", "bridge", "infrastructure", "建筑", "桥梁", "基础设施"], reason: "应用命中 construction / infrastructure" },
    { value: "electrical_utility", terms: ["electrical", "cable ladder", "cable tray", "utility", "电力", "电气", "电缆桥架"], reason: "应用命中 electrical / utility" },
    { value: "industrial_corrosion", terms: ["corrosion", "chemical plant", "防腐", "化工"], reason: "应用命中 industrial corrosion" },
    { value: "transportation", terms: ["rail", "automotive", "transport", "铁路", "汽车", "交通"], reason: "应用命中 transportation" },
    { value: "marine_offshore", terms: ["marine", "offshore", "船舶", "海工"], reason: "应用命中 marine / offshore" },
    { value: "energy", terms: ["wind energy", "solar", "energy", "风电", "光伏", "能源"], reason: "应用命中 energy" },
    { value: "telecom", terms: ["telecom", "radome", "通信", "天线罩"], reason: "应用命中 telecom" },
    { value: "water_wastewater", terms: ["wastewater", "water treatment", "污水", "水处理"], reason: "应用命中 water / wastewater" },
    { value: "aerospace_defense", terms: ["aerospace", "defense", "航空", "航天", "军工"], reason: "应用命中 aerospace / defense" },
  ];
  const applications = collectMatches(haystack, applicationRules, evidence);
  const standards = normalizeStandards(`${input.standards ?? ""} ${haystack}`);
  if (standards.length > 0) evidence.push(`识别到标准：${standards.join(", ")}`);

  const decisiveFields = [
    productFamily !== "other_composite_products",
    form !== "other",
    processes.length > 0,
    materials.length > 0,
    resins.length > 0,
    applications.length > 0,
    standards.length > 0,
  ].filter(Boolean).length;
  const confidence = Math.min(96, 46 + decisiveFields * 8);

  return {
    objectType,
    productFamily,
    form,
    processes,
    materials,
    resins,
    applications,
    standards,
    confidence,
    evidence: Array.from(new Set(evidence)).slice(0, 12),
    ruleVersion: CLASSIFICATION_RULE_VERSION,
  };
}

export function taxonomyLabel(
  facet: keyof typeof TAXONOMY_LABELS,
  value: string,
  locale: "zh" | "en",
): string {
  const labels = TAXONOMY_LABELS[facet] as Record<string, LocalizedLabel>;
  return labels[value]?.[locale] ?? value.replaceAll("_", " ");
}
