// 门窗幕墙抗风压受力计算 —— 依据中国现行荷载 / 结构规范
//
// 围护结构（门窗、幕墙）风荷载标准值 · GB 50009-2012《建筑结构荷载规范》§8.1.1-2：
//     wk = βgz · μsl · μz · w0                                    (kN/m²)
//   其中
//     w0   基本风压（50 年重现期），GB 50009-2012 附录 E.5，kN/m²
//     μz   风压高度变化系数，GB 50009-2012 §8.2.1 / 表 8.2.1
//     βgz  阵风系数，        GB 50009-2012 §8.6.1 / 表 8.6.1
//     μsl  风荷载局部体型系数（围护结构），GB 50009-2012 §8.3.3
//
// 框料（立柱 / 横梁 / 中挺）受力 · 简支梁模型，均布风压：
//     设计弯矩   Md = γw · qk · L²/8            强度校核 σ = Md/W ≤ f
//     标准挠度   δ  = 5·qk·L⁴/(384·E·I) ≤ [δ]   （JGJ 102-2003 §6.2.1 / JGJ 214-2010）
//
// μz / βgz 的连续公式与规范表 8.2.1、表 8.6.1 完全吻合（起算高度以下取起算高度值）：
//   截断高度  A 5m / B 10m / C 15m / D 30m
//   μz 截断值  1.09 / 1.00 / 0.65 / 0.51
//   βgz 截断值 1.65 / 1.70 / 2.05 / 2.40   ← 与规范表 8.6.1 逐一核对一致
//
// 说明：本模块用于门窗幕墙抗风压承载力/挠度的初步核算；最终设计须由具备资质的
// 结构工程师依据完整规范（含内压组合、从属面积折减、连接节点、玻璃面板等）复核。

export type Terrain = "A" | "B" | "C" | "D";

// 地面粗糙度类别参数
//   μz  = muzCoeff · (max(z,zmin)/10)^muzExp
//   βgz = 1 + 2·g·I10 · (max(z,zmin)/10)^(−alpha)   , g = 2.5（峰值因子）
export const TERRAIN: Record<
  Terrain,
  {
    label: string;
    labelEn: string;
    muzCoeff: number;
    muzExp: number;
    I10: number; // 10m 名义湍流度
    alpha: number; // 平均风剖面指数
    zmin: number; // 起算（截断）高度 m
  }
> = {
  A: {
    label: "A 类｜近海海面、海岛、海岸、湖岸、沙漠",
    labelEn: "A — open sea, islands, coast, desert",
    muzCoeff: 1.284,
    muzExp: 0.24,
    I10: 0.12,
    alpha: 0.12,
    zmin: 5,
  },
  B: {
    label: "B 类｜田野、乡村、丛林、中小城镇、大城市郊区",
    labelEn: "B — open country, villages, suburbs",
    muzCoeff: 1.0,
    muzExp: 0.3,
    I10: 0.14,
    alpha: 0.15,
    zmin: 10,
  },
  C: {
    label: "C 类｜有密集建筑群的城市市区",
    labelEn: "C — dense urban areas",
    muzCoeff: 0.544,
    muzExp: 0.44,
    I10: 0.23,
    alpha: 0.22,
    zmin: 15,
  },
  D: {
    label: "D 类｜有密集建筑群且房屋较高的城市市区",
    labelEn: "D — dense urban with tall buildings",
    muzCoeff: 0.262,
    muzExp: 0.6,
    I10: 0.39,
    alpha: 0.3,
    zmin: 30,
  },
};

const PEAK_FACTOR = 2.5; // g，GB 50009-2012 §8.6.1

/** 风压高度变化系数 μz（GB 50009-2012 §8.2.1） */
export function muZ(terrain: Terrain, z: number): number {
  const t = TERRAIN[terrain];
  const zz = Math.max(z, t.zmin);
  return t.muzCoeff * Math.pow(zz / 10, t.muzExp);
}

/** 阵风系数 βgz（GB 50009-2012 §8.6.1） */
export function betaGz(terrain: Terrain, z: number): number {
  const t = TERRAIN[terrain];
  const zz = Math.max(z, t.zmin);
  return 1 + 2 * PEAK_FACTOR * t.I10 * Math.pow(zz / 10, -t.alpha);
}

