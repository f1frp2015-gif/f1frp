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
//
// 2026-05-30 v2.1 校准 — 跟行业拉挤报价核算口径对齐:
//   速度用 m/min × 出数 × 60 表达(之前是固定 m/h);
//   工时单价是"等效台时费"(含人工 + 折旧 + 厂房 + 电费 + 物料消耗 + 其他),
//   合并到一个数字便于粗测,数学上 = Excel 拆 7 项之和。

export type ProcessCoeff = {
  // 基础拉挤线速 m/min — 行业典型 0.2-1.2 m/min,看截面复杂度。
  // 有效 m/h = pullSpeedMperMin × cavities(模具出数 1 出 N)× 60。
  pullSpeedMperMin: number;
  // 默认模具出数 1 出 N(标准型材绝大多数 1 出 1,异形看模具设计)
  cavitiesDefault: number;
  // 等效台时费 CNY/h(人工 + 折旧 + 厂房 + 电费 + 物料消耗 + 其他制造合并)
  laborCnyPerH: number;
  // 牵引 / 切割 / 检测 / 包装边际等"每米固定"费用
  fixedCnyPerM: number;
  // 模具一次性投入 CNY(标准截面取 0,异形才 > 0)
  moldCostCny: number;
  // 起订量 m(< 起订量 quantityMultiplier 给小批量溢价)
  moqMeters: number;
  // 模具寿命米数(异形必填,默认 DEFAULT_MOLD_LIFE_M)
  moldLifeMeters?: number;
};

// 六种标准型材的工艺基线
// 速度按"截面越小越快、对称越规整越快"的工程规律
//
// 2026-05-30 v2.2 校准 — laborCnyPerH 从 280-440 降到 60-110,跟用户
// 实际经营对账:
//   单人月综合 ¥10k / 月工时 312h = ¥32/h(纯人工)
//   一人多机 0.5 人配置 + 24h 双班 → 等效线人工 ¥16/h
//   制造费用 7 项(折旧/厂房/电费/物料/其他)合计 ¥24-48/h
//   合并"等效台时费" ≈ ¥40-80/h(标准型材)→ 90-110(异形 complex)
// 解决了我审核报告里"工时单价偏高 3-5 倍"那条偏差。
export const PROCESS_COEFF: Record<ProfileType, ProcessCoeff> = {
  round: {
    pullSpeedMperMin: 0.8,  // 48 m/h × 1 出 1 = 48 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 60,
    fixedCnyPerM: 2.5,
    moldCostCny: 0,
    moqMeters: 100,
  },
  square: {
    pullSpeedMperMin: 0.6,  // 36 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 70,
    fixedCnyPerM: 3.0,
    moldCostCny: 0,
    moqMeters: 100,
  },
  rect: {
    pullSpeedMperMin: 0.5,  // 30 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 75,
    fixedCnyPerM: 3.2,
    moldCostCny: 0,
    moqMeters: 150,
  },
  angle: {
    pullSpeedMperMin: 0.7,  // 42 m/h(开口截面薄,快)
    cavitiesDefault: 1,
    laborCnyPerH: 60,
    fixedCnyPerM: 2.8,
    moldCostCny: 0,
    moqMeters: 100,
  },
  channel: {
    pullSpeedMperMin: 0.4,  // 24 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 80,
    fixedCnyPerM: 3.5,
    moldCostCny: 0,
    moqMeters: 200,
  },
  i_beam: {
    pullSpeedMperMin: 0.3,  // 18 m/h(对称双翼,模具最复杂)
    cavitiesDefault: 1,
    laborCnyPerH: 90,
    fixedCnyPerM: 4.0,
    moldCostCny: 0,
    moqMeters: 200,
  },
  // custom 见下方 CUSTOM_PROCESS_BY_COMPLEXITY,这里仅为 type 完备占位
  custom: {
    pullSpeedMperMin: 0.35,
    cavitiesDefault: 1,
    laborCnyPerH: 90,
    fixedCnyPerM: 4.5,
    moldCostCny: 50000,
    moqMeters: 300,
  },
};

// 异形按复杂度三档分摊模具 + 工艺系数。
// 国内拉挤模具行业典型:
//   简单(2-3 个对称特征,接近标准截面)  → ¥20-30k,速度近标准
//   中等(多个非对称特征 / 嵌入件预留)   → ¥40-70k,速度 -25%
//   复杂(异形薄壁 / 多腔 / 嵌件 / 双密度)→ ¥80-150k,速度 -50%
export const CUSTOM_PROCESS_BY_COMPLEXITY: Record<
  "simple" | "medium" | "complex",
  ProcessCoeff
> = {
  simple: {
    pullSpeedMperMin: 0.5,  // 30 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 75,
    fixedCnyPerM: 3.5,
    moldCostCny: 25000,
    moqMeters: 200,
  },
  medium: {
    pullSpeedMperMin: 0.35, // 21 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 90,
    fixedCnyPerM: 4.5,
    moldCostCny: 55000,
    moqMeters: 300,
  },
  complex: {
    pullSpeedMperMin: 0.20, // 12 m/h
    cavitiesDefault: 1,
    laborCnyPerH: 110,
    fixedCnyPerM: 6.0,
    moldCostCny: 110000,
    moqMeters: 500,
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
//
// 2026-05-30 v2 口径升级 — 从行业拉挤报价核算表提炼的通用工程公式
// (不含任何客户名 / 终端价 / 第三方商业秘密;以下数字均为行业典型常数,
//  与教材 / 标准 / 公开报价模板一致)。
//
// 链式定价流程:
//   原材料合计 / 成品率              (成品率 0.98 → +2% 损耗)
//   + 工艺(人工 + 时摊)
//   + 表面 / 内毡 / 后处理
//   + 模具摊销(寿命米数基底)        — 异形 custom 才 > 0
//   = 全部制造成本
//   × (1 + 管理费率 11%)             — 国玻 v2 表 r78 默认
//   × 数量曲线
//   × (1 + 利润率 20%)
//   × (1 + 增值税 13%)
//   = 最终单米报价
//   ± 15% 粗测区间

// 成品率(yield) — 损耗约 2% 由材料分摊
export const YIELD_RATE = 0.98;

// 管理费率 — 分摊在全制造成本之上(行业典型 8-13%,取中)
export const ADMIN_FEE_RATE = 0.11;

// 模具寿命默认值(米)— 异形 custom 模具按寿命摊
// 行业典型 20000-50000 m,取中
export const DEFAULT_MOLD_LIFE_M = 30000;

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
export const PRICE_TABLE_VERSION = "2026-05-30-r3";
