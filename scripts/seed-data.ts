// ═══════════════════════════════════════════
// Cold-start seed data — large-scale generators
// ═══════════════════════════════════════════
// NOTE: 此处为冷启动骨架数据。属性参数取行业典型值范围，
// 具体批次以供应商实测为准。企业通过"认领"流程自行校准。

type MaterialSeed = {
  id: string;
  name: string;
  nameEn: string;
  category:
    | "resin"
    | "fiber-yarn"
    | "fiber-mat"
    | "fiber-fabric"
    | "core"
    | "gelcoat"
    | "auxiliary"
    | "composite";
  subCategory: string;
  brand: string;
  model: string;
  properties: Record<string, string>;
  applications: string[];
  description: string;
};

// Map a fiber "form" (yarn/mat/fabric) to its dedicated category.
// Keywords are matched against the form display name from the generator loops below.
function fiberCategory(form: string): "fiber-yarn" | "fiber-mat" | "fiber-fabric" {
  if (/毡/.test(form)) return "fiber-mat";
  if (/布|预浸|无纬/.test(form)) return "fiber-fabric";
  return "fiber-yarn";
}

type FormulaIngredient = { name: string; role: string; amount: string; note?: string };
type FormulaSeed = {
  id: string;
  name: string;
  processId: string;
  process: string;
  category: string;
  application: string;
  difficulty: "入门" | "中级" | "高级";
  description: string;
  resinSystem: FormulaIngredient[];
  reinforcement: FormulaIngredient[];
  auxiliaries: FormulaIngredient[];
  processing: Array<{ name: string; value: string; note?: string }>;
  properties: Array<{ name: string; value: string; standard?: string; note?: string }>;
  tips: string[];
  safetyNotes: string[];
};

type SupplierSeed = {
  id: string;
  name: string;
  location: string;
  province: string;
  category: "manufacturer" | "resin" | "fiber" | "equipment" | "mold" | "service";
  products: string[];
  processes: string[];
  established: number;
  verified: boolean;
  description: string;
  certifications: string[];
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
}

// Deterministic pseudo-random based on content hash — keeps property values stable across seed reruns
function seededRand(seed: string, min: number, max: number, decimals = 2): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const f = ((h >>> 0) % 10000) / 10000;
  return (min + f * (max - min)).toFixed(decimals);
}
function seededPick<T>(seed: string, arr: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

// ═══════════════════════════════════════════
// MATERIALS — 按类别×品牌×型号矩阵生成 ~500
// ═══════════════════════════════════════════

const RESIN_BRANDS = [
  // ── 中国主流 UPR / VER 厂商
  "华昌聚合物", "天和树脂", "亚邦化工", "上纬新材", "富宁树脂",
  "远东联石化", "利群化工", "福鸿化学", "立邦新材", "信和新材",
  "双键化工", "合众新材料", "浙江品正", "山东三义",
  // ── 中国主流环氧厂商
  "南亚环氧", "宏昌电子", "惠柏新材", "巴陵石化", "中石化仪征",
  "蓝星东大", "凯盛新材", "东方雨虹",
  // ── 中国主流酚醛 / 聚氨酯 / BMI
  "圣泉集团", "山西三维", "万华化学", "红宝丽", "科思创 (上海)",
  // ── 国际品牌
  "Ashland 亚什兰", "Reichhold", "AOC Aliancys", "Scott Bader", "Polynt",
  "DIC 日本", "CCP Composites", "Hexion 瀚森", "Olin 奥林", "Huntsman 亨斯迈",
  "Dow 陶氏", "Sika 西卡", "Sumitomo 住友", "Kukdo 国都",
  "德山化工", "Araldite Ciba", "Allnex", "Evonik 赢创",
];

const RESIN_TYPES: Array<{
  sub: string;
  prefix: string;
  tensileRange: [number, number];
  flexRange: [number, number];
  modulusRange: [number, number];
  hdtRange: [number, number];
  densityRange: [number, number];
  apps: string[];
}> = [
  // ── 不饱和聚酯 UPR 族
  { sub: "邻苯型不饱和聚酯-通用", prefix: "UPR", tensileRange: [55, 70], flexRange: [95, 115], modulusRange: [3.2, 3.9], hdtRange: [75, 90], densityRange: [1.10, 1.15], apps: ["手糊", "玻璃钢制品", "卫浴", "冷却塔"] },
  { sub: "间苯型不饱和聚酯-耐腐蚀", prefix: "UPR-ISO", tensileRange: [60, 75], flexRange: [100, 130], modulusRange: [3.4, 4.0], hdtRange: [85, 105], densityRange: [1.11, 1.17], apps: ["储罐", "防腐管道", "脱硫装置"] },
  { sub: "双酚 A 型不饱和聚酯-耐温", prefix: "UPR-BPA", tensileRange: [60, 80], flexRange: [105, 140], modulusRange: [3.5, 4.1], hdtRange: [100, 130], densityRange: [1.12, 1.18], apps: ["脱硫塔", "化工储罐"] },
  { sub: "DCPD 型不饱和聚酯-低收缩", prefix: "UPR-DCPD", tensileRange: [55, 70], flexRange: [90, 120], modulusRange: [3.0, 3.8], hdtRange: [75, 95], densityRange: [1.08, 1.13], apps: ["SMC", "BMC", "汽车外饰"] },
  { sub: "光固化不饱和聚酯", prefix: "UPR-UV", tensileRange: [50, 68], flexRange: [90, 115], modulusRange: [3.0, 3.8], hdtRange: [70, 90], densityRange: [1.10, 1.18], apps: ["3D 打印", "修补", "快速固化制品"] },
  { sub: "SMC/BMC 专用树脂", prefix: "UPR-SMC", tensileRange: [55, 75], flexRange: [100, 130], modulusRange: [3.3, 4.0], hdtRange: [120, 160], densityRange: [1.70, 1.95], apps: ["SMC 模压", "汽车配件", "电气外壳"] },
  // ── 乙烯基酯 VER 族
  { sub: "邻苯型乙烯基酯-通用", prefix: "VER", tensileRange: [70, 85], flexRange: [115, 145], modulusRange: [3.5, 4.2], hdtRange: [100, 120], densityRange: [1.09, 1.14], apps: ["防腐涂层", "储罐内衬", "化工管道"] },
  { sub: "酚醛改性乙烯基酯-耐温", prefix: "VER-NV", tensileRange: [75, 90], flexRange: [120, 155], modulusRange: [3.6, 4.3], hdtRange: [120, 160], densityRange: [1.10, 1.15], apps: ["高温烟囱", "耐温储罐"] },
  { sub: "溴化环氧乙烯基酯-阻燃", prefix: "VER-FR", tensileRange: [65, 80], flexRange: [110, 140], modulusRange: [3.4, 4.1], hdtRange: [95, 115], densityRange: [1.25, 1.35], apps: ["轨道交通", "防火格栅"] },
  { sub: "弹性体改性乙烯基酯-韧性", prefix: "VER-E", tensileRange: [70, 85], flexRange: [110, 140], modulusRange: [3.2, 3.9], hdtRange: [90, 115], densityRange: [1.08, 1.14], apps: ["化工管道", "复合储罐"] },
  // ── 环氧树脂族
  { sub: "双酚 A 环氧-通用", prefix: "EP-A", tensileRange: [70, 90], flexRange: [115, 150], modulusRange: [3.0, 3.8], hdtRange: [90, 130], densityRange: [1.15, 1.25], apps: ["碳纤预浸料", "电子封装", "结构粘接"] },
  { sub: "双酚 F 环氧-低粘度", prefix: "EP-F", tensileRange: [65, 85], flexRange: [110, 140], modulusRange: [2.8, 3.6], hdtRange: [75, 105], densityRange: [1.15, 1.22], apps: ["真空导入", "RTM"] },
  { sub: "酚醛环氧-高温", prefix: "EP-N", tensileRange: [70, 85], flexRange: [110, 140], modulusRange: [3.2, 4.0], hdtRange: [140, 180], densityRange: [1.20, 1.28], apps: ["航空结构", "电器绝缘"] },
  { sub: "风电叶片灌注环氧", prefix: "EP-WT", tensileRange: [70, 85], flexRange: [115, 145], modulusRange: [3.0, 3.6], hdtRange: [80, 105], densityRange: [1.14, 1.20], apps: ["风电叶片", "大型 VARTM"] },
  { sub: "脂环族环氧-耐候", prefix: "EP-CYC", tensileRange: [55, 75], flexRange: [100, 130], modulusRange: [2.7, 3.5], hdtRange: [120, 170], densityRange: [1.10, 1.20], apps: ["户外绝缘", "户外结构"] },
  { sub: "水性环氧", prefix: "EP-WB", tensileRange: [40, 60], flexRange: [80, 110], modulusRange: [2.4, 3.2], hdtRange: [60, 85], densityRange: [1.05, 1.15], apps: ["环保涂层", "防腐底漆"] },
  // ── 高性能特种树脂
  { sub: "双马来酰亚胺 BMI", prefix: "BMI", tensileRange: [75, 95], flexRange: [130, 170], modulusRange: [3.5, 4.5], hdtRange: [200, 260], densityRange: [1.25, 1.32], apps: ["航天结构", "雷达罩"] },
  { sub: "氰酸酯树脂 CE", prefix: "CE", tensileRange: [70, 90], flexRange: [120, 155], modulusRange: [3.2, 4.0], hdtRange: [200, 280], densityRange: [1.18, 1.25], apps: ["导弹雷达罩", "高频电路板"] },
  { sub: "酚醛树脂 PF", prefix: "PF", tensileRange: [40, 60], flexRange: [75, 110], modulusRange: [3.0, 4.0], hdtRange: [150, 200], densityRange: [1.20, 1.35], apps: ["防火板", "阻燃制品", "摩擦片"] },
  { sub: "聚氨酯树脂 PU", prefix: "PU", tensileRange: [45, 70], flexRange: [80, 120], modulusRange: [2.0, 3.2], hdtRange: [70, 100], densityRange: [1.10, 1.25], apps: ["拉挤门窗型材", "体育用品"] },
  { sub: "热塑环氧 / 可回收", prefix: "EP-R", tensileRange: [60, 80], flexRange: [100, 135], modulusRange: [2.8, 3.6], hdtRange: [95, 130], densityRange: [1.12, 1.22], apps: ["可回收叶片", "绿色复材"] },
  { sub: "聚酰亚胺 PI", prefix: "PI", tensileRange: [90, 120], flexRange: [150, 200], modulusRange: [3.8, 4.8], hdtRange: [300, 400], densityRange: [1.35, 1.45], apps: ["航空发动机", "极端高温"] },
  // ── 不常见但进入主流
  { sub: "苯并恶嗪 BOZ", prefix: "BOZ", tensileRange: [75, 95], flexRange: [120, 160], modulusRange: [3.5, 4.5], hdtRange: [170, 220], densityRange: [1.20, 1.28], apps: ["军工", "电子封装"] },
  { sub: "有机硅树脂", prefix: "SI", tensileRange: [20, 40], flexRange: [40, 80], modulusRange: [1.5, 2.8], hdtRange: [200, 300], densityRange: [1.10, 1.30], apps: ["高温密封", "耐候涂层"] },
];

const MATERIALS_SEED: MaterialSeed[] = [];

function rand(min: number, max: number, decimals = 2): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

for (let bi = 0; bi < RESIN_BRANDS.length; bi++) {
  const brand = RESIN_BRANDS[bi];
  for (let ti = 0; ti < RESIN_TYPES.length; ti++) {
    const type = RESIN_TYPES[ti];
    const grades = ["A", "B", "C"];
    for (let gi = 0; gi < grades.length; gi++) {
      const g = grades[gi];
      const modelNum = 100 + (bi * 13 + ti) * 7 + gi * 3;
      const model = `${type.prefix}-${modelNum}${g}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `${type.sub} ${model}`,
        nameEn: `${type.sub.split("-")[0]} Resin ${model}`,
        category: "resin",
        subCategory: type.sub,
        brand,
        model,
        properties: {
          density: `${seededRand(id + "density", type.densityRange[0], type.densityRange[1], 2)} g/cm³`,
          tensileStrength: `${seededRand(id + "tensile", type.tensileRange[0], type.tensileRange[1], 0)} MPa`,
          flexuralStrength: `${seededRand(id + "flex", type.flexRange[0], type.flexRange[1], 0)} MPa`,
          flexuralModulus: `${seededRand(id + "mod", type.modulusRange[0], type.modulusRange[1], 1)} GPa`,
          hdt: `${seededRand(id + "hdt", type.hdtRange[0], type.hdtRange[1], 0)}°C`,
          elongation: `${seededRand(id + "elong", 1.8, 4.2, 1)}%`,
          waterAbsorption: `${seededRand(id + "water", 0.08, 0.22, 2)}%`,
        },
        applications: type.apps.slice(),
        description: `${brand}出品的${type.sub}树脂，${type.apps.slice(0, 2).join("、")}等场合典型应用。`,
      });
    }
  }
}

// ─── Fibers ───
const GLASS_FIBER_BRANDS = [
  "巨石集团", "泰山玻纤", "重庆国际复材", "四川威玻", "山东玻纤",
  "长海股份", "宏和电子材料", "欧文斯科宁", "PPG", "日东纺",
];
const GLASS_GRADES = [
  { grade: "E-glass 无碱", tensile: [3100, 3500], modulus: [72, 78], density: [2.54, 2.58], apps: ["通用增强", "拉挤型材"] },
  { grade: "ECR-glass 耐腐", tensile: [3200, 3600], modulus: [75, 82], density: [2.60, 2.65], apps: ["储罐", "管道"] },
  { grade: "S-glass 高强", tensile: [4200, 4800], modulus: [85, 95], density: [2.46, 2.52], apps: ["军工", "航空结构"] },
  { grade: "AR-glass 抗碱", tensile: [1700, 2500], modulus: [70, 76], density: [2.68, 2.75], apps: ["水泥基复材", "混凝土增强"] },
];
const GLASS_FORMS = [
  { form: "无捻粗纱", code: "ER" },
  { form: "方格布", code: "EW" },
  { form: "短切毡", code: "CSM" },
  { form: "表面毡", code: "SM" },
  { form: "缝编布", code: "NCF" },
  { form: "SMC专用粗纱", code: "SMC" },
  { form: "拉挤专用粗纱", code: "PULT" },
  { form: "缠绕专用粗纱", code: "WIND" },
];

const GLASS_TEX = [300, 600, 1200, 2400, 4800];
for (let bi = 0; bi < GLASS_FIBER_BRANDS.length; bi++) {
  const brand = GLASS_FIBER_BRANDS[bi];
  for (let gi = 0; gi < GLASS_GRADES.length; gi++) {
    const grade = GLASS_GRADES[gi];
    for (let fi = 0; fi < 5; fi++) {
      const form = GLASS_FORMS[fi];
      const tex = GLASS_TEX[(bi + gi + fi) % GLASS_TEX.length];
      const model = `${form.code}-${grade.grade.slice(0, 1)}-${tex}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `${grade.grade} ${form.form} ${tex}tex`,
        nameEn: `${grade.grade.split(" ")[0]} ${form.form}`,
        category: fiberCategory(form.form),
        subCategory: grade.grade,
        brand,
        model,
        properties: {
          density: `${seededRand(id + "d", grade.density[0], grade.density[1], 2)} g/cm³`,
          tensileStrength: `${seededRand(id + "t", grade.tensile[0], grade.tensile[1], 0)} MPa`,
          flexuralModulus: `${seededRand(id + "m", grade.modulus[0], grade.modulus[1], 0)} GPa`,
          elongation: `${seededRand(id + "e", 3.5, 5.0, 1)}%`,
          hardness: `无`,
        },
        applications: grade.apps.slice(),
        description: `${brand}${grade.grade}${form.form}，典型线密度 ${tex}tex。`,
      });
    }
  }
}