// 全国主要城市基本风压 w0（kN/m²，50 年重现期）
// 摘自 GB 50009-2012 附录 E 表 E.5。玻璃幕墙按 JGJ 102-2003 §5.3.1 基本风压不宜
// 小于 0.30 kN/m²；重要及超高层建筑宜适当提高。实际工程须以工程所在地规范取值为准。
export const BASIC_WIND_PRESSURE: { city: string; cityEn: string; w0: number }[] =
  [
    { city: "北京", cityEn: "Beijing", w0: 0.45 },
    { city: "天津", cityEn: "Tianjin", w0: 0.5 },
    { city: "上海", cityEn: "Shanghai", w0: 0.55 },
    { city: "重庆", cityEn: "Chongqing", w0: 0.4 },
    { city: "广州", cityEn: "Guangzhou", w0: 0.5 },
    { city: "深圳", cityEn: "Shenzhen", w0: 0.75 },
    { city: "成都", cityEn: "Chengdu", w0: 0.3 },
    { city: "杭州", cityEn: "Hangzhou", w0: 0.45 },
    { city: "南京", cityEn: "Nanjing", w0: 0.4 },
    { city: "武汉", cityEn: "Wuhan", w0: 0.35 },
    { city: "西安", cityEn: "Xi'an", w0: 0.35 },
    { city: "郑州", cityEn: "Zhengzhou", w0: 0.45 },
    { city: "济南", cityEn: "Jinan", w0: 0.45 },
    { city: "青岛", cityEn: "Qingdao", w0: 0.6 },
    { city: "沈阳", cityEn: "Shenyang", w0: 0.55 },
    { city: "大连", cityEn: "Dalian", w0: 0.65 },
    { city: "哈尔滨", cityEn: "Harbin", w0: 0.55 },
    { city: "长沙", cityEn: "Changsha", w0: 0.35 },
    { city: "南昌", cityEn: "Nanchang", w0: 0.45 },
    { city: "福州", cityEn: "Fuzhou", w0: 0.7 },
    { city: "厦门", cityEn: "Xiamen", w0: 0.8 },
    { city: "昆明", cityEn: "Kunming", w0: 0.3 },
    { city: "贵阳", cityEn: "Guiyang", w0: 0.3 },
    { city: "南宁", cityEn: "Nanning", w0: 0.35 },
    { city: "海口", cityEn: "Haikou", w0: 0.75 },
    { city: "太原", cityEn: "Taiyuan", w0: 0.4 },
    { city: "石家庄", cityEn: "Shijiazhuang", w0: 0.35 },
    { city: "合肥", cityEn: "Hefei", w0: 0.35 },
    { city: "呼和浩特", cityEn: "Hohhot", w0: 0.55 },
    { city: "兰州", cityEn: "Lanzhou", w0: 0.3 },
    { city: "银川", cityEn: "Yinchuan", w0: 0.65 },
    { city: "西宁", cityEn: "Xining", w0: 0.35 },
    { city: "乌鲁木齐", cityEn: "Urumqi", w0: 0.6 },
    { city: "拉萨", cityEn: "Lhasa", w0: 0.3 },
  ];

// 风荷载局部体型系数 μsl（围护结构，GB 50009-2012 §8.3.3）
// 取值为控制工况（一般为负压/吸力）的绝对值。角部、檐口、边缘处吸力显著增大。
// 内表面压力 ±0.2（封闭式建筑）及从属面积折减应按 §8.3.3~8.3.5 另行组合。
export const SHAPE_ZONES: {
  key: "field" | "edge" | "corner";
  zh: string;
  en: string;
  muSl: number;
}[] = [
  { key: "field", zh: "中间区 / 一般部位", en: "Field / general zone", muSl: 1.0 },
  { key: "edge", zh: "边缘区（近墙边）", en: "Edge zone", muSl: 1.4 },
  { key: "corner", zh: "角部 / 檐口 / 突出部位", en: "Corner / eave / parapet", muSl: 1.8 },
];

