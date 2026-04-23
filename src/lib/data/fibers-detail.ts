// Extended per-fiber-system detail data: typical properties, grades, major
// brands, recommended applications. Matrix feasibility lives in matrix.ts.
// Keep strings bilingual-agnostic here — translations route through messages.

export type FiberDetail = {
  slug: string;
  /** Which resin slugs (from matrix.ts) pair well, ordered by practicality. */
  recommendedResins: string[];
  /** Which process slugs (from matrix.ts) this fiber is well-suited for. */
  recommendedProcesses: string[];
  /** Representative products / brands. Data is real public catalog. */
  brands: Array<{ name: string; region: "CN" | "Intl"; products: string }>;
  /** Property bands displayed as stat cards. */
  properties: Array<{ key: string; value: string }>;
};

export const FIBER_DETAIL: Record<string, FiberDetail> = {
  glass: {
    slug: "glass",
    recommendedResins: ["upr", "ver", "epoxy", "phenolic", "pu", "pa"],
    recommendedProcesses: [
      "hand-layup",
      "pultrusion",
      "winding",
      "rtm",
      "vartm",
      "smc",
    ],
    brands: [
      { name: "巨石集团 Jushi", region: "CN", products: "188 / 386 / 988 / EWR / EMC / TM7" },
      { name: "泰山玻纤 Taishan", region: "CN", products: "TDR / TCR / T438 / TWR / TM-S2" },
      { name: "重庆国际复材 CPIC", region: "CN", products: "TufRov® 4588 / 4510 / 4575 / 4599" },
      { name: "长海股份 Changhai", region: "CN", products: "粗纱 / 织物 / 化学品" },
      { name: "Owens Corning 欧文斯科宁", region: "Intl", products: "Advantex® / WindStrand® / HydroStrand™" },
      { name: "PPG / 日东纺 Nitto Boseki", region: "Intl", products: "ECR / 高模纱" },
    ],
    properties: [
      { key: "density", value: "2.54 – 2.75 g/cm³" },
      { key: "tensile", value: "3.1 – 4.8 GPa" },
      { key: "modulus", value: "72 – 95 GPa" },
      { key: "elongation", value: "3.5 – 5.0%" },
      { key: "tempLimit", value: "500 °C 以下" },
      { key: "costLevel", value: "¥ 低 · 主流工业级" },
    ],
  },
  carbon: {
    slug: "carbon",
    recommendedResins: ["epoxy", "bmi", "cyanate", "peek", "pps", "pa", "phenolic"],
    recommendedProcesses: [
      "pultrusion",
      "winding",
      "rtm",
      "hp-rtm",
      "vartm",
      "afp",
    ],
    brands: [
      { name: "中复神鹰 Zhongfu Shenying", region: "CN", products: "T300 / T700 / T800" },
      { name: "威海光威 Guangwei", region: "CN", products: "GW-T300-3K / 预浸料" },
      { name: "江苏恒神 Hengshen", region: "CN", products: "千吨级 T800 航空级" },
      { name: "吉林化纤 Jilin Chemfiber", region: "CN", products: "大丝束 48K 风电专用" },
      { name: "日本东丽 Toray", region: "Intl", products: "T300 / T700S / T800H / T1000G / M40J / M55J" },
      { name: "三菱化学 Mitsubishi / 东邦 Teijin", region: "Intl", products: "Pyrofil / Tenax" },
    ],
    properties: [
      { key: "density", value: "1.76 – 1.95 g/cm³" },
      { key: "tensile", value: "3.4 – 6.7 GPa" },
      { key: "modulus", value: "220 – 570 GPa" },
      { key: "elongation", value: "1.2 – 2.1%" },
      { key: "tempLimit", value: "500 °C 以下（基体决定）" },
      { key: "costLevel", value: "¥¥¥ 高 · 结构级" },
    ],
  },
  basalt: {
    slug: "basalt",
    recommendedResins: ["upr", "ver", "epoxy", "phenolic"],
    recommendedProcesses: [
      "pultrusion",
      "winding",
      "hand-layup",
      "vartm",
      "rtm",
    ],
    brands: [
      { name: "四川航天拓鑫 Hangtian Tuoxin", region: "CN", products: "BF 玄武岩纤维" },
      { name: "浙江石金基瓦 Jiwazhuang", region: "CN", products: "玄武岩纱 / BF 复材制品" },
      { name: "Kamenny Vek（俄罗斯）", region: "Intl", products: "BCF" },
      { name: "Mafic（爱尔兰）", region: "Intl", products: "Basalt roving" },
    ],
    properties: [
      { key: "density", value: "2.60 – 2.75 g/cm³" },
      { key: "tensile", value: "3.0 – 4.8 GPa" },
      { key: "modulus", value: "80 – 95 GPa" },
      { key: "elongation", value: "2.6 – 3.2%" },
      { key: "tempLimit", value: "700 °C 耐温" },
      { key: "costLevel", value: "¥¥ 中 · 环保耐温替代" },
    ],
  },
  aramid: {
    slug: "aramid",
    recommendedResins: ["epoxy", "phenolic", "ver", "cyanate"],
    recommendedProcesses: ["hand-layup", "rtm", "vartm", "winding"],
    brands: [
      { name: "烟台泰和新材 Taihe", region: "CN", products: "对位芳纶 / 间位芳纶" },
      { name: "江苏宏艺 Hongyi", region: "CN", products: "间位芳纶短纤 / 浆粕" },
      { name: "DuPont Kevlar（美国）", region: "Intl", products: "Kevlar 29 / 49 / 149" },
      { name: "Teijin Twaron（荷兰 / 日本）", region: "Intl", products: "Twaron 1000 / 2200" },
      { name: "Kolon Heracron（韩国）", region: "Intl", products: "Heracron HF / HT" },
    ],
    properties: [
      { key: "density", value: "1.35 – 1.46 g/cm³" },
      { key: "tensile", value: "2.8 – 3.3 GPa" },
      { key: "modulus", value: "60 – 140 GPa" },
      { key: "elongation", value: "2.4 – 4.5%" },
      { key: "tempLimit", value: "LOI ≥ 28% · 自熄" },
      { key: "costLevel", value: "¥¥¥ 高 · 防护级" },
    ],
  },
  bio: {
    slug: "bio",
    recommendedResins: ["bio-epoxy", "upr", "epoxy", "pa"],
    recommendedProcesses: ["hand-layup", "rtm", "vartm", "smc"],
    brands: [
      { name: "Bcomp（瑞士）", region: "Intl", products: "ampliTex®（亚麻）" },
      { name: "Ecotechnilin（法国）", region: "Intl", products: "亚麻纤维毡" },
      { name: "Lineo（比利时）", region: "Intl", products: "亚麻预浸料" },
      { name: "长春经开 CJETS", region: "CN", products: "苎麻纤维" },
      { name: "浙江吉祥麻业 Jixiang", region: "CN", products: "大麻纤维" },
    ],
    properties: [
      { key: "density", value: "1.30 – 1.50 g/cm³" },
      { key: "tensile", value: "0.4 – 1.5 GPa" },
      { key: "modulus", value: "30 – 70 GPa" },
      { key: "elongation", value: "1.6 – 3.0%" },
      { key: "tempLimit", value: "200 °C 以下" },
      { key: "costLevel", value: "¥ 低 · 绿色环保" },
    ],
  },
};
