// getfrp Sourcing Desk · P0 缺口 A 逻辑层 — Indicative Landed Cost (USD)。
//
// 在确定性出口成本阶梯上,从 ex-works 含税 ¥/kg 一路叠到 USD FOB / CIF / DDP 区间。
// 口径对齐出海手册 / `f1-export-quote` skill:
//   ex-works 含税 ¥/kg → 退税抵 VAT → 曜一加价 → 汇率→USD → +港杂=FOB
//     → +海运+保险=CIF → +进口关税(HS×目的国)+清关 = DDP
// 复用 prices.ts 常数(VAT / OVERSEAS_MARKUP / USD_CNY_RATE / QUOTE_BAND),
// 关税/退税/运费/兜底单价走 data/tariff.ts。**纯函数,不碰 DB / 不调 LLM**
// (对齐 memory feedback_ai_tool_atomic_data:AI 只编排,价格走确定性计算)。

import { VAT, OVERSEAS_MARKUP, USD_CNY_RATE, QUOTE_BAND } from "./prices";
import type { ProductCategory } from "@/lib/sourcing/spec";
import {
  hsForCategory,
  normalizeRegion,
  importDutyRate,
  exportRebateRate,
  oceanFreightPerKg,
  PORT_HANDLING_USD_PER_KG,
  CLEARANCE_USD_PER_KG,
  INSURANCE_RATE,
  EXWORKS_CNY_PER_KG,
  LEAD_TIME_DAYS,
  type TariffRegion,
} from "@/lib/data/tariff";

export type LandedInput = {
  productCategory: ProductCategory;
  destinationCountry?: string;
  quantityKg?: number;
  /** Optional precise ex-works 含税 ¥/kg (e.g. from the quote engine). Omit → category fallback (lower confidence). */
  exWorksCnyPerKg?: number;
};

export type UsdRange = { low: number; high: number };

export type LandedResult = {
  hs: string;
  region: TariffRegion;
  exWorksCnyPerKg: number;
  fobUsdPerKg: UsdRange;
  cifUsdPerKg: UsdRange;
  ddpUsdPerKg: UsdRange;
  fobUsdTotal: UsdRange | null;
  cifUsdTotal: UsdRange | null;
  ddpUsdTotal: UsdRange | null;
  leadTimeDays: number;
  confidence: "low" | "medium";
  basis: string;
  caveat: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round0 = (n: number) => Math.round(n);

export function computeLanded(input: LandedInput): LandedResult {
  const cat = input.productCategory;
  const region = normalizeRegion(input.destinationCountry);
  const hs = hsForCategory(cat);

  const exWorks = input.exWorksCnyPerKg ?? EXWORKS_CNY_PER_KG[cat] ?? 26;
  const confidence: "low" | "medium" = input.exWorksCnyPerKg ? "medium" : "low";

  // 1) 退税抵 VAT:出口退税抵掉部分进项 VAT,降低有效成本。
  const rebate = exportRebateRate(hs);
  const netCny = exWorks * (1 - rebate / (1 + VAT));
  // 2) 曜一加价(出口代理服务 + margin),3) 汇率 → USD。
  const exwUsd = (netCny * (1 + OVERSEAS_MARKUP)) / USD_CNY_RATE;
  // 4) FOB = ex-works USD + 出口港杂。
  const fob = exwUsd + PORT_HANDLING_USD_PER_KG;
  // 5) CIF = FOB + 海运 + 保险(保险按 CIF 计 → 解出 CIF)。
  const freight = oceanFreightPerKg(region);
  const cif = (fob + freight) / (1 - INSURANCE_RATE);
  // 6) DDP = CIF + 进口关税(HS×目的国) + 清关。
  const duty = importDutyRate(region, hs);
  const ddp = cif * (1 + duty) + CLEARANCE_USD_PER_KG;

  const band = QUOTE_BAND;
  const range = (v: number): UsdRange => ({ low: round2(v * (1 - band)), high: round2(v * (1 + band)) });
  const total = (r: UsdRange, qty: number): UsdRange => ({ low: round2(r.low * qty), high: round2(r.high * qty) });

  const fobR = range(fob);
  const cifR = range(cif);
  const ddpR = range(ddp);
  const qty = input.quantityKg && input.quantityKg > 0 ? input.quantityKg : null;

  return {
    hs,
    region,
    exWorksCnyPerKg: round2(exWorks),
    fobUsdPerKg: fobR,
    cifUsdPerKg: cifR,
    ddpUsdPerKg: ddpR,
    fobUsdTotal: qty ? total(fobR, qty) : null,
    cifUsdTotal: qty ? total(cifR, qty) : null,
    ddpUsdTotal: qty ? total(ddpR, qty) : null,
    leadTimeDays: LEAD_TIME_DAYS[cat] ?? 35,
    confidence,
    basis:
      `ex-works 含税 ¥${round2(exWorks)}/kg(${input.exWorksCnyPerKg ? "调用方给定" : `${cat} 类目兜底参考`})` +
      ` → 退税 ${round0(rebate * 100)}% 抵 VAT → 曜一加价 ${round0(OVERSEAS_MARKUP * 100)}% → 汇率 ¥${USD_CNY_RATE}/$ → +港杂(FOB)` +
      ` → +海运$${freight}/kg+保险(CIF) → +关税 ${round0(duty * 100)}%(HS ${hs} · ${region})+清关 = DDP。区间 ±${round0(band * 100)}%。`,
    caveat:
      "Indicative landed-cost RANGE, not a quote. HS/duty/freight/ex-works are P0 reference values — excludes anti-dumping/CVD, US Section 301 China surcharges, origin add-ons, US inland delivery, and any certification premium. Exact USD PI is issued by the F1 Composite (曜一) team after spec lock + HS confirmation.",
  };
}
