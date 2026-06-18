// Composite materials matrix: the "periodic table" dimension map.
// 5 fiber families × 11 resin families × 8 process families ≈ 440 combinations,
// each a potential entry point into the six-library knowledge graph.
//
// Convention: slug = `${fiber.slug}-${resin.slug}` for 2D cells;
// adding a process filter becomes ?process=<id>. Single canonical URL per pair.

export type Fiber = {
  slug: string;
  name: string;
  nameEn: string;
  mono: string;
  grades: string;
  /** English grade families for getfrp.com; falls back to `grades` (ASCII). */
  gradesEn?: string;
  /** Keywords used to ILIKE-match the fiber in title/abstract. */
  keywords: string[];
};

export type Resin = {
  slug: string;
  name: string;
  nameEn: string;
  mono: string;
  acronym: string;
  isThermoplastic?: boolean;
  keywords: string[];
};

export type Process = {
  slug: string;
  name: string;
  nameEn: string;
  mono: string;
  keywords: string[];
};

export const FIBERS: Fiber[] = [
  {
    slug: "glass",
    name: "玻璃纤维",
    nameEn: "Glass Fiber",
    mono: "GLASS",
    grades: "E / ECR / S-glass / AR",
    keywords: ["玻璃纤维", "玻纤", "glass fiber", "GFRP", "E-glass", "ECR", "S-glass"],
  },
  {
    slug: "carbon",
    name: "碳纤维",
    nameEn: "Carbon Fiber",
    mono: "CARBON",
    grades: "T300 · T700 · T800 · T1000 · M40J · M55J",
    keywords: ["碳纤维", "carbon fiber", "CFRP", "T300", "T700", "T800", "PAN"],
  },
  {
    slug: "basalt",
    name: "玄武岩纤维",
    nameEn: "Basalt Fiber",
    mono: "BASALT",
    grades: "BF 耐温 700 °C",
    gradesEn: "BF (service temp 700 °C)",
    keywords: ["玄武岩", "basalt", "BFRP"],
  },
  {
    slug: "aramid",
    name: "芳纶纤维",
    nameEn: "Aramid Fiber",
    mono: "ARAMID",
    grades: "Kevlar · Twaron · 对位/间位",
    gradesEn: "Kevlar · Twaron · para / meta",
    keywords: ["芳纶", "aramid", "Kevlar", "Twaron", "对位芳纶", "间位芳纶"],
  },
  {
    slug: "bio",
    name: "生物基纤维",
    nameEn: "Bio-based Fiber",
    mono: "BIO",
    grades: "亚麻 · 大麻 · 竹 · 苎麻",
    gradesEn: "Flax · Hemp · Bamboo · Ramie",
    keywords: ["生物基", "bio-based", "亚麻", "大麻", "竹纤维", "flax", "hemp", "bamboo", "jute"],
  },
];

export const RESINS: Resin[] = [
  {
    slug: "upr",
    name: "不饱和聚酯",
    nameEn: "Unsaturated Polyester",
    mono: "UPR",
    acronym: "UPR",
    keywords: ["不饱和聚酯", "UPR", "unsaturated polyester", "polyester resin"],
  },
  {
    slug: "ver",
    name: "乙烯基酯",
    nameEn: "Vinyl Ester",
    mono: "VER",
    acronym: "VER",
    keywords: ["乙烯基酯", "vinyl ester", "VER"],
  },
  {
    slug: "epoxy",
    name: "环氧树脂",
    nameEn: "Epoxy",
    mono: "EP",
    acronym: "EP",
    keywords: ["环氧", "epoxy", "bisphenol"],
  },
  {
    slug: "phenolic",
    name: "酚醛树脂",
    nameEn: "Phenolic",
    mono: "PF",
    acronym: "PF",
    keywords: ["酚醛", "phenolic", "resole"],
  },
  {
    slug: "pu",
    name: "聚氨酯",
    nameEn: "Polyurethane",
    mono: "PU",
    acronym: "PU",
    keywords: ["聚氨酯", "polyurethane", "PU", "isocyanate"],
  },
  {
    slug: "bmi",
    name: "双马来酰亚胺",
    nameEn: "Bismaleimide",
    mono: "BMI",
    acronym: "BMI",
    keywords: ["双马来酰亚胺", "bismaleimide", "BMI"],
  },
  {
    slug: "cyanate",
    name: "氰酸酯",
    nameEn: "Cyanate Ester",
    mono: "CE",
    acronym: "CE",
    keywords: ["氰酸酯", "cyanate ester"],
  },
  {
    slug: "peek",
    name: "聚醚醚酮",
    nameEn: "PEEK",
    mono: "PEEK",
    acronym: "PEEK",
    isThermoplastic: true,
    keywords: ["PEEK", "聚醚醚酮", "polyetheretherketone"],
  },
  {
    slug: "pps",
    name: "聚苯硫醚",
    nameEn: "PPS",
    mono: "PPS",
    acronym: "PPS",
    isThermoplastic: true,
    keywords: ["PPS", "聚苯硫醚", "polyphenylene sulfide"],
  },
  {
    slug: "pa",
    name: "聚酰胺",
    nameEn: "Polyamide",
    mono: "PA",
    acronym: "PA",
    isThermoplastic: true,
    keywords: ["聚酰胺", "PA6", "PA66", "polyamide", "nylon"],
  },
  {
    slug: "bio-epoxy",
    name: "生物基环氧",
    nameEn: "Bio-based Epoxy",
    mono: "BIO-EP",
    acronym: "Bio-EP",
    keywords: ["bio-based epoxy", "生物基环氧", "furan", "lignin epoxy"],
  },
];

