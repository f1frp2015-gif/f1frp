// AI 粗测型材报价 — 共享类型 / Zod schema
//
// 设计原则:AI 抽取与确定性定价引擎都依赖这一份 schema,保证"AI 说的话"
// 一定能被引擎消化,引擎吐出的结果一定能被前端渲染。
//
// 为什么所有数值字段都不带单位后缀:统一约定 mm / kg / m / CNY,见各字段注释。
// 这样 AI 抽取不需要管单位转换,定价引擎也不需要 unit-checked 数学。

import { z } from "zod";

// ─── 几何 / 截面 ────────────────────────────────────────────────

export const ProfileTypeEnum = z.enum([
  "round",   // 圆管
  "square",  // 方管(等边)
  "rect",    // 矩管
  "angle",   // 角铁(等边 L)
  "channel", // 槽钢 / U 型
  "i_beam",  // 工字梁 / H 型 / I-beam
  "custom",  // 异形 — 用户直接输入截面积 + 周长 + 复杂度
]);
export type ProfileType = z.infer<typeof ProfileTypeEnum>;

// 异形复杂度 — 决定模具一次性投入 + 拉挤工艺系数。
// 详见 prices.ts CUSTOM_PROCESS_BY_COMPLEXITY。
export const ComplexityEnum = z.enum(["simple", "medium", "complex"]);
export type Complexity = z.infer<typeof ComplexityEnum>;

export const RoundGeom = z.object({
  type: z.literal("round"),
  od: z.number().min(2).max(500),  // 外径 mm
  id: z.number().min(0).max(498),  // 内径 mm; 实心管 id=0
});

export const SquareGeom = z.object({
  type: z.literal("square"),
  side: z.number().min(5).max(500), // 边长 mm
  t: z.number().min(1).max(50),     // 壁厚 mm
});

export const RectGeom = z.object({
  type: z.literal("rect"),
  w: z.number().min(5).max(500),
  h: z.number().min(5).max(500),
  t: z.number().min(1).max(50),
});

export const AngleGeom = z.object({
  type: z.literal("angle"),
  leg: z.number().min(10).max(300),
  t: z.number().min(2).max(20),
});

export const ChannelGeom = z.object({
  type: z.literal("channel"),
  w: z.number().min(20).max(300),   // 翼缘 / 腹板宽 mm
  h: z.number().min(20).max(300),
  t: z.number().min(2).max(20),
});

// 工字梁 / H 型(对称双翼缘 + 腹板)。标准 GB/T 706 / ISO 657 命名:
//   bf  = 翼缘宽度(top + bottom 同宽)
//   tf  = 翼缘厚度
//   h   = 总高(含两侧翼缘 — 不是腹板高)
//   tw  = 腹板厚度
// 复材 I-beam 主要用于桥面板 / 光伏支架 / 防腐承重梁。
export const IBeamGeom = z.object({
  type: z.literal("i_beam"),
  bf: z.number().min(20).max(400),
  tf: z.number().min(2).max(30),
  h: z.number().min(40).max(600),
  tw: z.number().min(2).max(25),
});

// 异形截面 — 用户直接输入(无法用 6 种标准参数描述时)
// 几何函数对 custom 不再"算",只是回放输入值。
// 周长零代表"开口"(内毡自动忽略,同标准开口型材)。
export const CustomGeom = z.object({
  type: z.literal("custom"),
  area_mm2: z.number().min(20).max(50000).describe("横截面积 mm²"),
  outer_perim_mm: z.number().min(10).max(2000).describe("外周长 mm"),
  inner_perim_mm: z.number().min(0).max(2000).describe("内周长 mm;开口 / 实心 → 0"),
  complexity: ComplexityEnum.describe("拉挤复杂度;影响模具摊销 + 工艺系数"),
  note: z.string().max(200).optional().describe("形状描述,给 AI 解释生成用"),
});

export const GeometrySchema = z.discriminatedUnion("type", [
  RoundGeom, SquareGeom, RectGeom, AngleGeom, ChannelGeom, IBeamGeom, CustomGeom,
]);
export type Geometry = z.infer<typeof GeometrySchema>;

// ─── 材料 / 工艺 ────────────────────────────────────────────────

