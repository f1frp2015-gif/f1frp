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

import {
  weightKgPerMeter, compositeDensityGcm3,
  outerPerimeterMm, innerPerimeterMm,
} from "./geometry";
import {
  FIBER_PRICE_CNY_PER_KG,
  RESIN_PRICE_CNY_PER_KG,
  ADDITIVE_CNY_PER_KG_COMPOSITE,
  PROCESS_COEFF,
  CUSTOM_PROCESS_BY_COMPLEXITY,
  SURFACE_VEIL_GSM,
  SURFACE_VEIL_CNY_PER_KG,
  INNER_VEIL_GSM,
  INNER_VEIL_CNY_PER_KG,
  UV_COATING_CNY_PER_M,
  FIRE_RETARDANT_RESIN_MULTIPLIER,
  FOOD_GRADE_CNY_PER_M,
  COLOR_PREMIUM_CNY_PER_M,
  MACHINING_DEFAULT_CNY_PER_PIECE,
  PAINTING_DEFAULT_CNY_PER_M2,
  PAINTING_DEFAULT_COVERAGE,
  PACKAGING_CNY_PER_M,
  FREIGHT_CNY_PER_M,
  YIELD_RATE,
  ADMIN_FEE_RATE,
  DEFAULT_MOLD_LIFE_M,
  FACTORY_MARGIN,
  VAT,
  QUOTE_BAND,
  PRICE_TABLE_VERSION,
  quantityMultiplier,
} from "./prices";
import type { QuoteInput, QuoteResult } from "./types";

