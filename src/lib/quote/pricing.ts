// 确定性定价引擎 — AI 不参与本文件。
//
// 输入: QuoteInput (已被 Zod 校验过)
// 输出: QuoteResult (前端可直接渲染)
//
// 流程:
//   1) 几何 → 单米重量
//   2) 单米材料成本(玻纤 + 树脂 + 助剂,树脂阻燃乘数提前应用)
//   3) 工艺成本(拉挤时间 × 工时单价 + 牵引切割固定费)
//   4) 表面 / 后处理 / 彩色溢价
//   5) 模具摊销(异形;MVP 五型材都是 0)
//   6) 厂家加价 × 数量曲线 × VAT
//   7) ± band 出区间
//
// engine_version 落到 quoteLogs,便于回放和回归测试。

import { weightKgPerMeter, compositeDensityGcm3 } from "./geometry";
import {
  FIBER_PRICE_CNY_PER_KG,
  RESIN_PRICE_CNY_PER_KG,
  ADDITIVE_CNY_PER_KG_COMPOSITE,
  PROCESS_COEFF,
  SURFACE_VEIL_CNY_PER_M,
  UV_COATING_CNY_PER_M,
  FIRE_RETARDANT_RESIN_MULTIPLIER,
  FOOD_GRADE_CNY_PER_M,
  COLOR_PREMIUM_CNY_PER_M,
  FACTORY_MARGIN,
  VAT,
  QUOTE_BAND,
  PRICE_TABLE_VERSION,
  quantityMultiplier,
} from "./prices";
import type { QuoteInput, QuoteResult } from "./types";

export const ENGINE_VERSION = `engine-1.0+${PRICE_TABLE_VERSION}`;

export function estimate(input: QuoteInput): QuoteResult {
  const warnings: string[] = [];

  const fiberVf = (input.fiber_content_pct ?? 70) / 100;

  // 1) 单米重量
  const wKgPerM = weightKgPerMeter(
    input.geometry,
    input.fiber,
    input.resin,
    input.fiber_content_pct ?? 70,
  );

  // 2) 材料成本 / 米
  const fiberKgPerM = wKgPerM * fiberVf;
  const resinKgPerM = wKgPerM * (1 - fiberVf);
  const resinUnit = RESIN_PRICE_CNY_PER_KG[input.resin] *
    (input.fire_retardant ? FIRE_RETARDANT_RESIN_MULTIPLIER : 1);
  const materialCnyPerM =
    fiberKgPerM * FIBER_PRICE_CNY_PER_KG[input.fiber] +
    resinKgPerM * resinUnit +
    wKgPerM * ADDITIVE_CNY_PER_KG_COMPOSITE;

  // 3) 工艺成本 / 米
  const coeff = PROCESS_COEFF[input.geometry.type];
  const processCnyPerM =
    coeff.laborCnyPerH / coeff.pullSpeedMperH + coeff.fixedCnyPerM;

  // 4) 表面 / 后处理 / 彩色 / 食品级
  const surfaceCnyPerM =
    (input.surface_veil ? SURFACE_VEIL_CNY_PER_M : 0) +
    (input.uv_coating ? UV_COATING_CNY_PER_M : 0) +
    (input.food_grade ? FOOD_GRADE_CNY_PER_M : 0) +
    (COLOR_PREMIUM_CNY_PER_M[input.color] ?? 0);

  // 5) 模具摊销
  const totalMeters = (input.length_mm / 1000) * input.quantity;
  const moldAmortCnyPerM =
    coeff.moldCostCny > 0
      ? coeff.moldCostCny / Math.max(coeff.moqMeters, totalMeters)
      : 0;

  const subtotalCnyPerM =
    materialCnyPerM + processCnyPerM + surfaceCnyPerM + moldAmortCnyPerM;

  // 6) 数量曲线 × 厂家加价
  const qMul = quantityMultiplier(totalMeters, coeff.moqMeters);
  if (qMul > 1) {
    warnings.push(`订单总长 ${totalMeters.toFixed(0)}m 低于该型材起订量 ${coeff.moqMeters}m,粗测含 25% 小批溢价`);
  }
  const marginCnyPerM = subtotalCnyPerM * FACTORY_MARGIN;
  const preTaxCnyPerM = (subtotalCnyPerM + marginCnyPerM) * qMul;

  // 7) VAT + 区间
  const taxCnyPerM = preTaxCnyPerM * VAT;
  const finalCnyPerM = preTaxCnyPerM + taxCnyPerM;

  const low = finalCnyPerM * (1 - QUOTE_BAND);
  const high = finalCnyPerM * (1 + QUOTE_BAND);

  // breakdown:占比基于 finalCnyPerM
  const breakdown: QuoteResult["breakdown"] = [
    {
      key: "material",
      label_zh: "材料",
      label_en: "Material",
      amount_per_meter_cny: round2(materialCnyPerM * qMul),
      pct: round1((materialCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "process",
      label_zh: "工艺",
      label_en: "Process",
      amount_per_meter_cny: round2(processCnyPerM * qMul),
      pct: round1((processCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "surface",
      label_zh: "表面/后处理",
      label_en: "Surface / Finishing",
      amount_per_meter_cny: round2(surfaceCnyPerM * qMul),
      pct: round1((surfaceCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "mold",
      label_zh: "模具摊销",
      label_en: "Mold Amortization",
      amount_per_meter_cny: round2(moldAmortCnyPerM * qMul),
      pct: round1((moldAmortCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "margin",
      label_zh: "厂家利润",
      label_en: "Margin",
      amount_per_meter_cny: round2(marginCnyPerM * qMul),
      pct: round1((marginCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "tax",
      label_zh: "增值税",
      label_en: "VAT",
      amount_per_meter_cny: round2(taxCnyPerM),
      pct: round1((taxCnyPerM / finalCnyPerM) * 100),
    },
  ];

  // 数值稳定性兜底:全部 ≥ 0
  if (low < 0 || high < 0) {
    warnings.push("定价异常:出现负值,请联系工厂人工报价");
  }

  // 极端尺寸 sanity check
  if (wKgPerM > 50) {
    warnings.push(`单米重量 ${wKgPerM.toFixed(1)} kg 偏大,粗测精度下降`);
  }
  if (wKgPerM < 0.1) {
    warnings.push("截面过小,粗测精度下降,建议人工核价");
  }

  // 复材密度合理范围 1.0-2.2;超出加警告
  const rho = compositeDensityGcm3(
    input.fiber,
    input.resin,
    input.fiber_content_pct ?? 70,
  );
  if (rho < 1.0 || rho > 2.2) {
    warnings.push(`推算密度 ${rho.toFixed(2)} g/cm³ 超出常见范围,精度下降`);
  }

  return {
    unit_price_low_cny: round2(low),
    unit_price_high_cny: round2(high),
    total_low_cny: round2(low * totalMeters),
    total_high_cny: round2(high * totalMeters),
    weight_kg_per_m: round2(wKgPerM),
    total_meters: round2(totalMeters),
    total_weight_kg: round2(wKgPerM * totalMeters),
    breakdown,
    band: QUOTE_BAND,
    warnings,
    engine_version: ENGINE_VERSION,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