// 框料材料预设：E 弹性模量、f 抗弯强度设计值（MPa）。均可在界面上手动修改。
// 复材(FRP)拉挤型材的 E、f 因牌号/铺层差异大，务必以厂家 datasheet 实测值为准。
export const MATERIALS: {
  key: string;
  zh: string;
  en: string;
  E: number;
  f: number;
  verify?: boolean;
}[] = [
  {
    key: "frp40",
    zh: "复材 FRP 拉挤型材（E40 高模量 · 桥梁级）",
    en: "Pultruded FRP (E40 high-modulus · bridge-grade)",
    E: 40000,
    f: 120,
    verify: true,
  },
  {
    key: "frp23",
    zh: "复材 FRP 拉挤型材（EN 13706 E23）",
    en: "Pultruded FRP (EN 13706 E23)",
    E: 23000,
    f: 80,
    verify: true,
  },
  {
    key: "frp17",
    zh: "复材 FRP 拉挤型材（EN 13706 E17）",
    en: "Pultruded FRP (EN 13706 E17)",
    E: 17000,
    f: 60,
    verify: true,
  },
  {
    key: "al6063",
    zh: "铝合金 6063-T5",
    en: "Aluminium 6063-T5",
    E: 70000,
    f: 90,
  },
  {
    key: "al6061",
    zh: "铝合金 6061-T6",
    en: "Aluminium 6061-T6",
    E: 70000,
    f: 150,
  },
  { key: "q235", zh: "钢 Q235", en: "Steel Q235", E: 206000, f: 215 },
  { key: "q355", zh: "钢 Q355", en: "Steel Q355", E: 206000, f: 305 },
];

// 门窗/幕墙型材「系列」= 公称框深 (mm)，行业通用命名（如 65 系列 ≈ 框构造深 65mm）。
// 品牌中立：仅表示公称框深与默认材料上下文，不代表任何厂家专有截面数据。
// 具体 W(截面模量)/I(惯性矩) 因型材（边框/中挺/扇料）而异，须按型材实测 datasheet 填写。
export const PROFILE_SERIES: { series: number; depth: number }[] = [
  { series: 50, depth: 50 },
  { series: 55, depth: 55 },
  { series: 60, depth: 60 },
  { series: 65, depth: 65 },
  { series: 70, depth: 70 },
  { series: 80, depth: 80 },
  { series: 90, depth: 90 },
];

// 挠度限值 L/n（相对挠度）。铝合金幕墙立柱/横梁 L/180（JGJ 102-2003 §6.2.1）；
// 钢 L/250；铝合金门窗主要受力杆件 L/150（JGJ 214-2010）；复材宜从严。
export const DEFLECTION_LIMITS: { n: number; zh: string; en: string }[] = [
  { n: 150, zh: "L/150（铝合金门窗主受力杆件 JGJ 214）", en: "L/150 (JGJ 214 window member)" },
  { n: 180, zh: "L/180（铝合金幕墙立柱/横梁 JGJ 102）", en: "L/180 (JGJ 102 alu. mullion)" },
  { n: 200, zh: "L/200（较严）", en: "L/200 (stricter)" },
  { n: 250, zh: "L/250（钢型材 JGJ 102）", en: "L/250 (JGJ 102 steel)" },
  { n: 300, zh: "L/300（严格）", en: "L/300 (strict)" },
];

// ── 多标准风荷载引擎 ──────────────────────────────────────────────
// 围护结构风压推导按各国规范分流；框料强度/挠度校核（简支梁 σ=Md/W、
// δ=5qL⁴/384EI）通用。f1frp.com(中文)固定 GB；getfrp.com(英文)可选地区规范。
//   pService  用于挠度校核的使用/标准级风压 (kN/m²)
//   pDesign   用于强度校核的设计/极限级风压 (kN/m²)

export type WindStandard = "gb" | "asce" | "eurocode" | "nbcc" | "as";

// ===== 美国 ASCE 7-22（Components & Cladding, §26/§30）=====
// 暴露系数 Kz = 2.01·(z/zg)^(2/α)，α、zg 见表 26.11-1（15ft/4.6m 以下取 4.6m）
export const ASCE_EXPOSURE: Record<
  "B" | "C" | "D",
  { alpha: number; zg: number; zh: string; en: string }
> = {
  B: { alpha: 7.0, zg: 365.76, zh: "B 类｜市区/郊区/林地", en: "B — urban / suburban / wooded" },
  C: { alpha: 9.5, zg: 274.32, zh: "C 类｜开阔地（默认）", en: "C — open terrain (default)" },
  D: { alpha: 11.5, zg: 213.36, zh: "D 类｜平坦/沿海/滩涂", en: "D — flat / coastal / mud flats" },
};
export type AsceExposure = keyof typeof ASCE_EXPOSURE;