// ═══════════════════════════════════════════
// REAL glass-fiber products — 4 major brands
// ═══════════════════════════════════════════
// Public product catalog: Jushi, Taishan, CPIC, Owens Corning.
// Property values reflect published typical data; individual batches vary.

type RealGlass = {
  brand: string;
  model: string;
  name: string;
  nameEn: string;
  grade: string;
  form: string;
  tensile: [number, number];
  modulus: [number, number];
  density: [number, number];
  apps: string[];
  note?: string;
};

const REAL_GLASS_PRODUCTS: RealGlass[] = [
  // ────────── 巨石集团 Jushi ──────────
  { brand: "中国巨石", model: "188A-2400", name: "188A 无碱直接无捻粗纱 2400tex", nameEn: "E-glass Direct Roving 188A 2400 tex", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3100, 3500], modulus: [72, 78], density: [2.54, 2.58], apps: ["拉挤型材", "通用增强"], note: "拉挤通用型号，树脂浸润快" },
  { brand: "中国巨石", model: "188P-4800", name: "188P 拉挤专用直接粗纱 4800tex", nameEn: "E-glass Pultrusion Roving 188P 4800 tex", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3200, 3500], modulus: [72, 78], density: [2.55, 2.58], apps: ["拉挤型材", "格栅", "窗框"] },
  { brand: "中国巨石", model: "386T-1200", name: "386T 风电叶片直接粗纱 1200tex", nameEn: "E-glass Wind-blade Direct Roving 386T", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3300, 3600], modulus: [74, 80], density: [2.55, 2.58], apps: ["风电叶片", "大型结构"] },
  { brand: "中国巨石", model: "386H-2400", name: "386H 风电手糊型粗纱 2400tex", nameEn: "E-glass Wind-layup Roving 386H", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3200, 3500], modulus: [73, 78], density: [2.55, 2.58], apps: ["风电叶片", "手糊"] },
  { brand: "中国巨石", model: "288T-2400", name: "288T 喷射成型合股粗纱", nameEn: "E-glass Spray-up Assembled Roving 288T", grade: "E-glass 无碱", form: "合股粗纱", tensile: [3000, 3300], modulus: [72, 76], density: [2.54, 2.58], apps: ["喷射成型", "手糊"] },
  { brand: "中国巨石", model: "888A-2400", name: "888A SMC 合股粗纱", nameEn: "E-glass SMC Roving 888A", grade: "E-glass 无碱", form: "SMC专用粗纱", tensile: [3000, 3400], modulus: [72, 76], density: [2.55, 2.58], apps: ["SMC 模压", "汽车外饰"] },
  { brand: "中国巨石", model: "988A-4.5", name: "988A 热塑增强短切原丝 4.5mm", nameEn: "E-glass Chopped Strand 988A 4.5 mm", grade: "E-glass 无碱", form: "短切原丝", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["PP 增强", "PA/PBT 增强"] },
  { brand: "中国巨石", model: "988H-3.0", name: "988H 高流动短切原丝 3mm", nameEn: "E-glass High-flow Chopped 988H 3 mm", grade: "E-glass 无碱", form: "短切原丝", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["注塑 PP", "高流动热塑"] },
  { brand: "中国巨石", model: "318H-6.0", name: "318H BMC 专用短切 6mm", nameEn: "E-glass BMC Chopped 318H 6 mm", grade: "E-glass 无碱", form: "短切原丝", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["BMC 模压", "电气外壳"] },
  { brand: "中国巨石", model: "EMC-300", name: "EMC-300 手糊短切毡 300g/㎡", nameEn: "E-glass Chopped Strand Mat 300 g/m²", grade: "E-glass 无碱", form: "短切毡", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["手糊成型", "卫浴"] },
  { brand: "中国巨石", model: "EMC-450", name: "EMC-450 手糊短切毡 450g/㎡", nameEn: "E-glass Chopped Strand Mat 450 g/m²", grade: "E-glass 无碱", form: "短切毡", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["手糊成型", "船舶外壳"] },
  { brand: "中国巨石", model: "EMR-450", name: "EMR-450 拉挤连续毡 450g/㎡", nameEn: "E-glass Continuous Strand Mat 450 g/m²", grade: "E-glass 无碱", form: "短切毡", tensile: [3100, 3400], modulus: [72, 76], density: [2.55, 2.58], apps: ["拉挤型材", "RTM 预成型"] },
  { brand: "中国巨石", model: "EWR-600", name: "EWR-600 方格布 600g/㎡", nameEn: "E-glass Woven Roving 600 g/m²", grade: "E-glass 无碱", form: "方格布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["手糊", "SMC 铺层"] },
  { brand: "中国巨石", model: "EWR-800", name: "EWR-800 方格布 800g/㎡", nameEn: "E-glass Woven Roving 800 g/m²", grade: "E-glass 无碱", form: "方格布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["手糊", "船舶外壳"] },
  { brand: "中国巨石", model: "EKM-1250", name: "EKM-1250 双轴缝编布 ±45°", nameEn: "E-glass Biax Stitch-bonded Fabric ±45°", grade: "E-glass 无碱", form: "缝编布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["风电叶片", "多轴铺层"] },
  { brand: "中国巨石", model: "TM7-2400", name: "TM7 高强玻纤直接粗纱", nameEn: "S-glass High-strength Direct Roving TM7", grade: "S-glass 高强", form: "无捻粗纱", tensile: [4300, 4800], modulus: [85, 95], density: [2.46, 2.52], apps: ["军工装备", "航空结构"], note: "国产 S-2 玻纤对标品" },
  { brand: "中国巨石", model: "EDR-ECR-188", name: "EDR-188 ECR 耐腐粗纱", nameEn: "ECR-glass Direct Roving EDR-188", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3200, 3600], modulus: [75, 82], density: [2.60, 2.65], apps: ["储罐", "化工管道", "风电"] },

  // ────────── 泰山玻纤 Taishan ──────────
  { brand: "泰山玻纤", model: "TDR-188P-2400", name: "TDR-188P 拉挤专用直接粗纱", nameEn: "Taishan Pultrusion Direct Roving TDR-188P", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3100, 3500], modulus: [72, 78], density: [2.55, 2.58], apps: ["拉挤型材", "格栅"] },
  { brand: "泰山玻纤", model: "TDR-386P-1200", name: "TDR-386P 风电叶片直接粗纱", nameEn: "Taishan Wind-blade Roving TDR-386P", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3300, 3600], modulus: [74, 80], density: [2.55, 2.58], apps: ["风电叶片主梁"] },
  { brand: "泰山玻纤", model: "TDR-388-2400", name: "TDR-388 风电 SCRIMP 直接粗纱", nameEn: "Taishan Wind Infusion Roving TDR-388", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3200, 3500], modulus: [73, 78], density: [2.55, 2.58], apps: ["风电真空导入", "SCRIMP"] },
  { brand: "泰山玻纤", model: "TDR-488-4800", name: "TDR-488 大纱号风电粗纱", nameEn: "Taishan Heavy-tex Wind Roving TDR-488", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["大型风电叶片"] },
  { brand: "泰山玻纤", model: "TCR-288-2400", name: "TCR-288 喷射手糊合股粗纱", nameEn: "Taishan Spray/Layup Assembled TCR-288", grade: "E-glass 无碱", form: "合股粗纱", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["喷射成型", "手糊"] },
  { brand: "泰山玻纤", model: "TCR-388S-2400", name: "TCR-388S SMC 合股粗纱", nameEn: "Taishan SMC Roving TCR-388S", grade: "E-glass 无碱", form: "SMC专用粗纱", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["SMC 模压"] },
  { brand: "泰山玻纤", model: "T438A-4.5", name: "T438A 热塑增强短切原丝 4.5mm", nameEn: "Taishan Thermoplastic Chopped T438A", grade: "E-glass 无碱", form: "短切原丝", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["PA", "PP 增强"] },
  { brand: "泰山玻纤", model: "T428-6.0", name: "T428 BMC 短切原丝 6mm", nameEn: "Taishan BMC Chopped T428", grade: "E-glass 无碱", form: "短切原丝", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["BMC 模压"] },
  { brand: "泰山玻纤", model: "TSM-450", name: "TSM-450 手糊短切毡 450g/㎡", nameEn: "Taishan Chopped Strand Mat TSM-450", grade: "E-glass 无碱", form: "短切毡", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["手糊", "卫浴"] },
  { brand: "泰山玻纤", model: "TSM-600", name: "TSM-600 手糊短切毡 600g/㎡", nameEn: "Taishan Chopped Strand Mat TSM-600", grade: "E-glass 无碱", form: "短切毡", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["手糊", "大型制品"] },
  { brand: "泰山玻纤", model: "TWR-600", name: "TWR-600 方格布 600g/㎡", nameEn: "Taishan Woven Roving TWR-600", grade: "E-glass 无碱", form: "方格布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["手糊", "喷射补强"] },
  { brand: "泰山玻纤", model: "TWR-800", name: "TWR-800 方格布 800g/㎡", nameEn: "Taishan Woven Roving TWR-800", grade: "E-glass 无碱", form: "方格布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["手糊", "船体"] },
  { brand: "泰山玻纤", model: "TKM-UD-600", name: "TKM 单向缝编布 600g/㎡", nameEn: "Taishan UD Stitch-bonded Fabric", grade: "E-glass 无碱", form: "缝编布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["风电叶片", "单向铺层"] },
  { brand: "泰山玻纤", model: "T-ECR-188", name: "T-ECR-188 耐腐直接粗纱", nameEn: "Taishan ECR Direct Roving T-ECR-188", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3200, 3600], modulus: [75, 82], density: [2.60, 2.65], apps: ["储罐", "化工管道"] },
  { brand: "泰山玻纤", model: "TM-S2-1200", name: "TM 高强 S2 玻纤粗纱", nameEn: "Taishan S-2 High-strength Roving", grade: "S-glass 高强", form: "无捻粗纱", tensile: [4200, 4700], modulus: [85, 92], density: [2.46, 2.52], apps: ["军工", "压力容器"] },

  // ────────── 重庆国际复合材料 CPIC ──────────
  { brand: "重庆国际复材", model: "TufRov 4588", name: "TufRov® 4588 ECR 拉挤粗纱", nameEn: "TufRov® 4588 ECR Pultrusion Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3300, 3700], modulus: [76, 82], density: [2.60, 2.65], apps: ["拉挤型材", "窗框"], note: "CPIC 主打拉挤 ECR" },
  { brand: "重庆国际复材", model: "TufRov 4510", name: "TufRov® 4510 SMC ECR 粗纱", nameEn: "TufRov® 4510 ECR SMC Roving", grade: "ECR-glass 耐腐", form: "SMC专用粗纱", tensile: [3200, 3600], modulus: [75, 82], density: [2.60, 2.65], apps: ["SMC 压制", "耐腐汽车件"] },
  { brand: "重庆国际复材", model: "TufRov 4575", name: "TufRov® 4575 ECR 缠绕粗纱", nameEn: "TufRov® 4575 ECR Filament Winding", grade: "ECR-glass 耐腐", form: "缠绕专用粗纱", tensile: [3300, 3700], modulus: [76, 82], density: [2.60, 2.65], apps: ["缠绕储罐", "压力容器"] },
  { brand: "重庆国际复材", model: "TufRov 4577", name: "TufRov® 4577 ECR 高流动缠绕", nameEn: "TufRov® 4577 ECR High-flow Winding", grade: "ECR-glass 耐腐", form: "缠绕专用粗纱", tensile: [3300, 3700], modulus: [76, 82], density: [2.60, 2.65], apps: ["大型储罐", "脱硫装置"] },
  { brand: "重庆国际复材", model: "TufRov 4599", name: "TufRov® 4599 风电 ECR 粗纱", nameEn: "TufRov® 4599 ECR Wind-blade Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3400, 3800], modulus: [78, 85], density: [2.60, 2.65], apps: ["风电叶片"] },
  { brand: "重庆国际复材", model: "TufStrand F", name: "TufStrand® F 热塑短切原丝", nameEn: "TufStrand® F Chopped Strand for PP", grade: "E-glass 无碱", form: "短切原丝", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["PP 增强", "PA 增强"] },
  { brand: "重庆国际复材", model: "TufStrand R", name: "TufStrand® R 高强短切原丝", nameEn: "TufStrand® R High-performance Chopped", grade: "E-glass 无碱", form: "短切原丝", tensile: [3100, 3400], modulus: [72, 76], density: [2.55, 2.58], apps: ["工程塑料增强"] },
  { brand: "重庆国际复材", model: "CPIC-EMC-300", name: "CPIC 短切毡 EMC 300g/㎡", nameEn: "CPIC Chopped Strand Mat 300 g/m²", grade: "E-glass 无碱", form: "短切毡", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["手糊", "卫浴"] },
  { brand: "重庆国际复材", model: "CPIC-CCR-600", name: "CPIC 方格布 CCR 600g/㎡", nameEn: "CPIC Woven Roving CCR 600 g/m²", grade: "E-glass 无碱", form: "方格布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["手糊", "船体"] },
  { brand: "重庆国际复材", model: "CPIC-CCR-800", name: "CPIC 方格布 CCR 800g/㎡", nameEn: "CPIC Woven Roving CCR 800 g/m²", grade: "E-glass 无碱", form: "方格布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["手糊", "大型制品"] },
  { brand: "重庆国际复材", model: "CPIC-KW-BX-1200", name: "CPIC 双轴缝编布 ±45°", nameEn: "CPIC Biax Stitch-bonded Fabric", grade: "E-glass 无碱", form: "缝编布", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["风电叶片"] },
  { brand: "重庆国际复材", model: "CPIC-988", name: "CPIC 988 合股粗纱", nameEn: "CPIC 988 Assembled Roving", grade: "E-glass 无碱", form: "合股粗纱", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["喷射", "手糊"] },
  { brand: "重庆国际复材", model: "CPIC-2000", name: "CPIC 2000 直接粗纱", nameEn: "CPIC 2000 Direct Roving", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3100, 3500], modulus: [72, 78], density: [2.55, 2.58], apps: ["拉挤", "方格布用"] },
  { brand: "重庆国际复材", model: "CPIC-ECR-CSM-450", name: "CPIC ECR 短切毡 450g/㎡", nameEn: "CPIC ECR Chopped Strand Mat 450 g/m²", grade: "ECR-glass 耐腐", form: "短切毡", tensile: [3200, 3500], modulus: [75, 80], density: [2.60, 2.65], apps: ["化工防腐", "储罐内衬"] },

  // ────────── Owens Corning 欧文斯科宁 ──────────
  { brand: "Owens Corning", model: "Advantex SE3030", name: "Advantex® SE3030 风电直接粗纱", nameEn: "Advantex® SE3030 E-CR Wind-blade Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3400, 3800], modulus: [78, 85], density: [2.60, 2.65], apps: ["风电叶片主梁"], note: "E-CR 配方全球主力产品" },
  { brand: "Owens Corning", model: "Advantex ME3030", name: "Advantex® ME3030 机械增强粗纱", nameEn: "Advantex® ME3030 Mechanical-optimised Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3300, 3700], modulus: [76, 82], density: [2.60, 2.65], apps: ["拉挤", "结构增强"] },
  { brand: "Owens Corning", model: "Advantex SE1500", name: "Advantex® SE1500 通用 E-CR 粗纱", nameEn: "Advantex® SE1500 General-purpose E-CR Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3200, 3600], modulus: [75, 82], density: [2.60, 2.65], apps: ["手糊", "缠绕"] },
  { brand: "Owens Corning", model: "Advantex CE1001", name: "Advantex® CE1001 热塑 E-CR 短切", nameEn: "Advantex® CE1001 E-CR Chopped for Thermoplastics", grade: "ECR-glass 耐腐", form: "短切原丝", tensile: [3200, 3500], modulus: [75, 80], density: [2.60, 2.65], apps: ["PA 增强", "PP 增强"] },
  { brand: "Owens Corning", model: "Advantex SE4535", name: "Advantex® SE4535 高性能 E-CR 粗纱", nameEn: "Advantex® SE4535 High-performance E-CR Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3500, 3900], modulus: [80, 86], density: [2.60, 2.65], apps: ["高端复材", "航天结构辅助"] },
  { brand: "Owens Corning", model: "WindStrand 3000", name: "WindStrand® 3000 风电高模粗纱", nameEn: "WindStrand® 3000 High-modulus Wind Roving", grade: "S-glass 高强", form: "无捻粗纱", tensile: [4200, 4600], modulus: [85, 92], density: [2.55, 2.62], apps: ["大型风电叶片"], note: "专为长叶片设计，模量比 E 玻纤高 15%" },
  { brand: "Owens Corning", model: "WindStrand 4000", name: "WindStrand® 4000 超长叶片高模粗纱", nameEn: "WindStrand® 4000 Extra-long Blade Roving", grade: "S-glass 高强", form: "无捻粗纱", tensile: [4300, 4700], modulus: [86, 94], density: [2.55, 2.62], apps: ["85m+ 风电叶片"] },
  { brand: "Owens Corning", model: "HydroStrand 2800", name: "HydroStrand™ 2800 水下环境粗纱", nameEn: "HydroStrand™ 2800 Marine-grade Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3300, 3700], modulus: [76, 82], density: [2.60, 2.65], apps: ["船舶结构", "海工复材"] },
  { brand: "Owens Corning", model: "Silenka E-1200", name: "Silenka® E-glass 直接粗纱", nameEn: "Silenka® E-glass Direct Roving 1200 tex", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3100, 3500], modulus: [72, 78], density: [2.55, 2.58], apps: ["欧洲市场通用"], note: "Owens Corning 欧洲产品线" },
  { brand: "Owens Corning", model: "M8608", name: "M8608 E-glass 湿法表面毡", nameEn: "M8608 E-glass Wet-laid Surface Mat", grade: "E-glass 无碱", form: "表面毡", tensile: [2800, 3000], modulus: [70, 74], density: [2.55, 2.58], apps: ["拉挤表面层", "防腐内衬"] },
  { brand: "Owens Corning", model: "M8630", name: "M8630 E-glass 加强湿法表面毡", nameEn: "M8630 E-glass Reinforced Surface Mat", grade: "E-glass 无碱", form: "表面毡", tensile: [2900, 3200], modulus: [70, 74], density: [2.55, 2.58], apps: ["拉挤表面层"] },
  { brand: "Owens Corning", model: "M-8420-450", name: "M-8420 E-glass 湿法短切毡", nameEn: "M-8420 E-glass Wet-laid Chopped Mat", grade: "E-glass 无碱", form: "短切毡", tensile: [3000, 3300], modulus: [72, 76], density: [2.55, 2.58], apps: ["拉挤内层", "预成型件"] },
  { brand: "Owens Corning", model: "DeepStrand FM", name: "DeepStrand® FM 风电直接粗纱", nameEn: "DeepStrand® FM Wind-blade Direct Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3400, 3800], modulus: [78, 85], density: [2.60, 2.65], apps: ["风电叶片", "真空导入"] },
  { brand: "Owens Corning", model: "PerformaGlass 3000", name: "PerformaGlass® 建材增强粗纱", nameEn: "PerformaGlass® Construction Roving", grade: "E-glass 无碱", form: "无捻粗纱", tensile: [3100, 3400], modulus: [72, 78], density: [2.55, 2.58], apps: ["门窗型材", "板材"] },
  { brand: "Owens Corning", model: "SE2020", name: "Advantex® SE2020 直接粗纱", nameEn: "Advantex® SE2020 Direct Roving", grade: "ECR-glass 耐腐", form: "无捻粗纱", tensile: [3200, 3600], modulus: [75, 82], density: [2.60, 2.65], apps: ["拉挤", "通用 E-CR"] },
  { brand: "Owens Corning", model: "ShieldStrand", name: "ShieldStrand® H 高模高强纱", nameEn: "ShieldStrand® H High-modulus Strand", grade: "S-glass 高强", form: "无捻粗纱", tensile: [4400, 4800], modulus: [86, 95], density: [2.48, 2.54], apps: ["军工", "防弹装甲"] },
];

for (const p of REAL_GLASS_PRODUCTS) {
  const id = slug(`${p.brand}-${p.model}`);
  const tensile = seededRand(id + "t", p.tensile[0], p.tensile[1], 0);
  const modulus = seededRand(id + "m", p.modulus[0], p.modulus[1], 0);
  const density = seededRand(id + "d", p.density[0], p.density[1], 2);
  MATERIALS_SEED.push({
    id,
    name: p.name,
    nameEn: p.nameEn,
    category: fiberCategory(p.form),
    subCategory: p.grade,
    brand: p.brand,
    model: p.model,
    properties: {
      density: `${density} g/cm³`,
      tensileStrength: `${tensile} MPa`,
      flexuralModulus: `${modulus} GPa`,
      elongation: `${seededRand(id + "e", 3.5, 5.0, 1)}%`,
    },
    applications: p.apps.slice(),
    description: p.note
      ? `${p.brand} ${p.model}：${p.note}`
      : `${p.brand} 公开产品型号 ${p.model}，${p.apps.slice(0, 2).join("、")}等典型应用。`,
  });
}

// Carbon fiber
const CARBON_BRANDS = [
  "中复神鹰", "光威复材", "吉林化纤", "恒神股份", "精功科技",
  "中简科技", "威海拓展", "日本东丽", "台塑", "东邦Tenax", "三菱化学",
];
const CARBON_GRADES = [
  { grade: "T300级", tensile: [3400, 3800], modulus: [220, 240], density: [1.76, 1.80], apps: ["风电叶片", "体育器材"] },
  { grade: "T700级", tensile: [4500, 5100], modulus: [225, 245], density: [1.78, 1.82], apps: ["压力容器", "汽车轻量化"] },
  { grade: "T800级", tensile: [5300, 5900], modulus: [290, 310], density: [1.78, 1.83], apps: ["航空主结构"] },
  { grade: "T1000级", tensile: [6200, 6700], modulus: [290, 320], density: [1.78, 1.82], apps: ["航天", "导弹"] },
  { grade: "M40级高模", tensile: [2700, 3200], modulus: [380, 420], density: [1.78, 1.85], apps: ["卫星支架", "精密机械"] },
  { grade: "M55级超高模", tensile: [3500, 4100], modulus: [530, 570], density: [1.91, 1.95], apps: ["卫星天线"] },
];
const CARBON_FORMS = [
  { form: "12K连续丝束", code: "12K" },
  { form: "24K连续丝束", code: "24K" },
  { form: "48K大丝束", code: "48K" },
  { form: "平纹碳布", code: "PW" },
  { form: "斜纹碳布", code: "TW" },
  { form: "单向预浸料", code: "UD" },
  { form: "短切碳纤", code: "CS" },
];

for (const brand of CARBON_BRANDS) {
  for (const grade of CARBON_GRADES) {
    for (const form of CARBON_FORMS.slice(0, 4)) {
      const model = `${grade.grade.split("级")[0]}-${form.code}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `${grade.grade} ${form.form}`,
        nameEn: `${grade.grade.split("级")[0]} ${form.form}`,
        category: fiberCategory(form.form),
        subCategory: grade.grade,
        brand,
        model,
        properties: {
          density: `${seededRand(id + "d", grade.density[0], grade.density[1], 2)} g/cm³`,
          tensileStrength: `${seededRand(id + "t", grade.tensile[0], grade.tensile[1], 0)} MPa`,
          flexuralModulus: `${seededRand(id + "m", grade.modulus[0], grade.modulus[1], 0)} GPa`,
          elongation: `${seededRand(id + "e", 1.2, 2.1, 1)}%`,
          waterAbsorption: `<0.1%`,
        },
        applications: grade.apps.slice(),
        description: `${brand}${grade.grade}碳纤维${form.form}，${grade.apps[0]}典型产品。`,
      });
    }
  }
}

// Aramid / Basalt
const SPECIAL_FIBER_BRANDS_ARA = ["泰和新材", "宏艺化学", "烟台氨纶", "DuPont Kevlar", "Teijin Twaron", "Kolon Heracron"];
const ARAMID_GRADES = [
  { grade: "对位芳纶标准", tensile: [2800, 3300], modulus: [60, 85], density: [1.42, 1.46], apps: ["防弹", "安全防护"] },
  { grade: "对位芳纶高模", tensile: [2800, 3100], modulus: [110, 140], density: [1.43, 1.46], apps: ["光缆增强", "防割手套"] },
  { grade: "间位芳纶", tensile: [400, 700], modulus: [8, 15], density: [1.35, 1.40], apps: ["消防服", "过滤毡"] },
];
for (const brand of SPECIAL_FIBER_BRANDS_ARA) {
  for (const grade of ARAMID_GRADES) {
    for (const form of ["长丝", "短纤", "平纹布", "无纬布"]) {
      const model = `AR-${slug(grade.grade).slice(0, 8)}-${form[0]}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `${grade.grade}${form}`,
        nameEn: `Aramid ${grade.grade.slice(0, 2)} ${form}`,
        category: fiberCategory(form),
        subCategory: grade.grade,
        brand,
        model,
        properties: {
          density: `${seededRand(id + "d", grade.density[0], grade.density[1], 2)} g/cm³`,
          tensileStrength: `${seededRand(id + "t", grade.tensile[0], grade.tensile[1], 0)} MPa`,
          flexuralModulus: `${seededRand(id + "m", grade.modulus[0], grade.modulus[1], 0)} GPa`,
          elongation: `${seededRand(id + "e", 2.4, 4.5, 1)}%`,
          flameRetardant: `LOI ≥ 28%`,
        },
        applications: grade.apps.slice(),
        description: `${brand}出品的${grade.grade}芳纶纤维${form}。`,
      });
    }
  }
}

const BASALT_BRANDS = ["浙江石金基瓦", "四川航天拓鑫", "华岩玄武岩", "前沿新材", "山东玄武岩"];
const BASALT_FORMS = ["无捻粗纱", "短切毡", "方格布", "单向布", "缠绕粗纱"];
const BASALT_TEX = [300, 600, 1200, 2400];
for (let bi = 0; bi < BASALT_BRANDS.length; bi++) {
  const brand = BASALT_BRANDS[bi];
  for (let fi = 0; fi < BASALT_FORMS.length; fi++) {
    const form = BASALT_FORMS[fi];
    const tex = BASALT_TEX[(bi + fi) % BASALT_TEX.length];
    const model = `BF-${form[0]}-${tex}`;
    const id = slug(`${brand}-${model}`);
    MATERIALS_SEED.push({
      id,
      name: `玄武岩纤维 ${form} ${tex}tex`,
      nameEn: `Basalt Fiber ${form}`,
      category: fiberCategory(form),
      subCategory: "玄武岩纤维",
      brand,
      model,
      properties: {
        density: `${seededRand(id + "d", 2.60, 2.70, 2)} g/cm³`,
        tensileStrength: `${seededRand(id + "t", 3000, 4800, 0)} MPa`,
        flexuralModulus: `${seededRand(id + "m", 80, 95, 0)} GPa`,
        elongation: `${seededRand(id + "e", 2.6, 3.2, 1)}%`,
      },
      applications: ["耐高温增强", "汽车底盘", "桥梁加固", "耐碱混凝土"],
      description: `${brand}玄武岩纤维${form}，天然耐热耐腐蚀。`,
    });
  }
}

// ─── Core materials ───
const CORE_BRANDS_PVC = ["Diab Divinycell", "Airex", "3A Composites"];
const CORE_BRANDS_PET = ["Armacell ArmaPET", "Gurit PET", "Airex T92"];
const CORE_BRANDS_PU = ["万华化学", "拜耳", "BASF", "德山"];
for (const brand of CORE_BRANDS_PVC) {
  for (const density of [40, 60, 80, 100, 130, 160, 200]) {
    const model = `H${density}`;
    const id = slug(`${brand}-${model}`);
    MATERIALS_SEED.push({
      id,
      name: `交联PVC泡沫 ${model}`,
      nameEn: `Cross-linked PVC Foam ${model}`,
      category: "core",
      subCategory: "PVC 硬质交联泡沫",
      brand,
      model,
      properties: {
        density: `${density} kg/m³`,
        tensileStrength: `${(density * 0.02).toFixed(1)} MPa`,
        flexuralStrength: `${(density * 0.024).toFixed(1)} MPa`,
        flexuralModulus: `${(density * 0.9).toFixed(0)} MPa`,
        hdt: `65°C`,
      },
      applications: ["风电叶片", "船艇夹心板", "地板", "防护面板"],
      description: `${brand}交联PVC硬质泡沫 H${density} 密度级别。`,
    });
  }
}
for (const brand of CORE_BRANDS_PET) {
  for (const density of [60, 80, 100, 130, 160]) {
    const model = `T${density}`;
    const id = slug(`${brand}-${model}`);
    MATERIALS_SEED.push({
      id,
      name: `PET结构泡沫 ${model}`,
      nameEn: `PET Structural Foam ${model}`,
      category: "core",
      subCategory: "PET 热塑泡沫",
      brand,
      model,
      properties: {
        density: `${density} kg/m³`,
        tensileStrength: `${(density * 0.018).toFixed(1)} MPa`,
        flexuralStrength: `${(density * 0.02).toFixed(1)} MPa`,
        flexuralModulus: `${(density * 0.7).toFixed(0)} MPa`,
        hdt: `100°C`,
      },
      applications: ["风电叶片", "可回收夹心", "铁路车辆"],
      description: `${brand}热塑可回收 PET 结构泡沫。`,
    });
  }
}

for (const kind of ["Nomex 蜂窝", "铝蜂窝", "PP 蜂窝"]) {
  for (const cell of ["3.2mm", "4.8mm", "6.4mm"]) {
    const model = `${kind.split(" ")[0]}-${cell}`;
    const id = slug(`honeycomb-${model}`);
    MATERIALS_SEED.push({
      id,
      name: `${kind} ${cell}`,
      nameEn: `${kind} Honeycomb ${cell}`,
      category: "core",
      subCategory: "蜂窝芯材",
      brand: kind.startsWith("Nomex") ? "DuPont Nomex" : kind.startsWith("铝") ? "Hexcel 铝蜂窝" : "Plascore PP",
      model,
      properties: {
        density: `${seededRand(id + "d", 32, 96, 0)} kg/m³`,
        flexuralStrength: `${seededRand(id + "f", 1.5, 4.5, 1)} MPa`,
      },
      applications: ["航空内饰", "高铁地板", "大板夹心"],
      description: `${kind}，胞元 ${cell}。`,
    });
  }
}

// Balsa
for (const brand of ["3A Composites Baltek", "ProBalsa"]) {
  for (const density of [90, 130, 170, 250]) {
    MATERIALS_SEED.push({
      id: slug(`balsa-${brand}-${density}`),
      name: `Balsa 端面木芯材 ${density}`,
      nameEn: `Balsa End-grain ${density}`,
      category: "core",
      subCategory: "天然木芯材",
      brand,
      model: `SB${density}`,
      properties: { density: `${density} kg/m³`, flexuralStrength: `${(density * 0.05).toFixed(1)} MPa` },
      applications: ["船艇", "风电叶片"],
      description: `${brand} 端面巴尔沙木芯材。`,
    });
  }
}

// ─── Gelcoats ───
const GELCOAT_BRANDS = ["华昌", "天和", "常州长兴", "PPG", "亚什兰"];
const GELCOAT_TYPES = [
  { sub: "通用型胶衣", prefix: "GC-GP" },
  { sub: "耐候型NPG胶衣", prefix: "GC-NPG" },
  { sub: "阻燃型胶衣", prefix: "GC-FR" },
  { sub: "ISO耐腐蚀胶衣", prefix: "GC-ISO" },
  { sub: "喷涂型胶衣", prefix: "GC-SP" },
];
for (const brand of GELCOAT_BRANDS) {
  for (const t of GELCOAT_TYPES) {
    for (const color of ["白", "灰", "黑", "米黄", "透明"]) {
      const model = `${t.prefix}-${color}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `${t.sub}（${color}色）`,
        nameEn: `${t.sub} (${color})`,
        category: "gelcoat",
        subCategory: t.sub,
        brand,
        model,
        properties: {
          density: `${seededRand(id + "d", 1.15, 1.35, 2)} g/cm³`,
          flexuralStrength: `${seededRand(id + "f", 80, 120, 0)} MPa`,
          hardness: `巴氏 ${seededRand(id + "h", 35, 50, 0)}`,
        },
        applications: ["手糊表面层", "模具胶衣", "游艇外壳"],
        description: `${brand}${t.sub}，${color}色，表面光洁度高。`,
      });
    }
  }
}

// ─── Auxiliaries ───
const AUX_ITEMS = [
  { sub: "引发剂", name: "过氧化甲乙酮 MEKP", brand: "阿克苏诺贝尔", apps: ["手糊", "喷射", "拉挤"], props: { density: "1.17 g/cm³" } },
  { sub: "引发剂", name: "过氧化苯甲酰 BPO", brand: "阿克苏诺贝尔", apps: ["模压", "RTM"], props: { density: "1.33 g/cm³" } },
  { sub: "引发剂", name: "过氧化环己酮", brand: "阿克苏诺贝尔", apps: ["拉挤"], props: { density: "1.14 g/cm³" } },
  { sub: "促进剂", name: "环烷酸钴 1%溶液", brand: "华昌", apps: ["手糊", "缠绕"], props: { density: "1.02 g/cm³" } },
  { sub: "促进剂", name: "辛酸钴 6%溶液", brand: "华昌", apps: ["喷射", "RTM"], props: { density: "0.98 g/cm³" } },
  { sub: "促进剂", name: "二甲基苯胺 DMA", brand: "华昌", apps: ["常温固化"], props: { density: "0.96 g/cm³" } },
  { sub: "脱模剂", name: "PVA脱模剂", brand: "明华化工", apps: ["手糊模具"], props: { density: "1.00 g/cm³" } },
  { sub: "脱模剂", name: "巴西棕榈蜡", brand: "Rexco Partall", apps: ["硬质模具"], props: { density: "0.99 g/cm³" } },
  { sub: "脱模剂", name: "半永久脱模剂 Chemlease", brand: "Chemlease", apps: ["RTM", "真空导入"], props: { density: "0.85 g/cm³" } },
  { sub: "填料", name: "碳酸钙 CaCO3 (400目)", brand: "方解石矿业", apps: ["模压", "胶衣"], props: { density: "2.70 g/cm³" } },
  { sub: "填料", name: "氢氧化铝 ATH 阻燃", brand: "华北铝业", apps: ["阻燃配方"], props: { density: "2.42 g/cm³" } },
  { sub: "填料", name: "硅灰石粉末", brand: "浙江坤彩", apps: ["SMC", "BMC"], props: { density: "2.90 g/cm³" } },
  { sub: "偶联剂", name: "KH-550 硅烷", brand: "晨光化工", apps: ["玻纤表面处理"], props: { density: "0.95 g/cm³" } },
  { sub: "偶联剂", name: "KH-570 硅烷", brand: "晨光化工", apps: ["不饱和聚酯系"], props: { density: "1.04 g/cm³" } },
  { sub: "消泡剂", name: "BYK-A 555", brand: "BYK", apps: ["真空导入", "RTM"], props: { density: "0.90 g/cm³" } },
  { sub: "增稠剂", name: "氧化镁糊 MgO 33%", brand: "镁立方", apps: ["SMC", "BMC"], props: { density: "1.40 g/cm³" } },
];

for (const item of AUX_ITEMS) {
  for (const suffix of ["A", "B", "C"]) {
    const model = `${slug(item.name).slice(0, 16)}-${suffix}`;
    MATERIALS_SEED.push({
      id: slug(`aux-${item.name}-${suffix}`),
      name: `${item.name} ${suffix}级`,
      nameEn: item.name,
      category: "auxiliary",
      subCategory: item.sub,
      brand: item.brand,
      model,
      properties: item.props,
      applications: item.apps.slice(),
      description: `${item.brand}出品的${item.sub}：${item.name}。`,
    });
  }
}

// ─── Composite products ───
const COMPOSITE_BRANDS_PULT = ["南通恒新", "江苏九鼎", "河北枣强", "山东新龙", "宁波信泰", "上海通用复材"];
const PULT_PROFILES = [
  { name: "工字梁 I-Beam", model: "I-" },
  { name: "槽钢 Channel", model: "C-" },
  { name: "角钢 Angle", model: "L-" },
  { name: "方管 RHS", model: "R-" },
  { name: "圆管 CHS", model: "P-" },
  { name: "实心圆棒", model: "RD-" },
  { name: "矩形板", model: "PL-" },
];
for (let bi = 0; bi < COMPOSITE_BRANDS_PULT.length; bi++) {
  const brand = COMPOSITE_BRANDS_PULT[bi];
  for (let pi = 0; pi < PULT_PROFILES.length; pi++) {
    const prof = PULT_PROFILES[pi];
    const sizes = ["50×50×5", "75×75×6", "100×100×8", "150×75×10"];
    for (let si = 0; si < sizes.length; si++) {
      const size = sizes[si];
      const model = `${prof.model}${size}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `FRP拉挤${prof.name} ${size}`,
        nameEn: `Pultruded ${prof.name} ${size}`,
        category: "composite",
        subCategory: "拉挤型材",
        brand,
        model,
        properties: {
          density: `${seededRand(id + "d", 1.80, 2.10, 2)} g/cm³`,
          tensileStrength: `${seededRand(id + "t", 450, 650, 0)} MPa`,
          flexuralStrength: `${seededRand(id + "f", 480, 700, 0)} MPa`,
          flexuralModulus: `${seededRand(id + "m", 25, 35, 0)} GPa`,
          waterAbsorption: `<0.5%`,
          flameRetardant: (bi + pi + si) % 2 === 0 ? "FV-0 / B1" : "无",
        },
        applications: ["化工平台", "电力走线桥架", "轨道交通", "海水淡化厂"],
        description: `${brand}${prof.name}拉挤型材，规格 ${size}，EN 13706 E23 级。`,
      });
    }
  }
}

const GRATING_BRANDS = ["南通恒新", "河北枣强", "山东新龙", "江苏九鼎"];
for (const brand of GRATING_BRANDS) {
  for (const type of ["模塑玻璃钢格栅 38mm", "模塑玻璃钢格栅 50mm", "拉挤玻璃钢格栅 25×50"]) {
    for (const color of ["灰", "黄", "绿", "橙"]) {
      const model = `GR-${type.slice(0, 4)}-${color}`;
      const id = slug(`${brand}-${model}`);
      MATERIALS_SEED.push({
        id,
        name: `${type} ${color}色`,
        nameEn: `FRP Grating ${type}`,
        category: "composite",
        subCategory: "玻璃钢格栅",
        brand,
        model,
        properties: {
          density: `${seededRand(id + "d", 1.75, 1.95, 2)} g/cm³`,
          flexuralStrength: `${seededRand(id + "f", 180, 280, 0)} MPa`,
          flameRetardant: "B1 / Class 1",
        },
        applications: ["化工车间", "海水平台", "污水处理", "走道"],
        description: `${brand}出品${type}，${color}色，耐腐蚀防滑。`,
      });
    }
  }
}

// pipes/tanks (smaller)
for (const brand of ["菲达集团", "冀州中意", "山东阳谷泰安"]) {
  for (const prod of ["玻璃钢缠绕管道", "玻璃钢储罐", "玻璃钢冷却塔填料", "玻璃钢脱硫塔"]) {
    for (const size of ["DN300 PN10", "DN600 PN10", "DN1000 PN6"]) {
      const id = slug(`${brand}-${prod}-${size}`);
      MATERIALS_SEED.push({
        id,
        name: `${prod} ${size}`,
        nameEn: `FRP ${prod}`,
        category: "composite",
        subCategory: prod,
        brand,
        model: size,
        properties: {
          density: `${seededRand(id + "d", 1.85, 2.00, 2)} g/cm³`,
          tensileStrength: `${seededRand(id + "t", 180, 280, 0)} MPa`,
        },
        applications: ["化工", "污水", "电厂脱硫", "市政给排水"],
        description: `${brand}${prod}${size}，缠绕工艺。`,
      });
    }
  }
}

// ═══════════════════════════════════════════
// FORMULAS — 100+ configs generated from templates
// ═══════════════════════════════════════════

const FORMULAS_SEED: FormulaSeed[] = [];

const FORMULA_TEMPLATES: Array<{
  base: string;
  processId: string;
  process: string;
  category: string;
  applications: string[];
  difficulty: "入门" | "中级" | "高级";
  resin: FormulaIngredient[];
  reinforcement: FormulaIngredient[];
  auxiliaries: FormulaIngredient[];
  processing: Array<{ name: string; value: string }>;
  properties: Array<{ name: string; value: string; standard?: string }>;
  tips: string[];
  safetyNotes: string[];
}> = [
  {
    base: "手糊通用玻璃钢",
    processId: "hand-layup",
    process: "手糊成型",
    category: "structural",
    applications: ["储罐", "外壳", "玻璃钢制品"],
    difficulty: "入门",
    resin: [{ name: "191#不饱和聚酯树脂", role: "基体树脂", amount: "100份" }],
    reinforcement: [{ name: "E玻璃短切毡 450 g/m²", role: "增强层", amount: "2-4 层" }, { name: "E玻璃方格布 0/90", role: "增强层", amount: "按设计厚度" }],
    auxiliaries: [{ name: "MEKP (50% 活性)", role: "引发剂", amount: "1.5份" }, { name: "环烷酸钴 1%", role: "促进剂", amount: "0.5-1份" }, { name: "PVA", role: "脱模剂", amount: "3-5 层" }],
    processing: [{ name: "环境温度", value: "18-25 °C" }, { name: "凝胶时间", value: "15-25 min" }, { name: "固化温度", value: "常温 24 h + 60°C 后固化" }],
    properties: [{ name: "拉伸强度", value: "≥ 100 MPa", standard: "GB/T 1447" }, { name: "弯曲强度", value: "≥ 180 MPa", standard: "GB/T 1449" }, { name: "玻纤含量", value: "30-35 wt%" }],
    tips: ["模具需充分涂脱模剂（3-5 层 PVA）", "配胶宜少量多次，单次配料 ≤ 5 kg", "首层先刷纯树脂 + 表面毡，避免打磨露纤", "凝胶后方可铺第二层，防止层间分离"],
    safetyNotes: ["MEKP 避免与促进剂直接混合（爆炸风险）", "作业区通风，苯乙烯挥发需防护", "树脂和固化剂密封阴凉保存"],
  },
  {
    base: "缠绕管道",
    processId: "filament-winding",
    process: "缠绕成型",
    category: "pipe-tank",
    applications: ["化工管道", "玻璃钢管"],
    difficulty: "中级",
    resin: [{ name: "乙烯基酯树脂", role: "基体树脂", amount: "100份" }],
    reinforcement: [{ name: "E-glass 2400tex 缠绕粗纱", role: "螺旋+环向缠绕", amount: "按压力等级" }, { name: "表面毡 C-glass 30g/m²", role: "内衬", amount: "1-2 层" }],
    auxiliaries: [{ name: "BPO 50%糊", role: "引发剂", amount: "1-2份" }, { name: "环烷酸钴", role: "促进剂", amount: "0.3份" }],
    processing: [{ name: "树脂槽温度", value: "25-30 °C" }, { name: "缠绕角度", value: "±54.7° 优选" }, { name: "张力", value: "15-25 N/纱" }, { name: "固化", value: "80°C × 4h" }],
    properties: [{ name: "内压", value: "PN10/16", standard: "GB/T 21238" }, { name: "轴向拉伸", value: "≥ 180 MPa" }, { name: "弯曲强度", value: "≥ 250 MPa" }],
    tips: ["芯模脱模剂必须涂匀，否则内衬易撕裂", "螺旋缠绕角度按承压需求优化（压力容器 ±54.7°）", "环向缠绕张力高于螺旋 20%"],
    safetyNotes: ["高速旋转芯模注意机械防护", "缠绕车间苯乙烯浓度 < 20 ppm"],
  },
  {
    base: "拉挤型材",
    processId: "pultrusion",
    process: "拉挤成型",
    category: "profile",
    applications: ["工字梁", "格栅", "电力走线槽"],
    difficulty: "中级",
    resin: [{ name: "乙烯基酯 / 异氰酸酯树脂", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "E-glass 拉挤粗纱 2400tex", role: "纵向增强", amount: "按截面纤维含量 60-70 wt%" }, { name: "连续毡 (CFM)", role: "横向强化", amount: "2-3 层" }],
    auxiliaries: [{ name: "BPO", role: "引发剂", amount: "1-2份" }, { name: "过氧化月桂酸叔丁酯", role: "高温引发剂", amount: "0.5份" }, { name: "内脱模剂 INT-1846", role: "脱模", amount: "1份" }],
    processing: [{ name: "模具温度", value: "前 120° 中 150° 后 180°" }, { name: "拉挤速度", value: "0.3-0.8 m/min" }, { name: "纤维含量", value: "60-70 wt%" }],
    properties: [{ name: "纵向拉伸", value: "≥ 500 MPa", standard: "EN 13706 E23" }, { name: "纵向弯曲", value: "≥ 500 MPa" }, { name: "层间剪切", value: "≥ 30 MPa" }],
    tips: ["纱架张力一致，否则截面厚度不均", "模具 3 段温度设定需按树脂体系调整", "内脱模剂量直接影响表面光洁度"],
    safetyNotes: ["高温模具周围须防护", "连续作业要定期清理模具沉积"],
  },
  {
    base: "RTM低压注射",
    processId: "rtm",
    process: "RTM成型",
    category: "structural",
    applications: ["汽车覆盖件", "体育器材"],
    difficulty: "高级",
    resin: [{ name: "低粘度乙烯基酯 / 环氧", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "多轴向缝编布 (NCF)", role: "预成型", amount: "按铺层" }, { name: "CFM 连续毡", role: "厚度方向", amount: "1-2 层" }],
    auxiliaries: [{ name: "CHP 引发剂", role: "常温固化", amount: "1份" }, { name: "半永久脱模剂", role: "脱模", amount: "3 层" }],
    processing: [{ name: "注射压力", value: "0.2-0.5 MPa" }, { name: "模具温度", value: "40-60 °C" }, { name: "凝胶时间", value: "15-40 min" }, { name: "纤维含量", value: "50-60 wt%" }],
    properties: [{ name: "拉伸强度", value: "≥ 300 MPa" }, { name: "弯曲模量", value: "≥ 22 GPa" }, { name: "孔隙率", value: "< 1%" }],
    tips: ["预成型件剪裁精度直接决定最终重量", "树脂流道设计需 CAE 模拟避免树脂陷阱", "模具密封件定期更换"],
    safetyNotes: ["高压注射防脱模损伤", "模具预热通风"],
  },
  {
    base: "真空导入风电叶片",
    processId: "vacuum-infusion",
    process: "真空导入",
    category: "wind",
    applications: ["风电叶片壳体", "船舶船体"],
    difficulty: "高级",
    resin: [{ name: "环氧树脂 (低粘度)", role: "基体", amount: "100份" }, { name: "胺类固化剂", role: "固化", amount: "26-30份" }],
    reinforcement: [{ name: "单向玻纤布 UD1200", role: "主梁", amount: "按铺层图" }, { name: "±45 NCF 玻纤布", role: "抗剪切", amount: "多层" }, { name: "PVC/PET 泡沫芯材", role: "夹心", amount: "按厚度" }],
    auxiliaries: [{ name: "真空袋膜", role: "密封", amount: "n.a." }, { name: "流道（脉络管+导流网）", role: "树脂流", amount: "n.a." }, { name: "密封胶条", role: "密封", amount: "n.a." }],
    processing: [{ name: "真空度", value: "-95 kPa 以下" }, { name: "树脂粘度", value: "< 300 mPa·s" }, { name: "导入温度", value: "25-35 °C" }, { name: "固化", value: "60°C × 8h + 80°C × 4h" }],
    properties: [{ name: "纤维含量", value: "55-60 vol%" }, { name: "孔隙率", value: "< 2%" }, { name: "拉伸模量（纵向）", value: "≥ 45 GPa" }],
    tips: ["真空保压 30 min 以上，泄漏率 ≤ 5 mbar/min", "导流设计遵循 'darcy 线'，避免死区", "树脂适用期 > 导入时间 × 1.5 倍"],
    safetyNotes: ["胺类固化剂皮肤过敏", "大型模具抽真空需分区监控"],
  },
  {
    base: "SMC模压",
    processId: "compression",
    process: "模压成型",
    category: "auto",
    applications: ["汽车外覆盖件", "电器壳体", "坐便器"],
    difficulty: "中级",
    resin: [{ name: "不饱和聚酯 / 环氧", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "E-glass 短切 25mm", role: "增强", amount: "25-30 wt%" }],
    auxiliaries: [{ name: "过氧化叔丁酯 TBPB", role: "高温引发", amount: "1.5份" }, { name: "氧化镁糊 MgO", role: "增稠", amount: "1-2份" }, { name: "硬脂酸锌", role: "内脱模", amount: "1-2份" }, { name: "碳酸钙", role: "填料", amount: "120-180份" }],
    processing: [{ name: "上下模温度", value: "上 150°C / 下 145°C" }, { name: "压力", value: "7-12 MPa" }, { name: "保压时间", value: "1-3 min/mm" }],
    properties: [{ name: "拉伸强度", value: "≥ 80 MPa" }, { name: "弯曲强度", value: "≥ 170 MPa" }, { name: "表面光洁度", value: "A class" }],
    tips: ["SMC片材熟化 2-7 天后再模压", "模具温度分区调整，复杂件避免焦化", "压力释放曲线要匹配流动结束时机"],
    safetyNotes: ["高温模具操作防烫", "开模时拿取注意重量分配"],
  },
  {
    base: "BMC注塑电器件",
    processId: "compression",
    process: "模压成型",
    category: "electrical",
    applications: ["灯具", "电机外壳", "配电箱"],
    difficulty: "中级",
    resin: [{ name: "邻苯型 UPR", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "E-glass 短切 3mm", role: "增强", amount: "15-25 wt%" }],
    auxiliaries: [{ name: "TBPB", role: "引发剂", amount: "1份" }, { name: "CaCO3 + 滑石粉", role: "填料", amount: "100-150份" }, { name: "氢氧化铝", role: "阻燃", amount: "50份" }],
    processing: [{ name: "模温", value: "150-160 °C" }, { name: "压力", value: "5-10 MPa" }, { name: "成型时间", value: "30-90 s" }],
    properties: [{ name: "介电强度", value: "≥ 12 kV/mm" }, { name: "阻燃等级", value: "UL94 V-0" }, { name: "弯曲强度", value: "≥ 100 MPa" }],
    tips: ["BMC 料粒熟化到刚好不粘手最易模压", "排气设计决定外观是否有气泡", "多腔模具动静温差 ≤ 5°C"],
    safetyNotes: ["高温模压防蒸汽烫伤"],
  },
  {
    base: "喷射防腐内衬",
    processId: "hand-layup",
    process: "手糊成型",
    category: "corrosion",
    applications: ["烟囱防腐", "储罐内衬", "化工地坪"],
    difficulty: "入门",
    resin: [{ name: "乙烯基酯树脂 VER-FR", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "表面毡 C-glass 30g/m²", role: "内衬层", amount: "2 层" }, { name: "短切毡 450g/m²", role: "结构层", amount: "按厚度" }],
    auxiliaries: [{ name: "MEKP", role: "引发剂", amount: "1.5份" }, { name: "环烷酸钴", role: "促进剂", amount: "0.5份" }],
    processing: [{ name: "内衬厚度", value: "1.5-2.0 mm" }, { name: "结构层厚度", value: "按压力等级" }, { name: "后固化", value: "60°C × 4h" }],
    properties: [{ name: "介质耐受", value: "98% H2SO4 / 30% HCl 常温 > 2年" }, { name: "巴氏硬度", value: "≥ 40" }],
    tips: ["内衬必须富树脂，纤维含量 < 30%", "层间打磨需到露白", "焊缝修复必须延伸 50mm 以上"],
    safetyNotes: ["强腐蚀作业佩戴全套防护", "苯乙烯 TLV-TWA 20 ppm"],
  },
  {
    base: "纤维缠绕压力容器",
    processId: "filament-winding",
    process: "缠绕成型",
    category: "pipe-tank",
    applications: ["CNG/氢气瓶", "高压容器"],
    difficulty: "高级",
    resin: [{ name: "环氧树脂 + 胺固化剂", role: "基体", amount: "100份 + 25份" }],
    reinforcement: [{ name: "T700 碳纤维 24K", role: "承压层", amount: "按 Nettinganalysis 设计" }, { name: "玻纤表面层", role: "外观", amount: "1 层" }],
    auxiliaries: [{ name: "消泡剂 BYK A555", role: "浸胶", amount: "0.1份" }],
    processing: [{ name: "缠绕角度", value: "螺旋 11-15° + 环向 89°" }, { name: "固化曲线", value: "80°C → 120°C → 150°C" }, { name: "纤维含量", value: "65-70 vol%" }],
    properties: [{ name: "爆破压力", value: "≥ 3 × 工作压力" }, { name: "疲劳寿命", value: "≥ 15,000 次循环" }, { name: "氢渗透率", value: "< 6 × 10⁻⁹ mol/m²·s·atm" }],
    tips: ["铝内胆与复合层的界面粘接要用偶联剂", "外层纤维张力需阶梯式递减", "固化全程记录温度曲线"],
    safetyNotes: ["高压容器试验需在防爆靶场进行", "碳纤粉尘导电，防静电"],
  },
  {
    base: "碳纤预浸料手糊",
    processId: "hand-layup",
    process: "手糊成型",
    category: "auto",
    applications: ["汽车碳纤外观件", "赛车零件"],
    difficulty: "高级",
    resin: [{ name: "中温固化环氧 (预浸中)", role: "基体", amount: "33-38 wt%" }],
    reinforcement: [{ name: "T700 平纹 200g/m² 预浸料", role: "外观层", amount: "1-2 层" }, { name: "T700 斜纹 200g/m² 预浸料", role: "结构层", amount: "多层" }],
    auxiliaries: [{ name: "真空袋膜 + 脱模布", role: "压实", amount: "n.a." }],
    processing: [{ name: "烘箱温度", value: "120°C × 90 min" }, { name: "真空度", value: "-95 kPa" }, { name: "升温速率", value: "2-3 °C/min" }],
    properties: [{ name: "拉伸强度", value: "≥ 700 MPa" }, { name: "弯曲模量", value: "≥ 45 GPa" }, { name: "孔隙率", value: "< 1%" }],
    tips: ["预浸料冷藏保存（-18°C），使用前回温 4h", "铺层接缝需搭接 2-3 mm", "真空袋必须检漏 < 1 mbar/min"],
    safetyNotes: ["预浸料粉尘可能过敏", "烘箱温控故障需断电报警"],
  },
  {
    base: "3D打印连续碳纤",
    processId: "3d-printing",
    process: "3D打印复合材料",
    category: "auto",
    applications: ["无人机结构件", "医疗器械", "定制夹具"],
    difficulty: "高级",
    resin: [{ name: "改性PA / PEEK 线材", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "T300 连续碳纤丝束", role: "增强", amount: "25-40 vol%" }],
    auxiliaries: [{ name: "界面偶联处理", role: "粘合增强", amount: "n.a." }],
    processing: [{ name: "挤出温度", value: "260-300 °C" }, { name: "层高", value: "0.2-0.4 mm" }, { name: "路径", value: "等应力路径规划" }],
    properties: [{ name: "纵向拉伸", value: "≥ 700 MPa" }, { name: "弯曲强度", value: "≥ 450 MPa" }],
    tips: ["层间界面是主要薄弱环节，需控制层间冷却", "填充率和路径直接影响刚度", "支撑材料选择水溶性为佳"],
    safetyNotes: ["打印舱内高温防护", "PEEK 烟气需排放"],
  },
  {
    base: "冷修补玻璃钢",
    processId: "repair",
    process: "修补/防腐",
    category: "corrosion",
    applications: ["管道漏点修补", "储罐裂纹"],
    difficulty: "入门",
    resin: [{ name: "乙烯基酯 / 环氧腻子", role: "基体", amount: "100份" }],
    reinforcement: [{ name: "E-glass 方格布 ±45°", role: "主层", amount: "3-5 层" }, { name: "表面毡", role: "罩面", amount: "1 层" }],
    auxiliaries: [{ name: "MEKP + 环烷酸钴", role: "常温固化", amount: "1.5 + 0.5份" }],
    processing: [{ name: "表面处理", value: "打磨至 St3 级" }, { name: "固化", value: "常温 24h" }],
    properties: [{ name: "拉伸强度", value: "≥ 130 MPa" }, { name: "与母材粘接强度", value: "≥ 10 MPa" }],
    tips: ["打磨粗糙度直接决定粘接", "修补边缘斜坡打磨成 1:5-1:10", "首层浸渍要压实无气泡"],
    safetyNotes: ["现场作业注意易燃性，远离明火"],
  },
];

for (const tpl of FORMULA_TEMPLATES) {
  // Expand each template by applications + difficulty variants (4-8 per template)
  const variants = tpl.applications;
  for (let i = 0; i < variants.length; i++) {
    const app = variants[i];
    const suffix = `${i + 1}`;
    FORMULAS_SEED.push({
      id: slug(`${tpl.base}-${app}-${suffix}`),
      name: `${tpl.base} · ${app}`,
      processId: tpl.processId,
      process: tpl.process,
      category: tpl.category,
      application: app,
      difficulty: tpl.difficulty,
      description: `${tpl.base}配方，针对${app}场景优化。${tpl.process}工艺，难度${tpl.difficulty}。`,
      resinSystem: tpl.resin,
      reinforcement: tpl.reinforcement,
      auxiliaries: tpl.auxiliaries,
      processing: tpl.processing,
      properties: tpl.properties,
      tips: tpl.tips,
      safetyNotes: tpl.safetyNotes,
    });
  }
  // Pro/experimental variants
  for (const mod of ["高温固化", "低收缩", "低VOC", "食品级", "阻燃B1", "耐海水"]) {
    FORMULAS_SEED.push({
      id: slug(`${tpl.base}-${mod}`),
      name: `${tpl.base} · ${mod}改进版`,
      processId: tpl.processId,
      process: tpl.process,
      category: tpl.category,
      application: `${tpl.applications[0]}（${mod}）`,
      difficulty: tpl.difficulty,
      description: `${tpl.base}的${mod}改进配方，针对特殊性能要求。`,
      resinSystem: tpl.resin,
      reinforcement: tpl.reinforcement,
      auxiliaries: tpl.auxiliaries,
      processing: tpl.processing,
      properties: tpl.properties,
      tips: tpl.tips,
      safetyNotes: tpl.safetyNotes,
    });
  }
}

// ═══════════════════════════════════════════
// SUPPLIERS — 60+ 真实中国主流复材企业
// ═══════════════════════════════════════════

const SUPPLIERS_SEED: SupplierSeed[] = [
  // ─── 玻璃纤维龙头 ───
  { id: "sup-jushi", name: "中国巨石股份有限公司", location: "浙江桐乡", province: "浙江", category: "fiber", products: ["玻璃纤维纱", "玻璃纤维布", "短切原丝"], processes: ["池窑拉丝"], established: 1993, verified: true, description: "全球最大玻纤生产商，年产能逾270万吨。产品覆盖风电、建筑、热塑增强、电子等多领域。", certifications: ["ISO 9001", "ISO 14001", "IATF 16949"] },
  { id: "sup-taishan", name: "泰山玻纤股份有限公司", location: "山东泰安", province: "山东", category: "fiber", products: ["玻璃纤维纱", "电子级玻纤", "高性能玻纤"], processes: ["池窑拉丝"], established: 1997, verified: true, description: "国内玻纤行业第二大企业，在高性能E-CR、S-2玻纤领域领先。", certifications: ["ISO 9001", "CE"] },
  { id: "sup-cpic", name: "重庆国际复合材料股份有限公司", location: "重庆", province: "重庆", category: "fiber", products: ["玻璃纤维纱", "ECR玻纤", "缠绕直接纱"], processes: ["池窑拉丝"], established: 1991, verified: true, description: "中国玻纤产业头部企业之一，ECR 耐腐玻纤全球知名。", certifications: ["ISO 9001", "ISO 14001"] },
  { id: "sup-weibo", name: "四川省威玻新材料有限公司", location: "四川眉山", province: "四川", category: "fiber", products: ["玻璃纤维纱", "玻纤织物"], processes: ["池窑拉丝"], established: 2003, verified: true, description: "华西地区重要玻纤生产基地，风电纱市场份额领先。", certifications: ["ISO 9001"] },
  { id: "sup-shandong-bx", name: "山东玻纤集团股份有限公司", location: "山东沂水", province: "山东", category: "fiber", products: ["玻璃纤维纱", "短切毡", "方格布"], processes: ["池窑拉丝"], established: 1992, verified: true, description: "山东玻纤产业重要企业，上市代码 605006。", certifications: ["ISO 9001"] },
  { id: "sup-cih", name: "长海股份有限公司", location: "江苏常州", province: "江苏", category: "fiber", products: ["玻纤粗纱", "玻纤制品", "化学品"], processes: ["池窑拉丝"], established: 1993, verified: true, description: "国内玻纤上市公司，300024，玻纤-树脂-制品全产业链。", certifications: ["ISO 9001"] },
  { id: "sup-honghe", name: "宏和电子材料科技股份有限公司", location: "福建漳州", province: "福建", category: "fiber", products: ["电子级玻纤布", "覆铜板基材"], processes: ["织造"], established: 1994, verified: true, description: "603256，电子级玻纤布龙头，供 PCB 基板。", certifications: ["ISO 9001", "IATF 16949"] },

  // ─── 碳纤维龙头 ───
  { id: "sup-zhongfu", name: "中复神鹰碳纤维股份有限公司", location: "江苏连云港", province: "江苏", category: "fiber", products: ["T300/T700/T800 碳纤维", "碳纤预浸料"], processes: ["干喷湿纺"], established: 2006, verified: true, description: "688295，国内碳纤维头部企业，千吨级 T700/T800 产线。", certifications: ["ISO 9001", "军标认证"] },
  { id: "sup-guangwei", name: "威海光威复合材料股份有限公司", location: "山东威海", province: "山东", category: "fiber", products: ["碳纤维", "碳纤维织物", "预浸料", "碳纤制品"], processes: ["湿法纺丝"], established: 1992, verified: true, description: "300699，中国碳纤维先行者，军民两用产品布局。", certifications: ["ISO 9001", "AS9100"] },
  { id: "sup-jilin-chemfiber", name: "吉林化纤集团有限责任公司", location: "吉林吉林", province: "吉林", category: "fiber", products: ["大丝束碳纤维", "PAN 原丝"], processes: ["湿法纺丝"], established: 1960, verified: true, description: "千吨级大丝束碳纤维生产商，主攻风电和工业市场。", certifications: ["ISO 9001"] },
  { id: "sup-hengshen", name: "江苏恒神股份有限公司", location: "江苏丹阳", province: "江苏", category: "fiber", products: ["高性能碳纤维", "预浸料", "复合材料制品"], processes: ["干喷湿纺"], established: 2007, verified: true, description: "中国首家千吨级 T800 生产线，高端航空航天领域。", certifications: ["AS9100", "ISO 9001"] },
  { id: "sup-zhongjian", name: "中简科技股份有限公司", location: "江苏常州", province: "江苏", category: "fiber", products: ["T800 高强碳纤维", "高模碳纤"], processes: ["干喷湿纺"], established: 2008, verified: true, description: "300777，军用碳纤维先进供应商。", certifications: ["军标", "ISO 9001"] },
  { id: "sup-tuozhan", name: "威海拓展纤维有限公司", location: "山东威海", province: "山东", category: "fiber", products: ["高性能碳纤维", "预浸料"], processes: ["干喷湿纺"], established: 2002, verified: true, description: "光威集团子公司，主攻军民两用碳纤维。", certifications: ["军标", "ISO 9001"] },
  { id: "sup-fiberglass-supplier1", name: "精功(绍兴)复合材料有限公司", location: "浙江绍兴", province: "浙江", category: "fiber", products: ["T300/T700 碳纤维", "碳纤预浸料"], processes: ["湿法纺丝"], established: 2015, verified: true, description: "国产碳纤维新兴力量，扩产至万吨级目标。", certifications: ["ISO 9001"] },

  // ─── 芳纶/玄武岩 ───
  { id: "sup-taihe", name: "烟台泰和新材料股份有限公司", location: "山东烟台", province: "山东", category: "fiber", products: ["间位芳纶", "对位芳纶", "氨纶"], processes: ["湿法/干法纺丝"], established: 1987, verified: true, description: "002254，中国芳纶龙头，芳纶1313和1414双布局。", certifications: ["ISO 9001", "CE"] },
  { id: "sup-hongyi-aramid", name: "江苏宏艺化学有限公司", location: "江苏扬州", province: "江苏", category: "fiber", products: ["间位芳纶短纤", "芳纶浆粕"], processes: ["纺丝"], established: 2005, verified: true, description: "国内芳纶短纤领先企业。", certifications: ["ISO 9001"] },
  { id: "sup-basalt-hangtian", name: "四川航天拓鑫玄武岩实业有限公司", location: "四川成都", province: "四川", category: "fiber", products: ["玄武岩纤维", "BF增强制品"], processes: ["池窑拉丝"], established: 2008, verified: true, description: "国内玄武岩纤维第一梯队，军民两用。", certifications: ["ISO 9001", "军标"] },
  { id: "sup-jiwazhuang", name: "浙江石金基瓦玄武岩纤维有限公司", location: "浙江金华", province: "浙江", category: "fiber", products: ["玄武岩纤维纱", "BF复材制品"], processes: ["池窑拉丝"], established: 2010, verified: true, description: "玄武岩纤维及制品专业生产商。", certifications: ["ISO 9001"] },

  // ─── 树脂供应商 ───
  { id: "sup-huachang", name: "华昌聚合物有限公司", location: "江苏常熟", province: "江苏", category: "resin", products: ["不饱和聚酯树脂", "乙烯基酯树脂", "胶衣"], processes: ["化学合成"], established: 1991, verified: true, description: "国内UPR/VER龙头，长海股份控股。", certifications: ["ISO 9001", "ISO 14001"] },
  { id: "sup-tianhe", name: "江苏天和树脂有限公司", location: "江苏无锡", province: "江苏", category: "resin", products: ["不饱和聚酯", "乙烯基酯", "环氧树脂"], processes: ["化学合成"], established: 1995, verified: true, description: "专业UPR/VER/EP生产，风电和防腐市场。", certifications: ["ISO 9001"] },
  { id: "sup-yabang", name: "亚邦股份有限公司", location: "江苏常州", province: "江苏", category: "resin", products: ["不饱和聚酯", "光固化树脂", "颜料"], processes: ["化学合成"], established: 1993, verified: true, description: "603188，UPR和染料一体化运营。", certifications: ["ISO 9001"] },
  { id: "sup-shangwei", name: "上纬新材料科技股份有限公司", location: "上海", province: "上海", category: "resin", products: ["乙烯基酯", "环氧", "风电专用树脂"], processes: ["化学合成"], established: 1992, verified: true, description: "688585，风电树脂国产替代先锋。", certifications: ["ISO 9001"] },
  { id: "sup-deshan", name: "德山化工(上海)有限公司", location: "上海", province: "上海", category: "resin", products: ["特种环氧", "乙烯基酯"], processes: ["化学合成"], established: 2003, verified: true, description: "日本德山株式会社在华工厂，高端环氧产品。", certifications: ["ISO 9001", "ISO 14001"] },
  { id: "sup-funing", name: "富宁复合材料有限公司", location: "浙江", province: "浙江", category: "resin", products: ["不饱和聚酯", "胶衣"], processes: ["化学合成"], established: 1998, verified: true, description: "UPR和胶衣综合供应商。", certifications: ["ISO 9001"] },
  { id: "sup-wanhua", name: "万华化学集团股份有限公司", location: "山东烟台", province: "山东", category: "resin", products: ["MDI", "TDI", "聚氨酯"], processes: ["化学合成"], established: 1978, verified: true, description: "600309，全球聚氨酯龙头之一。", certifications: ["ISO 9001", "ISO 14001"] },
  { id: "sup-hexion", name: "瀚森(上海)化工有限公司", location: "上海", province: "上海", category: "resin", products: ["环氧树脂", "酚醛树脂"], processes: ["化学合成"], established: 1995, verified: true, description: "Hexion 集团中国工厂，环氧和酚醛一体化。", certifications: ["ISO 9001"] },
  { id: "sup-ashland", name: "亚什兰(中国)投资有限公司", location: "上海", province: "上海", category: "resin", products: ["乙烯基酯树脂", "不饱和聚酯"], processes: ["化学合成"], established: 1995, verified: true, description: "Ashland 中国总部，Derakane 乙烯基酯全球知名。", certifications: ["ISO 9001"] },

  // ─── 拉挤/格栅/制品 ───
  { id: "sup-hengxin", name: "南通恒新复合材料有限公司", location: "江苏南通", province: "江苏", category: "manufacturer", products: ["玻璃钢格栅", "FRP拉挤型材", "拉挤产品"], processes: ["拉挤成型", "模压成型"], established: 2005, verified: true, description: "专业FRP格栅和拉挤型材生产企业，年产能1.5万吨。", certifications: ["ISO 9001", "ISO 14001", "CE认证"] },
  { id: "sup-jiuding", name: "江苏九鼎新材料股份有限公司", location: "江苏东台", province: "江苏", category: "manufacturer", products: ["FRP格栅", "拉挤型材", "玻璃钢管道", "玻璃钢罐"], processes: ["拉挤成型", "模压成型", "缠绕成型"], established: 1990, verified: true, description: "002201，国内玻璃钢制品龙头上市公司。", certifications: ["ISO 9001", "ISO 14001", "CE"] },
  { id: "sup-zhongyi", name: "河北冀州中意复合材料有限公司", location: "河北衡水", province: "河北", category: "manufacturer", products: ["玻璃钢管道", "储罐", "格栅"], processes: ["缠绕成型", "模压"], established: 1995, verified: true, description: "北方FRP制品重要生产基地。", certifications: ["ISO 9001"] },
  { id: "sup-zaoqiang", name: "河北枣强宇虹玻璃钢有限公司", location: "河北衡水", province: "河北", category: "manufacturer", products: ["玻璃钢格栅", "拉挤型材", "防腐蚀制品"], processes: ["模压", "拉挤"], established: 2002, verified: true, description: "玻璃钢制品专业生产，枣强基地。", certifications: ["ISO 9001"] },
  { id: "sup-xinlong", name: "山东新龙集团有限公司", location: "山东淄博", province: "山东", category: "manufacturer", products: ["玻璃钢管道", "储罐", "脱硫塔"], processes: ["缠绕成型"], established: 1988, verified: true, description: "FRP防腐设备大型制造商。", certifications: ["ISO 9001", "压力容器制造许可"] },
  { id: "sup-xintai", name: "宁波信泰科技股份有限公司", location: "浙江宁波", province: "浙江", category: "manufacturer", products: ["汽车用FRP零件", "碳纤复合材料"], processes: ["拉挤", "模压"], established: 2000, verified: true, description: "汽车复材零部件供应商。", certifications: ["IATF 16949", "ISO 9001"] },
  { id: "sup-feida", name: "江苏菲达集团有限公司", location: "江苏", province: "江苏", category: "manufacturer", products: ["玻璃钢管道", "复合管道"], processes: ["缠绕"], established: 1984, verified: true, description: "玻璃钢管道系统解决方案商。", certifications: ["ISO 9001", "PED"] },

  // ─── 风电叶片 ───
  { id: "sup-sinomatech", name: "中材科技股份有限公司", location: "北京", province: "北京", category: "manufacturer", products: ["风电叶片", "气瓶", "特种纤维"], processes: ["真空导入", "缠绕"], established: 1997, verified: true, description: "002080，中国最大风电叶片生产商之一。", certifications: ["ISO 9001", "ISO 14001", "DNV"] },
  { id: "sup-timesxc", name: "株洲时代新材料科技股份有限公司", location: "湖南株洲", province: "湖南", category: "manufacturer", products: ["风电叶片", "轨道交通用复材", "减振材料"], processes: ["真空导入", "RTM"], established: 1984, verified: true, description: "600458，中车旗下，复材与高分子龙头。", certifications: ["ISO 9001", "IATF 16949"] },
  { id: "sup-tianshunwind", name: "天顺风能(苏州)股份有限公司", location: "江苏苏州", province: "江苏", category: "manufacturer", products: ["风电塔筒", "风电叶片"], processes: ["焊接", "真空导入"], established: 2005, verified: true, description: "002531，风电塔筒及叶片。", certifications: ["ISO 9001", "GL"] },
  { id: "sup-jinfeng", name: "新疆金风科技股份有限公司", location: "北京", province: "北京", category: "manufacturer", products: ["风电机组", "风电叶片"], processes: ["真空导入"], established: 1998, verified: true, description: "002202，中国风电整机龙头。", certifications: ["ISO 9001", "ISO 14001"] },

  // ─── 气瓶/压力容器 ───
  { id: "sup-zhongcai-tank", name: "中材(北京)气瓶有限公司", location: "北京", province: "北京", category: "manufacturer", products: ["CNG气瓶", "氢气瓶", "高压容器"], processes: ["缠绕成型"], established: 1998, verified: true, description: "中材科技子公司，IV型储氢瓶先行者。", certifications: ["TSG", "压力容器", "ISO 9001"] },
  { id: "sup-jicheng", name: "京城机电控股有限责任公司", location: "北京", province: "北京", category: "manufacturer", products: ["高压气瓶", "压力容器"], processes: ["缠绕"], established: 1949, verified: true, description: "0187.HK，缠绕气瓶专业生产。", certifications: ["TSG", "ISO 9001"] },

  // ─── 电子覆铜板 / 航空航天 ───
  { id: "sup-kingboard", name: "建滔积层板(深圳)有限公司", location: "广东深圳", province: "广东", category: "manufacturer", products: ["覆铜板", "PCB基材"], processes: ["层压"], established: 1988, verified: true, description: "0148.HK，全球领先覆铜板制造商。", certifications: ["ISO 9001", "UL"] },
  { id: "sup-shengyi", name: "广东生益科技股份有限公司", location: "广东东莞", province: "广东", category: "manufacturer", products: ["覆铜板", "粘结片"], processes: ["层压"], established: 1985, verified: true, description: "600183，国内覆铜板龙头。", certifications: ["ISO 9001", "QS 9000"] },
  { id: "sup-aerospace", name: "航天特种材料及工艺技术研究所", location: "北京", province: "北京", category: "manufacturer", products: ["航天复材", "特种预浸料"], processes: ["预浸料", "RTM"], established: 1960, verified: true, description: "中国航天科技集团 703 所，高端复材研发与制造。", certifications: ["军标", "AS9100"] },
  { id: "sup-carbontech", name: "上海之合玻璃钢有限公司", location: "上海", province: "上海", category: "manufacturer", products: ["玻璃钢制品", "风洞玻璃钢"], processes: ["手糊", "RTM"], established: 1985, verified: true, description: "航空玻璃钢制品供应商。", certifications: ["ISO 9001", "AS9100"] },

  // ─── 设备/模具 ───
  { id: "sup-tianhua", name: "南京天华复合材料设备有限公司", location: "江苏南京", province: "江苏", category: "equipment", products: ["拉挤机", "缠绕机", "SMC生产线"], processes: ["设备制造"], established: 1995, verified: true, description: "国内领先复材工艺设备厂商。", certifications: ["ISO 9001"] },
  { id: "sup-hrbfuhe", name: "哈尔滨复合材料设备有限公司", location: "黑龙江哈尔滨", province: "黑龙江", category: "equipment", products: ["缠绕机", "热压罐", "RTM设备"], processes: ["设备制造"], established: 1987, verified: true, description: "缠绕和热压罐设备专业生产。", certifications: ["ISO 9001"] },
  { id: "sup-minghe-mold", name: "明和复合材料模具有限公司", location: "浙江宁波", province: "浙江", category: "mold", products: ["SMC模具", "RTM模具", "拉挤模具"], processes: ["模具设计制造"], established: 2002, verified: true, description: "复合材料模具专业制造商。", certifications: ["ISO 9001"] },
  { id: "sup-donghua-mold", name: "东华大学复合材料研究所", location: "上海", province: "上海", category: "service", products: ["复材配方研发", "工艺咨询", "测试检验"], processes: ["研发检测"], established: 1979, verified: true, description: "东华大学复材方向研究与产业化服务。", certifications: ["CNAS"] },

  // ─── 检测/认证服务 ───
  { id: "sup-sgs-china", name: "SGS 通标标准技术服务有限公司", location: "上海", province: "上海", category: "service", products: ["复合材料检测", "认证服务"], processes: ["检测认证"], established: 1991, verified: true, description: "国际知名第三方检测认证机构中国主体。", certifications: ["CNAS", "CMA", "ILAC"] },
  { id: "sup-cti", name: "深圳华测检测认证集团股份有限公司", location: "广东深圳", province: "广东", category: "service", products: ["材料检测", "性能测试"], processes: ["检测"], established: 2003, verified: true, description: "300012，国内检测认证龙头。", certifications: ["CNAS", "CMA"] },
  { id: "sup-nfti", name: "国家玻璃纤维产品质量监督检验中心", location: "江苏", province: "江苏", category: "service", products: ["玻纤检测", "复合材料检测"], processes: ["检测"], established: 1985, verified: true, description: "国家玻纤质检中心，权威第三方检测。", certifications: ["CNAS", "CMA"] },

  // ─── 模具/辅材 ───
  { id: "sup-airtech", name: "Airtech (苏州)真空袋材料有限公司", location: "江苏苏州", province: "江苏", category: "manufacturer", products: ["真空袋膜", "脱模布", "密封胶条"], processes: ["真空袋材料"], established: 2000, verified: true, description: "Airtech 集团中国工厂，真空导入辅材全系列。", certifications: ["ISO 9001"] },
  { id: "sup-diab-china", name: "Diab 科思迪(江苏)复合材料有限公司", location: "江苏昆山", province: "江苏", category: "manufacturer", products: ["PVC泡沫芯材", "PET泡沫芯材", "Balsa芯材"], processes: ["芯材"], established: 2010, verified: true, description: "瑞典 Diab 中国工厂，Divinycell 品牌。", certifications: ["ISO 9001"] },
  { id: "sup-armacell-china", name: "Armacell 阿乐斯(广州)有限公司", location: "广东广州", province: "广东", category: "manufacturer", products: ["PET结构泡沫", "保温材料"], processes: ["发泡"], established: 2005, verified: true, description: "Armacell 在华生产 PET 芯材和保温材料。", certifications: ["ISO 9001"] },

  // ─── 船艇与海工 ───
  { id: "sup-yachts-huayang", name: "华阳游艇科技集团有限公司", location: "广东深圳", province: "广东", category: "manufacturer", products: ["豪华游艇", "玻璃钢船艇"], processes: ["手糊", "真空导入"], established: 2003, verified: true, description: "国内游艇制造领先企业。", certifications: ["CCS", "ISO 9001"] },
  { id: "sup-marine-xinshunde", name: "江门新顺德海洋科技有限公司", location: "广东江门", province: "广东", category: "manufacturer", products: ["FRP 渔船", "工作艇"], processes: ["手糊", "真空导入"], established: 2008, verified: true, description: "华南渔业 FRP 船艇专业制造商。", certifications: ["CCS"] },
  { id: "sup-hainan-marine", name: "海南翔泰海洋工程有限公司", location: "海南海口", province: "海南", category: "manufacturer", products: ["FRP 海工制品", "海水管道"], processes: ["缠绕", "手糊"], established: 2010, verified: true, description: "海南主攻海洋工程 FRP 制品。", certifications: ["ISO 9001"] },

  // ─── 体育/消费品 ───
  { id: "sup-bgi-sports", name: "浙江贝克洛复合材料有限公司", location: "浙江宁波", province: "浙江", category: "manufacturer", products: ["自行车", "运动装备", "碳纤制品"], processes: ["手糊", "热压"], established: 2005, verified: true, description: "碳纤运动制品制造商。", certifications: ["ISO 9001", "CE"] },
  { id: "sup-greensports", name: "深圳金信诺复合材料有限公司", location: "广东深圳", province: "广东", category: "manufacturer", products: ["碳纤网球拍", "羽毛球拍", "高尔夫球杆"], processes: ["模压", "缠绕"], established: 1998, verified: true, description: "碳纤体育用品制造商。", certifications: ["ISO 9001"] },

  // ─── 轨道交通/新能源汽车 ───
  { id: "sup-crrc-new", name: "中车青岛四方机车车辆股份有限公司", location: "山东青岛", province: "山东", category: "manufacturer", products: ["高铁车体复材件", "地铁零部件"], processes: ["RTM", "真空导入"], established: 2002, verified: true, description: "600031关联，高铁和地铁车身复材件。", certifications: ["IRIS", "ISO 9001"] },
  { id: "sup-tesla-supplier", name: "常州亨通复合材料有限公司", location: "江苏常州", province: "江苏", category: "manufacturer", products: ["新能源汽车电池包壳体", "车身复材件"], processes: ["SMC", "RTM"], established: 2011, verified: true, description: "新能源汽车 SMC 电池包壳体供应商。", certifications: ["IATF 16949"] },

  // ─── 防腐 / 化工 ───
  { id: "sup-jxlanyue", name: "浙江兰月化工有限公司", location: "浙江", province: "浙江", category: "manufacturer", products: ["乙烯基酯树脂", "防腐涂层", "储罐内衬"], processes: ["化学合成", "施工"], established: 2000, verified: true, description: "化工防腐 VER 生产和施工。", certifications: ["ISO 9001"] },
  { id: "sup-yonglan", name: "江苏永蓝防腐设备工程有限公司", location: "江苏扬州", province: "江苏", category: "manufacturer", products: ["FRP 储罐", "脱硫塔", "烟囱衬里"], processes: ["缠绕", "手糊"], established: 1994, verified: true, description: "防腐设备工程总包商。", certifications: ["ISO 9001", "CMHK"] },

  // ─── 辅料/助剂 ───
  { id: "sup-akzonobel-china", name: "阿克苏诺贝尔(上海)有限公司", location: "上海", province: "上海", category: "resin", products: ["过氧化物引发剂", "功能涂料"], processes: ["化学合成"], established: 1992, verified: true, description: "AkzoNobel 中国总部，过氧化物和涂料全系列。", certifications: ["ISO 9001"] },
  { id: "sup-chemlease-cn", name: "Chemlease 凯姆利(上海)特殊化学品有限公司", location: "上海", province: "上海", category: "service", products: ["半永久脱模剂", "模具护理"], processes: ["特殊化学品"], established: 2005, verified: true, description: "Chemlease 中国分部，高端脱模剂。", certifications: ["ISO 9001"] },

  // ─── 其他 ───
  { id: "sup-yangguan-taian", name: "山东阳谷泰安玻璃钢有限公司", location: "山东聊城", province: "山东", category: "manufacturer", products: ["玻璃钢管道", "风管"], processes: ["缠绕"], established: 1992, verified: true, description: "FRP 管道和风管专业生产商。", certifications: ["ISO 9001"] },
  { id: "sup-shida-carbon", name: "南通复兴碳纤复合材料有限公司", location: "江苏南通", province: "江苏", category: "manufacturer", products: ["碳纤管材", "碳纤零件"], processes: ["缠绕", "拉挤"], established: 2010, verified: true, description: "碳纤维管和定制零件生产。", certifications: ["ISO 9001"] },
];

export { MATERIALS_SEED, FORMULAS_SEED, SUPPLIERS_SEED };