export const ENGINE_VERSION = `engine-3.2+${PRICE_TABLE_VERSION}`;

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

  // 2) 材料成本 / 米 — 加成品率调整(损耗 2%)
  const fiberKgPerM = wKgPerM * fiberVf;
  const resinKgPerM = wKgPerM * (1 - fiberVf);
  const resinUnit = RESIN_PRICE_CNY_PER_KG[input.resin] *
    (input.fire_retardant ? FIRE_RETARDANT_RESIN_MULTIPLIER : 1);
  const materialBeforeYieldCnyPerM =
    fiberKgPerM * FIBER_PRICE_CNY_PER_KG[input.fiber] +
    resinKgPerM * resinUnit +
    wKgPerM * ADDITIVE_CNY_PER_KG_COMPOSITE;
  const materialCnyPerM = materialBeforeYieldCnyPerM / YIELD_RATE;

  // 3) 工艺成本 / 米 — v2.1 公式(对齐行业拉挤报价核算):
  //    有效 m/h = m/min × 模具出数(1 出 N) × 60
  //    工艺 ¥/m = 等效台时费 / 有效 m/h + 固定每米费
  const coeff =
    input.geometry.type === "custom"
      ? CUSTOM_PROCESS_BY_COMPLEXITY[input.geometry.complexity]
      : PROCESS_COEFF[input.geometry.type];
  const cavities = input.cavities ?? coeff.cavitiesDefault;
  const effectiveMperH = coeff.pullSpeedMperMin * cavities * 60;
  const processCnyPerM =
    coeff.laborCnyPerH / effectiveMperH + coeff.fixedCnyPerM;

  // 4) 织物增强(表面毡 + 内毡)— 周长 × GSM × ¥/kg
  //    表面毡 & 内毡:周长(mm)/1000 = m,× 1m 长 = m² 面积,× g/m² = g,× ¥/kg / 1000 = ¥
  const outerPerimMm = outerPerimeterMm(input.geometry);
  const innerPerimMm = innerPerimeterMm(input.geometry);
  const surfaceMatCnyPerM = input.surface_veil
    ? ((outerPerimMm / 1000) * SURFACE_VEIL_GSM * SURFACE_VEIL_CNY_PER_KG) / 1000
    : 0;
  const innerMatCnyPerM = input.inner_veil && innerPerimMm > 0
    ? ((innerPerimMm / 1000) * INNER_VEIL_GSM * INNER_VEIL_CNY_PER_KG) / 1000
    : 0;
  if (input.inner_veil && innerPerimMm === 0) {
    warnings.push("开口型材(角铁 / 槽钢 / 工字梁)无内表面,内毡选项已忽略");
  }
  const fabricReinfCnyPerM = surfaceMatCnyPerM + innerMatCnyPerM;

  // 4.5) 表面涂装(UV / 食品级 / 颜色溢价)— 装饰 + 户外耐候层,
  //      与"织物增强"语义分开,作为独立 breakdown 项
  const surfaceCoatingCnyPerM =
    (input.uv_coating ? UV_COATING_CNY_PER_M : 0) +
    (input.food_grade ? FOOD_GRADE_CNY_PER_M : 0) +
    (COLOR_PREMIUM_CNY_PER_M[input.color] ?? 0);

  // 5) 模具摊销 — v2 改:按"模具寿命米数"摊,与订单量解耦
  // (行业拉挤报价核算口径;之前 max(MOQ, 总米数)对小批严重高估)
  const totalMeters = (input.length_mm / 1000) * input.quantity;
  const moldLife = coeff.moldLifeMeters ?? DEFAULT_MOLD_LIFE_M;
  const moldAmortCnyPerM =
    coeff.moldCostCny > 0 ? coeff.moldCostCny / moldLife : 0;

  // 5.5) 后加工 / 包装 / 运费 — v3.2 拆细:机加工(¥/件÷长度)+ 喷涂(周长×覆盖率×¥/m²)
  const pieceLenM = input.length_mm / 1000;
  const machiningCnyPerM = input.machining && pieceLenM > 0
    ? MACHINING_DEFAULT_CNY_PER_PIECE / pieceLenM
    : 0;
  // 喷涂:1m 长 × (外周长 / 1000) m × 覆盖率 = m² 面积,× ¥/m² = ¥/m
  const paintingCnyPerM = input.painting
    ? (outerPerimMm / 1000) * PAINTING_DEFAULT_COVERAGE * PAINTING_DEFAULT_CNY_PER_M2
    : 0;
  const packagingCnyPerM = input.packaging ? PACKAGING_CNY_PER_M : 0;
  const freightCnyPerM = input.freight ? FREIGHT_CNY_PER_M : 0;

  // 6) 全部制造成本
  const allManuCnyPerM =
    materialCnyPerM + processCnyPerM +
    fabricReinfCnyPerM + surfaceCoatingCnyPerM +
    moldAmortCnyPerM +
    machiningCnyPerM + paintingCnyPerM +
    packagingCnyPerM + freightCnyPerM;

  // 7) 数量曲线 — 小批量溢价(模具已按寿命摊,这里仅反映厂家对小订单的额外加价意愿)
  const qMul = quantityMultiplier(totalMeters, coeff.moqMeters);
  if (qMul > 1) {
    warnings.push(`订单总长 ${totalMeters.toFixed(0)}m 低于该型材起订量 ${coeff.moqMeters}m,粗测含 25% 小批溢价`);
  }
  const allManuQAdjustedCnyPerM = allManuCnyPerM * qMul;

  // 8) 管理费(国玻 v2 链式口径:在全制造成本之上加 11%)
  const adminCnyPerM = allManuQAdjustedCnyPerM * ADMIN_FEE_RATE;

  // 9) 成本合计 D = 全制造 + 管理
  const costSumCnyPerM = allManuQAdjustedCnyPerM + adminCnyPerM;

  // 10) 利润
  const marginCnyPerM = costSumCnyPerM * FACTORY_MARGIN;

  // 11) 不含税 + 12) 增值税 + 13) 最终
  const preTaxCnyPerM = costSumCnyPerM + marginCnyPerM;
  const taxCnyPerM = preTaxCnyPerM * VAT;
  const finalCnyPerM = preTaxCnyPerM + taxCnyPerM;

  const low = finalCnyPerM * (1 - QUOTE_BAND);
  const high = finalCnyPerM * (1 + QUOTE_BAND);

  // breakdown:占比基于 finalCnyPerM。每项金额都已含数量曲线 qMul。
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
      key: "fabric_reinforcement",
      label_zh: "织物增强",
      label_en: "Fabric reinforcement",
      amount_per_meter_cny: round2(fabricReinfCnyPerM * qMul),
      pct: round1((fabricReinfCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "surface_coating",
      label_zh: "表面涂装",
      label_en: "Surface coating",
      amount_per_meter_cny: round2(surfaceCoatingCnyPerM * qMul),
      pct: round1((surfaceCoatingCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "mold",
      label_zh: "模具摊销",
      label_en: "Mold Amortization",
      amount_per_meter_cny: round2(moldAmortCnyPerM * qMul),
      pct: round1((moldAmortCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "machining",
      label_zh: "机加工",
      label_en: "Machining",
      amount_per_meter_cny: round2(machiningCnyPerM * qMul),
      pct: round1((machiningCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "painting",
      label_zh: "喷涂",
      label_en: "Painting",
      amount_per_meter_cny: round2(paintingCnyPerM * qMul),
      pct: round1((paintingCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "packaging",
      label_zh: "包装",
      label_en: "Packaging",
      amount_per_meter_cny: round2(packagingCnyPerM * qMul),
      pct: round1((packagingCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "freight",
      label_zh: "运费",
      label_en: "Freight",
      amount_per_meter_cny: round2(freightCnyPerM * qMul),
      pct: round1((freightCnyPerM * qMul / finalCnyPerM) * 100),
    },
    {
      key: "admin",
      label_zh: "管理费",
      label_en: "Admin",
      amount_per_meter_cny: round2(adminCnyPerM),
      pct: round1((adminCnyPerM / finalCnyPerM) * 100),
    },
    {
      key: "margin",
      label_zh: "厂家利润",
      label_en: "Margin",
      amount_per_meter_cny: round2(marginCnyPerM),
      pct: round1((marginCnyPerM / finalCnyPerM) * 100),
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