export function asceKz(exp: AsceExposure, z: number): number {
  const { alpha, zg } = ASCE_EXPOSURE[exp];
  const zz = Math.max(z, 4.6);
  return 2.01 * Math.pow(zz / zg, 2 / alpha);
}
/** ASCE 7-22 速压 qz = 0.613·Kz·Kzt·Kd·Ke·V² (Pa)，V=m/s（3秒阵风·极限风速），Kd=0.85(C&C) */
export function asceQz(
  exp: AsceExposure,
  z: number,
  V: number,
  Kzt = 1,
  Kd = 0.85,
  Ke = 1,
): number {
  return 0.613 * asceKz(exp, z) * Kzt * Kd * Ke * V * V;
}
// 美国代表性基本风速 V（m/s，3秒阵风，Risk Cat II，极限/强度级；实际按 ASCE 7 风速图取）
export const ASCE_WIND_SPEEDS: { zh: string; en: string; V: number }[] = [
  { zh: "内陆一般（≈115 mph）", en: "Inland typical (≈115 mph)", V: 51 },
  { zh: "过渡区（≈130 mph）", en: "Transition (≈130 mph)", V: 58 },
  { zh: "沿海飓风区（≈150 mph）", en: "Hurricane coast (≈150 mph)", V: 67 },
  { zh: "强飓风区（≈170 mph）", en: "High hurricane (≈170 mph)", V: 76 },
];

// ===== 欧洲 Eurocode EN 1991-1-4 =====
// 峰值速压 qp(z)=ce(z)·qb；ce(z)=[1+7·Iv]·cr²（c0=1）；cr=kr·ln(z/z0)，kr=0.19·(z0/0.05)^0.07；
// Iv=1/ln(z/z0)；qb=0.5·ρ·vb²（ρ=1.25）。z<zmin 取 zmin。
export const EC_TERRAIN: Record<
  "0" | "I" | "II" | "III" | "IV",
  { z0: number; zmin: number; zh: string; en: string }
> = {
  "0": { z0: 0.003, zmin: 1, zh: "0 类｜海面/沿海", en: "0 — sea / coastal" },
  I: { z0: 0.01, zmin: 1, zh: "I 类｜湖泊/平坦无障碍", en: "I — lakes / flat, no obstacles" },
  II: { z0: 0.05, zmin: 2, zh: "II 类｜低矮植被/零星障碍（默认）", en: "II — low vegetation (default)" },
  III: { z0: 0.3, zmin: 5, zh: "III 类｜郊区/森林", en: "III — suburban / forest" },
  IV: { z0: 1.0, zmin: 10, zh: "IV 类｜城市（>15% 建筑, h>15m）", en: "IV — urban (>15% built, h>15m)" },
};
export type EcTerrain = keyof typeof EC_TERRAIN;

export function ecCe(cat: EcTerrain, z: number): number {
  const { z0, zmin } = EC_TERRAIN[cat];
  const zz = Math.max(z, zmin);
  const kr = 0.19 * Math.pow(z0 / 0.05, 0.07);
  const cr = kr * Math.log(zz / z0);
  const Iv = 1 / Math.log(zz / z0);
  return (1 + 7 * Iv) * cr * cr;
}
/** Eurocode 峰值速压 qp(z)=ce(z)·qb (Pa)，qb=0.5·ρ·vb²（ρ=1.25，特征值） */
export function ecQp(cat: EcTerrain, z: number, vb: number, rho = 1.25): number {
  return ecCe(cat, z) * 0.5 * rho * vb * vb;
}
// 欧洲代表性基本风速 vb（m/s，10 分钟平均，10m，重现期 50 年；实际按各国国家附录取）
export const EC_WIND_SPEEDS: { zh: string; en: string; vb: number }[] = [
  { zh: "内陆一般 22 m/s", en: "Inland typical 22 m/s", vb: 22 },
  { zh: "较强 26 m/s", en: "Moderate 26 m/s", vb: 26 },
  { zh: "沿海/强风 30 m/s", en: "Coastal / strong 30 m/s", vb: 30 },
  { zh: "极端 34 m/s", en: "Severe 34 m/s", vb: 34 },
];