export const FiberEnum = z.enum(["e_glass", "ecr_glass", "carbon", "hybrid"]);
export type Fiber = z.infer<typeof FiberEnum>;

export const ResinEnum = z.enum(["up", "epoxy", "ve", "phenolic", "pu"]);
export type Resin = z.infer<typeof ResinEnum>;

export const ColorEnum = z.enum(["gray", "black", "white", "custom"]);
export type Color = z.infer<typeof ColorEnum>;

// ─── 整体输入 ──────────────────────────────────────────────────

export const QuoteInputSchema = z.object({
  geometry: GeometrySchema,
  length_mm: z.number().min(100).max(50000).describe("单根定尺长度 mm,常见 6000"),
  quantity: z.number().int().min(1).max(1_000_000).describe("根数 / 总订单量"),
  cavities: z.number().int().min(1).max(8).optional().describe("模具出数 1 出 N;缺省走该型材默认值(通常 1)"),
  fiber: FiberEnum,
  fiber_content_pct: z
    .number().min(40).max(85).optional()
    .describe("玻纤体积含量 %,缺省取 70"),
  resin: ResinEnum,
  surface_veil: z.boolean().describe("表面毡 / surface mat(外周一层装饰 / UV 阻挡 / 防腐)"),
  inner_veil: z.boolean().describe("内毡 / inner mat(闭口型材内表面;开口型材忽略)"),
  uv_coating: z.boolean(),
  fire_retardant: z.boolean(),
  food_grade: z.boolean(),
  color: ColorEnum,
  // Phase 3 可选项 — 默认 false,UI 勾选
  post_processing: z.boolean().default(false).describe("后加工(机加工 + 简单喷涂);默认 false"),
  packaging: z.boolean().default(false).describe("包装;默认 false"),
  freight: z.boolean().default(false).describe("运费(国内单程);默认 false"),
  application_note: z.string().max(500).optional(),
});
export type QuoteInput = z.infer<typeof QuoteInputSchema>;

// ─── 抽取结果(AI 反问场景) ─────────────────────────────────────

export const ExtractResultSchema = z.object({
  // 抽取置信度 0-100;< 60 时前端建议切到表单
  confidence: z.number().min(0).max(100),
  // 抽取出的部分输入(可能缺字段,所以 deepPartial)
  partial: QuoteInputSchema.partial({
    geometry: true, length_mm: true, quantity: true,
    fiber: true, resin: true, surface_veil: true, inner_veil: true,
    uv_coating: true, fire_retardant: true, food_grade: true, color: true,
    cavities: true,
    post_processing: true, packaging: true, freight: true,
  } as never).describe("尽量抽出来的字段;允许部分缺失"),
  // 还缺的关键字段(用人话表述,后续给前端展示)
  missing: z.array(z.string()).describe("还缺哪些关键参数;给用户看的人话"),
  // 一句反问(只在 missing 非空时填,最多 1 个问题不要堆)
  followup_question: z.string().max(200).optional(),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;

// ─── 定价输出 ──────────────────────────────────────────────────

export const CostBreakdownItem = z.object({
  key: z.enum([
    "material", "process", "surface", "mold",
    "post_processing", "packaging", "freight",
    "admin", "tax", "margin",
  ]),
  label_zh: z.string(),
  label_en: z.string(),
  amount_per_meter_cny: z.number(), // 单米成本绝对值(后端算出来)
  pct: z.number().min(0).max(100),  // 占比 0-100
});

export const QuoteResultSchema = z.object({
  // 单米售价区间(含税),给客户的对外口径
  unit_price_low_cny: z.number(),
  unit_price_high_cny: z.number(),
  // 总价区间(含税)
  total_low_cny: z.number(),
  total_high_cny: z.number(),
  // 衍生信息
  weight_kg_per_m: z.number(),
  total_meters: z.number(),
  total_weight_kg: z.number(),
  // 成本拆解(给登录用户/留资用户看;匿名只给占比)
  breakdown: z.array(CostBreakdownItem),
  // 价格区间生成参数:粗测带宽,默认 0.15
  band: z.number().describe("±band 浮动,默认 0.15"),
  // 警告 / 备注
  warnings: z.array(z.string()),
  // 引擎版本(便于回放和审计)
  engine_version: z.string(),
});
export type QuoteResult = z.infer<typeof QuoteResultSchema>;
