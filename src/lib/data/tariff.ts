// getfrp Sourcing Desk · P0 缺口 A 数据层 — HS × 目的国 关税/退税/运费参考。
//
// ⚠️ INDICATIVE ONLY. 这些是 P0 占位参考值(MFN 名义税率 + 经验运费),用于给海外买家
// 一个"落地价区间"的量级,**不是**精确报价。明确**不含**:反倾销/反补贴(AD/CVD)、
// 美国 Section 301 对华加征、原产地附加、特定 ESR/认证溢价、目的国内陆派送。
// 真实税号与税率必须按 HS + 目的国海关在锁定 spec 后逐单由合格专业人士复核。
// 仅覆盖 P0 三大目的市场 US / EU / CA + FRP 主 HS(3916 型材棒管 / 3925 板格栅 / 7019 玻纤制品)。

import type { ProductCategory } from "@/lib/sourcing/spec";

// FRP 产品族 → 主 HS 章(4 位,指示性)。
const HS_BY_CATEGORY: Record<ProductCategory, string> = {
  profile: "3916",
  rod: "3916",
  tube: "3916",
  custom: "3916",
  grating: "3925",
  panel: "3925",
  rebar: "7019",
};

export function hsForCategory(cat: ProductCategory): string {
  return HS_BY_CATEGORY[cat] ?? "3916";
}

// 目的国规范化:把自由文本国名/代码收敛到 US / EU / CA(其余→ OTHER)。
const EU_MEMBERS = new Set([
  "EU", "GERMANY", "DE", "FRANCE", "FR", "ITALY", "IT", "SPAIN", "ES", "NETHERLANDS", "NL",
  "BELGIUM", "BE", "POLAND", "PL", "SWEDEN", "SE", "AUSTRIA", "AT", "IRELAND", "IE",
  "DENMARK", "DK", "FINLAND", "FI", "PORTUGAL", "PT", "CZECH", "CZECHIA",
]);
export type TariffRegion = "US" | "EU" | "CA" | "OTHER";

export function normalizeRegion(country?: string | null): TariffRegion {
  if (!country) return "OTHER";
  const c = country.trim().toUpperCase();
  if (["US", "USA", "UNITED STATES", "AMERICA", "U.S.", "U.S.A."].includes(c)) return "US";
  if (["CA", "CANADA"].includes(c)) return "CA";
  if (EU_MEMBERS.has(c)) return "EU";
  return "OTHER";
}

// 指示性进口关税率(MFN 名义,fraction of CIF),按目的国 × HS 章。
const IMPORT_DUTY: Record<TariffRegion, Record<string, number>> = {
  US: { "3916": 0.065, "3925": 0.053, "7019": 0.049, default: 0.06 },
  EU: { "3916": 0.065, "3925": 0.065, "7019": 0.06, default: 0.065 },
  CA: { "3916": 0.065, "3925": 0.065, "7019": 0.0, default: 0.04 },
  OTHER: { default: 0.08 },
};

export function importDutyRate(region: TariffRegion, hs: string): number {
  const t = IMPORT_DUTY[region] ?? IMPORT_DUTY.OTHER;
  return t[hs] ?? t.default;
}

// 中国出口退税率(fraction),按 HS 章。FRP 主 HS 当前多为 13%。
const EXPORT_REBATE: Record<string, number> = { "3916": 0.13, "3925": 0.13, "7019": 0.13, default: 0.13 };
export function exportRebateRate(hs: string): number {
  return EXPORT_REBATE[hs] ?? EXPORT_REBATE.default;
}

// 指示性海运费 USD/kg(整箱均摊;FRP 低密度=泡货,按体积重,故 per-kg 偏高)。
const OCEAN_FREIGHT_USD_PER_KG: Record<TariffRegion, number> = { US: 0.45, EU: 0.4, CA: 0.5, OTHER: 0.55 };
export function oceanFreightPerKg(region: TariffRegion): number {
  return OCEAN_FREIGHT_USD_PER_KG[region];
}

export const PORT_HANDLING_USD_PER_KG = 0.06; // 港杂 + 拖车 + 报关(出口侧)均摊
export const CLEARANCE_USD_PER_KG = 0.05; // 进口清关/代理均摊
export const INSURANCE_RATE = 0.003; // 保险费率(占 CIF)

// 指示性 ex-works 含税 ¥/kg 参考(成品拉挤 FRP),仅当调用方未给 exWorksCnyPerKg 时兜底。
export const EXWORKS_CNY_PER_KG: Record<ProductCategory, number> = {
  profile: 26,
  rod: 24,
  tube: 27,
  custom: 30,
  grating: 30,
  panel: 30,
  rebar: 22,
};

// 指示性交期(天),按产品族(含模具/排产/生产)。
export const LEAD_TIME_DAYS: Record<ProductCategory, number> = {
  profile: 35,
  rod: 30,
  tube: 32,
  custom: 45,
  grating: 35,
  panel: 35,
  rebar: 30,
};