// ===== 加拿大 NBCC 2020 =====
// 指定压力 p = Iw·q·Ce·Ct·Cg·Cp（本工具 Iw=Ct=1，用户输入净 Cg·Cp）
//   Ce 开阔 =(h/10)^0.2（≥0.9）；粗糙 =0.7·(h/12)^0.3（≥0.7）
export const NBCC_EXPOSURE: Record<
  "open" | "rough",
  { zh: string; en: string }
> = {
  open: { zh: "开阔地形", en: "Open terrain" },
  rough: { zh: "粗糙地形（郊区/城市）", en: "Rough (suburban / urban)" },
};
export type NbccExposure = keyof typeof NBCC_EXPOSURE;

export function nbccCe(exp: NbccExposure, h: number): number {
  if (exp === "rough") return Math.max(0.7, 0.7 * Math.pow(h / 12, 0.3));
  return Math.max(0.9, Math.pow(h / 10, 0.2));
}
// 参考速压 q（kPa，1/50 年重现期，NBCC 附录 C）
export const NBCC_Q: { city: string; cityEn: string; q: number }[] = [
  { city: "多伦多", cityEn: "Toronto", q: 0.44 },
  { city: "渥太华", cityEn: "Ottawa", q: 0.41 },
  { city: "蒙特利尔", cityEn: "Montreal", q: 0.42 },
  { city: "魁北克城", cityEn: "Quebec City", q: 0.41 },
  { city: "温哥华", cityEn: "Vancouver", q: 0.45 },
  { city: "维多利亚", cityEn: "Victoria", q: 0.45 },
  { city: "卡尔加里", cityEn: "Calgary", q: 0.48 },
  { city: "埃德蒙顿", cityEn: "Edmonton", q: 0.45 },
  { city: "温尼伯", cityEn: "Winnipeg", q: 0.45 },
  { city: "哈利法克斯", cityEn: "Halifax", q: 0.53 },
  { city: "圣约翰斯", cityEn: "St. John's", q: 0.77 },
];

// ===== 澳大利亚/新西兰 AS/NZS 1170.2 =====
// 设计风压 p = 0.5·ρ·Vdes²·Cfig·Cdyn（ρ=1.2，Cdyn=1）
//   Vdes = VR·Md·Mz,cat·Ms·Mt（本工具 Md=Ms=Mt=1，用户输入 VR 与 Cfig）
export const AS_TERRAIN: Record<
  "TC1" | "TC2" | "TC3" | "TC4",
  { zh: string; en: string }
> = {
  TC1: { zh: "TC1｜开阔水面/极平坦", en: "TC1 — open water / very flat" },
  TC2: { zh: "TC2｜开阔草地/零星障碍（默认）", en: "TC2 — open grassland (default)" },
  TC3: { zh: "TC3｜郊区/密集障碍", en: "TC3 — suburban / numerous obstructions" },
  TC4: { zh: "TC4｜城市中心/高楼密集", en: "TC4 — city centres / tall buildings" },
};
export type AsTerrain = keyof typeof AS_TERRAIN;
// Mz,cat 表 4.1（AS/NZS 1170.2），按高度线性插值
const AS_MZ: Record<AsTerrain, [number, number][]> = {
  TC1: [[3, 0.99], [5, 1.05], [10, 1.12], [15, 1.16], [20, 1.19], [30, 1.22], [50, 1.25], [75, 1.27], [100, 1.29], [200, 1.32]],
  TC2: [[3, 0.91], [5, 0.91], [10, 1.0], [15, 1.05], [20, 1.08], [30, 1.12], [50, 1.18], [75, 1.22], [100, 1.24], [200, 1.29]],
  TC3: [[3, 0.83], [5, 0.83], [10, 0.83], [15, 0.89], [20, 0.94], [30, 1.0], [50, 1.07], [75, 1.12], [100, 1.16], [200, 1.24]],
  TC4: [[3, 0.75], [5, 0.75], [10, 0.75], [15, 0.75], [20, 0.75], [30, 0.8], [50, 0.9], [75, 0.98], [100, 1.03], [200, 1.16]],
};
export function asMz(cat: AsTerrain, z: number): number {
  const t = AS_MZ[cat];
  if (z <= t[0][0]) return t[0][1];
  if (z >= t[t.length - 1][0]) return t[t.length - 1][1];
  for (let i = 0; i < t.length - 1; i++) {
    const [h0, m0] = t[i];
    const [h1, m1] = t[i + 1];
    if (z >= h0 && z <= h1) return m0 + ((m1 - m0) * (z - h0)) / (h1 - h0);
  }
  return t[t.length - 1][1];
}
// 区域基本风速 VR（m/s，重现期 500 年 ULS；实际按 AS/NZS 1170.2 表 3.1 与所在区取）
export const AS_REGIONS: { key: string; zh: string; en: string; VR: number }[] = [
  { key: "A", zh: "A 区（非气旋，V500≈45）", en: "Region A (non-cyclonic, V500≈45)", VR: 45 },
  { key: "B", zh: "B 区（中间，V500≈57）", en: "Region B (intermediate, V500≈57)", VR: 57 },
  { key: "C", zh: "C 区（气旋，V500≈66）", en: "Region C (cyclonic, V500≈66)", VR: 66 },
  { key: "D", zh: "D 区（强气旋，V500≈80）", en: "Region D (severe cyclonic, V500≈80)", VR: 80 },
];