export const PROCESSES: Process[] = [
  {
    slug: "hand-layup",
    name: "手糊",
    nameEn: "Hand Lay-up",
    mono: "HAND LAY-UP",
    keywords: ["手糊", "hand lay-up", "hand layup"],
  },
  {
    slug: "pultrusion",
    name: "拉挤",
    nameEn: "Pultrusion",
    mono: "PULTRUSION",
    keywords: ["拉挤", "pultrusion", "pultruded"],
  },
  {
    slug: "winding",
    name: "缠绕成型",
    nameEn: "Filament Winding",
    mono: "WINDING",
    keywords: ["缠绕", "filament winding"],
  },
  {
    slug: "rtm",
    name: "RTM 树脂传递",
    nameEn: "RTM",
    mono: "RTM",
    keywords: ["RTM", "resin transfer molding", "树脂传递"],
  },
  {
    slug: "hp-rtm",
    name: "HP-RTM 高压 RTM",
    nameEn: "HP-RTM",
    mono: "HP-RTM",
    keywords: ["HP-RTM", "HPRTM", "高压 RTM", "high-pressure RTM"],
  },
  {
    slug: "vartm",
    name: "VARTM 真空导入",
    nameEn: "VARTM",
    mono: "VARTM",
    keywords: ["VARTM", "真空辅助", "真空导入", "vacuum assisted resin"],
  },
  {
    slug: "smc",
    name: "SMC/BMC 模压",
    nameEn: "SMC / BMC",
    mono: "SMC",
    keywords: ["SMC", "BMC", "片状模塑", "团状模塑", "compression molding"],
  },
  {
    slug: "afp",
    name: "AFP 自动铺丝",
    nameEn: "AFP / ATL",
    mono: "AFP",
    keywords: ["AFP", "ATL", "automated fiber placement", "自动铺丝", "自动铺带"],
  },
];

// Feasibility density: which fiber × resin pairs are industrially common.
// 2 = mainstream, 1 = possible but niche, 0 = rare / experimental
export const FEASIBILITY: Record<string, Record<string, 0 | 1 | 2>> = {
  glass: {
    upr: 2, ver: 2, epoxy: 2, phenolic: 2, pu: 2, bmi: 1, cyanate: 1,
    peek: 1, pps: 1, pa: 2, "bio-epoxy": 1,
  },
  carbon: {
    upr: 1, ver: 1, epoxy: 2, phenolic: 2, pu: 1, bmi: 2, cyanate: 2,
    peek: 2, pps: 2, pa: 2, "bio-epoxy": 1,
  },
  basalt: {
    upr: 2, ver: 2, epoxy: 2, phenolic: 1, pu: 1, bmi: 1, cyanate: 0,
    peek: 1, pps: 1, pa: 1, "bio-epoxy": 1,
  },
  aramid: {
    upr: 1, ver: 1, epoxy: 2, phenolic: 2, pu: 1, bmi: 1, cyanate: 1,
    peek: 1, pps: 1, pa: 1, "bio-epoxy": 0,
  },
  bio: {
    upr: 2, ver: 1, epoxy: 1, phenolic: 1, pu: 1, bmi: 0, cyanate: 0,
    peek: 0, pps: 0, pa: 1, "bio-epoxy": 2,
  },
};

export function findFiber(slug: string): Fiber | undefined {
  return FIBERS.find((f) => f.slug === slug);
}
export function findResin(slug: string): Resin | undefined {
  return RESINS.find((r) => r.slug === slug);
}
export function findProcess(slug: string): Process | undefined {
  return PROCESSES.find((p) => p.slug === slug);
}

/** Parse `"glass-epoxy"` → `{ fiber: "glass", resin: "epoxy" }`. */
export function parseCombo(combo: string): { fiberSlug: string; resinSlug: string } | null {
  // Longest fiber slug matches greedily.
  for (const f of FIBERS) {
    if (combo.startsWith(f.slug + "-")) {
      const rest = combo.slice(f.slug.length + 1);
      if (RESINS.some((r) => r.slug === rest)) {
        return { fiberSlug: f.slug, resinSlug: rest };
      }
    }
  }
  return null;
}

/**
 * Every canonical fiber × resin combo slug (5 × 11 = 55). The process axis is a
 * filter (?process=), not a path segment, so the indexable URL space is the
 * 2D fiber×resin grid — used for both /matrix/[combo] SSG and the sitemap.
 */
export function allComboSlugs(): string[] {
  return FIBERS.flatMap((f) => RESINS.map((r) => `${f.slug}-${r.slug}`));
}

/** Industrial feasibility of a pair: 2 = mainstream, 1 = niche, 0 = rare. */
export function comboFeasibility(fiberSlug: string, resinSlug: string): 0 | 1 | 2 {
  return FEASIBILITY[fiberSlug]?.[resinSlug] ?? 0;
}

/**
 * Last editorial review of the feasibility matrix. Surfaced on combo pages as
 * a freshness signal (Baidu favours dated, maintained content). Bump on edit.
 */
export const MATRIX_REVIEWED = "2026-06";
