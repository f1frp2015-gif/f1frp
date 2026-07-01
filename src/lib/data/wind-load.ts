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

export interface WindInput {
  w0: number; // kN/m²
  terrain: Terrain;
  z: number; // m
  muSl: number;
  gammaW: number; // 风荷载分项系数
  B: number; // 受荷宽度（框料间距）mm
  L: number; // 计算跨度 mm
  W: number; // 抗弯截面模量 cm³
  I: number; // 惯性矩 cm⁴
  E: number; // MPa
  f: number; // 抗弯强度设计值 MPa
  deflN: number; // 挠度限值 L/deflN
}

export interface WindResult {
  muz: number;
  bgz: number;
  wk: number; // kN/m² 标准值
  wDesign: number; // kN/m² 设计值
  qk: number; // kN/m 标准线荷载
  Mk: number; // kN·m 标准弯矩
  Md: number; // kN·m 设计弯矩
  sigma: number; // MPa 弯曲应力（设计值）
  delta: number; // mm 挠度（标准值）
  deltaLimit: number; // mm 允许挠度
  strengthRatio: number; // σ / f
  deflRatio: number; // δ / [δ]
  strengthPass: boolean;
  deflPass: boolean;
  pass: boolean;
}

/** 抗风压承载力/挠度核算主函数 */
export function compute(inp: WindInput): WindResult {
  const muz = muZ(inp.terrain, inp.z);
  const bgz = betaGz(inp.terrain, inp.z);
  const wk = bgz * inp.muSl * muz * inp.w0; // kN/m² 标准值
  const wDesign = inp.gammaW * wk; // kN/m² 设计值

  const Bm = inp.B / 1000; // m
  const Lm = inp.L / 1000; // m
  const qk = wk * Bm; // kN/m 标准线荷载
  const Mk = (qk * Lm * Lm) / 8; // kN·m 标准弯矩
  const Md = inp.gammaW * Mk; // kN·m 设计弯矩

  const W_mm3 = inp.W * 1e3; // cm³ → mm³
  const I_mm4 = inp.I * 1e4; // cm⁴ → mm⁴

  // σ = Md / W ；Md(kN·m) → N·mm ×1e6，W mm³ → MPa
  const sigma = W_mm3 > 0 ? (Md * 1e6) / W_mm3 : Infinity;

  // δ = 5·qk·L⁴/(384·E·I)。qk(kN/m) 数值上等于 N/mm；L mm；E MPa；I mm⁴ → mm
  const delta =
    inp.E > 0 && I_mm4 > 0
      ? (5 * qk * Math.pow(inp.L, 4)) / (384 * inp.E * I_mm4)
      : Infinity;

  const deltaLimit = inp.L / inp.deflN;
  const strengthRatio = inp.f > 0 ? sigma / inp.f : Infinity;
  const deflRatio = deltaLimit > 0 ? delta / deltaLimit : Infinity;
  const strengthPass = strengthRatio <= 1;
  const deflPass = deflRatio <= 1;

  return {
    muz,
    bgz,
    wk,
    wDesign,
    qk,
    Mk,
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