// 各标准围护结构"净压力系数"（含内压组合）代表绝对值：中间区 / 角部
// ASCE |GCp−GCpi|（GCpi=±0.18）；EC |cpe−cpi|（cpi=+0.2/−0.3）；
// NBCC 净 Cg·Cp（Cg=2.5 已含阵风，外 CgCp 约 1.5~2.1 + 内压）；AS/NZS 净 Cfig（Cp,e·Kl·Ka + Cp,i）
export const NET_CP_PRESETS: {
  key: string;
  zh: string;
  en: string;
  asce: number;
  ec: number;
  nbcc: number;
  as: number;
}[] = [
  { key: "field", zh: "中间区", en: "Field / interior", asce: 1.3, ec: 1.3, nbcc: 2.0, as: 1.2 },
  { key: "corner", zh: "角部 / 边缘", en: "Corner / edge", asce: 1.6, ec: 1.6, nbcc: 2.5, as: 1.8 },
];

export interface MemberInput {
  B: number; // 受荷宽度 mm
  L: number; // 计算跨度 mm
  W: number; // 抗弯截面模量 cm³
  I: number; // 惯性矩 cm⁴
  E: number; // MPa
  f: number; // 抗弯强度设计值 MPa
  deflN: number; // 挠度限值 L/deflN
}

export interface WindResult {
  pService: number; // kN/m² 使用/标准级（挠度用）
  pDesign: number; // kN/m² 设计/极限级（强度用）
  qk: number; // kN/m 使用级线荷载
  Md: number; // kN·m 设计弯矩
  sigma: number; // MPa 弯曲应力
  delta: number; // mm 挠度（使用级）
  deltaLimit: number; // mm 允许挠度
  strengthRatio: number;
  deflRatio: number;
  strengthPass: boolean;
  deflPass: boolean;
  pass: boolean;
  gb?: { muz: number; bgz: number };
  asce?: { Kz: number; qz: number }; // qz kN/m²
  ec?: { ce: number; qp: number }; // qp kN/m²
  nbcc?: { Ce: number; qh: number }; // qh = q·Ce, kN/m²
  as?: { Mz: number; Vdes: number }; // Vdes m/s
}

/** 共享框料校核：强度用 pDesign、挠度用 pService（简支梁均布风压） */
function checkMember(
  pService: number,
  pDesign: number,
  m: MemberInput,
): Omit<WindResult, "gb" | "asce" | "ec"> {
  const Bm = m.B / 1000; // m
  const qk = pService * Bm; // kN/m 使用级
  const qd = pDesign * Bm; // kN/m 设计级
  const Lm = m.L / 1000; // m
  const Md = (qd * Lm * Lm) / 8; // kN·m 设计弯矩

  const W_mm3 = m.W * 1e3; // cm³ → mm³
  const I_mm4 = m.I * 1e4; // cm⁴ → mm⁴

  const sigma = W_mm3 > 0 ? (Md * 1e6) / W_mm3 : Infinity;
  const delta =
    m.E > 0 && I_mm4 > 0
      ? (5 * qk * Math.pow(m.L, 4)) / (384 * m.E * I_mm4)
      : Infinity;
  const deltaLimit = m.L / m.deflN;
  const strengthRatio = m.f > 0 ? sigma / m.f : Infinity;
  const deflRatio = deltaLimit > 0 ? delta / deltaLimit : Infinity;
  const strengthPass = strengthRatio <= 1;
  const deflPass = deflRatio <= 1;

  return {
    pService,
    pDesign,
    qk,
    Md,
    sigma,
    delta,
    deltaLimit,
    strengthRatio,
    deflRatio,
    strengthPass,
    deflPass,
    pass: strengthPass && deflPass,
  };
}

