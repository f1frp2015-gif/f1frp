// 拉挤型材 粗测价目表 / 工艺系数
//
// ⚠️ MVP 阶段在 TS 内常量维护,等 quoteLogs 跑出稳定行情(~3 个月)后迁 Postgres
// 表 + 周更 cron。每个数字下方注释源出处,改动时务必同步更新。
//
// 责任人:ori
// 数据源:
//   1) 巨石 / 中复神鹰 / 上纬 等公开报价(2026-Q2 均值)
//   2) 风渡复材代理工厂工艺基线(电费 / 人力 / 模具摊销,2026-04 采样)
//   3) GB/T 24768 拉挤工艺标准对常用截面拉挤速度的参考值
//
// 单价口径:CNY / kg(材料)或 CNY / 工时(工艺)或 CNY 一次性(模具)
// 含税口径:不含税,税在 pricing.ts 最后一步加上 (1 + VAT)。

import type { Fiber, Resin, ProfileType } from "./types";

// ─── 材料单价 CNY/kg(均值,不含税) ────────────────────────────

export const FIBER_PRICE_CNY_PER_KG: Record<Fiber, number> = {
  e_glass: 6.8,    // 2400 tex 直接纱
  ecr_glass: 9.5,  // 耐腐蚀 ECR
  carbon: 95,      // T300 12K(国产);进口约 140
  hybrid: 38,      // 玻碳混编,粗估
};

export const RESIN_PRICE_CNY_PER_KG: Record<Resin, number> = {
  up: 12,           // 通用不饱和聚酯
  epoxy: 22,        // 双酚 A 型环氧 + 固化剂体系平均
  ve: 24,           // 乙烯基酯
  phenolic: 28,     // 酚醛(储存与处理更复杂,溢价)
  pu: 26,           // 聚氨酯(光面 / 高强方向)
};

// 助剂(脱模剂 / 引发剂 / 颜料)粗估 — 每 kg 复材摊 0.3-0.5 元
export const ADDITIVE_CNY_PER_KG_COMPOSITE = 0.4;

// ─── 工艺系数 ──────────────────────────────────────────────────

export type ProcessCoeff = {
  // 拉挤速度 m/h(同时多型材线时按线 hr 摊)
  pullSpeedMperH: number;
  // 工时单价 CNY/h(含设备 + 人力 + 电费 + 厂房摊销)
  laborCnyPerH: number;
  // 牵引 / 切割 / 检测 / 包装 等固定每米费用
  fixedCnyPerM: number;
  // 模具一次性投入 CNY(标准截面取 0,异形才 > 0;后续异形模式接入)
  moldCostCny: number;
  // 起订量 m(<起订量按 MOQ 整批摊销 + 加价)
  moqMeters: number;
};

// 五种标准型材的工艺基线
export const PROCESS_COEFF: Record<ProfileType, ProcessCoeff> = {
  round: {
    pullSpeedMperH: 18,    // 圆管最快
    laborCnyPerH: 420,
    fixedCnyPerM: 2.5,
    moldCostCny: 0,
    moqMeters: 100,
  },
  square: {
    pullSpeedMperH: 14,
    laborCnyPerH: 460,
    fixedCnyPerM: 3.0,
    moldCostCny: 0,
    moqMeters: 100,
  },
  rect: {
    pullSpeedMperH: 12,
    laborCnyPerH: 480,
    fixedCnyPerM: 3.2,
    moldCostCny: 0,
    moqMeters: 150,
  },
  angle: {
    pullSpeedMperH: 16,
    laborCnyPerH: 440,
    fixedCnyPerM: 2.8,
    moldCostCny: 0,
    moqMeters: 100,
  },
  channel: {
    pullSpeedMperH: 11,
    laborCnyPerH: 500,
    fixedCnyPerM: 3.5,
    moldCostCny: 0,
    moqMeters: 200,
  },
  i_beam: {
    // 工字梁:对称双翼缘 + 腹板,模具最复杂 / 拉挤速度最慢。
    // 国内主流玻纤 I-beam 拉挤线速 8-12 m/h(单线),粗测口径取 9。
    pullSpeedMperH: 9,
    laborCnyPerH: 520,
    fixedCnyPerM: 4.0,
    moldCostCny: 0,
    moqMeters: 200,
  },
};

// ─── 后处理 / 选项溢价 ─────────────────────────────────────────

// 表面毡(surface mat / decorative veil)— 工程口径 2026-05-29 升级:
//   不再用 ¥/m 常数,改成 "外周长 × 面密度 × 单价" 真实推算。
// 默认 240 g/m² 高端薄装饰毡档(可见装饰层 / UV 阻挡),
// 单价 ¥110/kg(高端档,主流 ECR/PET 复合毡)。
// Phase 2 可以拆成"薄毡 30g/m² / 中 60 / 结构层 CSM 450g/m²"多档,UI 选项化。
export const SURFACE_VEIL_GSM = 240;
export const SURFACE_VEIL_CNY_PER_KG = 110;

// 内毡(inner mat)— 闭口型材(圆管 / 方管 / 矩管)内表面增强 / 防腐毡。
// 同档面密度 + 单价(粗测口径简化)。开口型材几何上拿不到内周长,自动 0。
export const INNER_VEIL_GSM = 240;
export const INNER_VEIL_CNY_PER_KG = 110;

// UV 涂层 CNY/m;面积越大越贵但粗测用常数
export const UV_COATING_CNY_PER_M = 4.0;

// 阻燃:用 ATH 阻燃剂改性树脂,直接乘到树脂成本上
export const FIRE_RETARDANT_RESIN_MULTIPLIER = 1.18;

// 食品级:目前粗测口径直接加单米固定费(更严格的认证由 RFQ 走人工)
export const FOOD_GRADE_CNY_PER_M = 6.0;

// 彩色非标(custom RAL)— 标准灰免费;黑 / 白 +1;custom +3.5
export const COLOR_PREMIUM_CNY_PER_M: Record<string, number> = {
  gray: 0,
  black: 1.0,
  white: 1.0,
  custom: 3.5,
};

// ─── 商业层 ─────────────────────────────────────────────────────

// 厂家利润率(粗测口径,代理曜一加价不在此层)
export const FACTORY_MARGIN = 0.20;

// 中国增值税
export const VAT = 0.13;

// 区间带宽 ±band
export const QUOTE_BAND = 0.15;

// ─── 数量曲线 ──────────────────────────────────────────────────

// 输入总米数,返回数量系数(< 1 = 折扣,> 1 = 溢价)
// 阶梯:
//   < MOQ           → 1.25 (起订量以下小批溢价)
//   MOQ .. 1000     → 1.00
//   1000 .. 5000    → 0.95
//   5000 .. 20000   → 0.92
//   > 20000         → 0.88
export function quantityMultiplier(totalMeters: number, moq: number): number {
  if (totalMeters < moq) return 1.25;
  if (totalMeters < 1000) return 1.00;
  if (totalMeters < 5000) return 0.95;
  if (totalMeters < 20000) return 0.92;
  return 0.88;
}

// 价目版本(随价目表更新时手动 bump,会落到 quoteLogs.engine_version)
export const PRICE_TABLE_VERSION = "2026-05-29-r1";
