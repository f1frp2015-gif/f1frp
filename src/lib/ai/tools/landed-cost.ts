import { tool } from "ai";
import { z } from "zod";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/sourcing/spec";
import { computeLanded } from "@/lib/quote/landed";
import { loadPublishedRemedies } from "@/lib/data/trade-remedy-db";

// Sourcing Desk · step 3 — "Indicative Landed Cost (USD)".
// Given a buyer's spec + destination, returns USD FOB / CIF / DDP RANGES via the
// deterministic export cost ladder (ex-works ¥/kg → VAT rebate → 曜一 markup →
// FX → freight/insurance → import duty). Atomic data + explicit caveat (per
// feedback_ai_tool_atomic_data): an INDICATIVE range to set buyer expectations,
// NOT a quote — exact USD PI comes from the F1 Composite (曜一) team after spec
// lock. The model never computes price itself; it calls this.
export function makeLandedCostTool() {
  return tool({
    description:
      "Estimate the INDICATIVE landed cost in USD (FOB / CIF / DDP ranges) for sourcing an FRP product from China to an overseas destination. " +
      "Call this after feasibility_match, when the buyer wants a price ballpark — e.g. 'how much would that cost landed in the US?', 'ballpark DDP price?', '到岸价大概多少'. " +
      "Returns fobUsdPerKg / cifUsdPerKg / ddpUsdPerKg ranges (and totals when quantityKg is known), lead time, the cost-ladder basis, and a confidence level. " +
      "Pass exWorksCnyPerKg ONLY if a precise ex-works ¥/kg is already known (e.g. from a prior quote); otherwise omit it and the tool uses a category reference (lower confidence). " +
      "ALWAYS present it as a RANGE and ALWAYS pass through `caveat` verbatim. When `remedyWarning` is present, ALSO surface `ddpWithRemedyUsdPerKg` (the AD/CVD / Section-301 exposure CEILING) and pass `remedyWarning` verbatim — whether it applies and the exact rate depend on per-order HS classification + origin, so NEVER assert a hard duty rate yourself. It is indicative, not a binding quote. For feasibility/suppliers use feasibility_match; for regulatory blockers use compliance_flags.",
    inputSchema: z.object({
      productCategory: z
        .enum([...PRODUCT_CATEGORIES] as [ProductCategory, ...ProductCategory[]])
        .describe("FRP product family (same set as feasibility_match): profile / grating / rebar / rod / tube / panel / custom."),
      destinationCountry: z
        .string()
        .optional()
        .describe('Destination country/market, e.g. "US", "Germany", "Canada". Drives import duty + freight (P0 covers US/EU/CA; others get a generic rate).'),
      quantityKg: z.number().positive().optional().describe("Order quantity in kg, if known — adds total USD ranges alongside per-kg."),
      exWorksCnyPerKg: z
        .number()
        .positive()
        .optional()
        .describe("Precise ex-works 含税 ¥/kg if already known (e.g. from the quote engine). Omit to use a category reference (confidence drops to 'low')."),
    }),
    execute: async (input) => {
      // v2:注入"可更新版"已发布措施(DB);空/失败 → computeLanded 内部回退静态种子。
      const remedyMeasures = await loadPublishedRemedies();
      const r = computeLanded(input, { remedyMeasures });
      return {
        hs: r.hs,
        region: r.region,
        exWorksCnyPerKg: r.exWorksCnyPerKg,
        fobUsdPerKg: r.fobUsdPerKg,
        cifUsdPerKg: r.cifUsdPerKg,
        ddpUsdPerKg: r.ddpUsdPerKg,
        fobUsdTotal: r.fobUsdTotal,
        cifUsdTotal: r.cifUsdTotal,
        ddpUsdTotal: r.ddpUsdTotal,
        ddpWithRemedyUsdPerKg: r.ddpWithRemedyUsdPerKg ?? null,
        ddpWithRemedyUsdTotal: r.ddpWithRemedyUsdTotal ?? null,
        adCvdPct: r.adCvdPct ?? null,
        remedyMeasures: r.remedyMeasures ?? null,
        remedyUncertain: r.remedyUncertain ?? null,
        remedyWarning: r.remedyWarning ?? null,
        leadTimeDays: r.leadTimeDays,
        confidence: r.confidence,
        summary:
          `${input.productCategory} → ${r.region}: DDP ≈ $${r.ddpUsdPerKg.low}–${r.ddpUsdPerKg.high}/kg` +
          (r.ddpUsdTotal ? ` (total ≈ $${r.ddpUsdTotal.low}–${r.ddpUsdTotal.high})` : "") +
          `; FOB $${r.fobUsdPerKg.low}–${r.fobUsdPerKg.high}/kg, CIF $${r.cifUsdPerKg.low}–${r.cifUsdPerKg.high}/kg; lead ~${r.leadTimeDays}d.` +
          (r.ddpWithRemedyUsdPerKg
            ? ` ⚠️ 含贸易救济敞口上限 DDP 可达 $${r.ddpWithRemedyUsdPerKg.low}–${r.ddpWithRemedyUsdPerKg.high}/kg。${r.remedyWarning ?? ""}`
            : "") +
          ` ${r.basis}`,
        basis: r.basis,
        caveat: r.caveat,
      };
    },
  });
}