// ---- 中国 GB 50009-2012 ----
export interface GBInput extends MemberInput {
  w0: number;
  terrain: Terrain;
  z: number;
  muSl: number;
  gammaW: number;
}
export function computeGB(inp: GBInput): WindResult {
  const muz = muZ(inp.terrain, inp.z);
  const bgz = betaGz(inp.terrain, inp.z);
  const wk = bgz * inp.muSl * muz * inp.w0; // kN/m² 标准值
  return { ...checkMember(wk, inp.gammaW * wk, inp), gb: { muz, bgz } };
}

// ---- 美国 ASCE 7-22 ----
// V 为极限风速 → pUlt 即强度级；挠度用 0.6W 使用级（ASCE 7 荷载组合）
export interface ASCEInput extends MemberInput {
  V: number;
  exp: AsceExposure;
  z: number;
  cp: number; // |GCp − GCpi|
}
export function computeASCE(inp: ASCEInput): WindResult {
  const Kz = asceKz(inp.exp, inp.z);
  const qz = asceQz(inp.exp, inp.z, inp.V); // Pa（含 Kd=0.85）
  const pUlt = (qz * inp.cp) / 1000; // kN/m² 极限/强度级
  return {
    ...checkMember(0.6 * pUlt, pUlt, inp),
    asce: { Kz, qz: qz / 1000 },
  };
}

// ---- 欧洲 Eurocode EN 1991-1-4 ----
// qp 为特征值 → we 特征/使用级；强度用 γQ=1.5（ULS）
export interface ECInput extends MemberInput {
  vb: number;
  cat: EcTerrain;
  z: number;
  cp: number; // |cpe − cpi|
}
export function computeEC(inp: ECInput): WindResult {
  const ce = ecCe(inp.cat, inp.z);
  const qp = ecQp(inp.cat, inp.z, inp.vb); // Pa 峰值速压
  const we = (qp * inp.cp) / 1000; // kN/m² 特征值
  return {
    ...checkMember(we, 1.5 * we, inp),
    ec: { ce, qp: qp / 1000 },
  };
}

// ---- 加拿大 NBCC 2020 ----
// q 为 1/50 年参考速压(kPa=kN/m²)；指定压力 pSpec 为使用级 → 强度用 1.4W(ULS)
export interface NBCCInput extends MemberInput {
  q: number; // kPa
  exp: NbccExposure;
  z: number;
  cgcp: number; // 净 |Cg·Cp|
}
export function computeNBCC(inp: NBCCInput): WindResult {
  const Ce = nbccCe(inp.exp, inp.z);
  const pSpec = inp.q * Ce * inp.cgcp; // kN/m² 指定/使用级（Iw=Ct=1）
  return {
    ...checkMember(pSpec, 1.4 * pSpec, inp),
    nbcc: { Ce, qh: inp.q * Ce },
  };
}

// ---- 澳大利亚/新西兰 AS/NZS 1170.2 ----
// VR 为 1/500 年 ULS 风速 → pUlt 强度级；挠度用 0.7·pUlt（≈使用级 Vsls²/Vuls²）
export interface ASInput extends MemberInput {
  VR: number; // m/s
  cat: AsTerrain;
  z: number;
  cfig: number; // 净 Cfig
}
export function computeAS(inp: ASInput): WindResult {
  const Mz = asMz(inp.cat, inp.z);
  const Vdes = inp.VR * Mz; // Md=Ms=Mt=1
  const pUlt = (0.5 * 1.2 * Vdes * Vdes * inp.cfig) / 1000; // kN/m² 极限级
  return {
    ...checkMember(0.7 * pUlt, pUlt, inp),
    as: { Mz, Vdes },
  };
}
