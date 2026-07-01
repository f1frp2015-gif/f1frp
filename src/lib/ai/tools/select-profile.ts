import { tool } from "ai";
import { z } from "zod";
import {
  selectProfile,
  materialLabel,
  type SelectInput,
} from "@/lib/data/profile-select";
import { MATERIAL_KEYS, FRP_KEYS, PROFILE_MATERIALS, type MaterialKey } from "@/lib/data/profile-mechanics";

// Reverse profile SELECTION exposed to the chat LLM — "given span + load +
// deflection limit, which of our FRP profiles passes?". Complements
// profile_mechanics (which CHECKS a section the user already typed): this one
// RECOMMENDS the lightest passing section from f1's catalog. Backed by the same
// analyzeBeam engine, so selection, the on-site calculator and the AI never
// disagree. Grounds the answer on supply-able profiles (Fictiv pattern).
//
// NOTE: the catalog is currently a SEED list (see profile-catalog.ts); section
// properties are engine-computed, not vendor spec — preliminary screen only.

const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

const FRP_LIST = FRP_KEYS.map(
  (k) => `${k} (${PROFILE_MATERIALS[k].label}, E=${PROFILE_MATERIALS[k].E}GPa, σ=${PROFILE_MATERIALS[k].sigma}MPa)`,
).join("; ");

export function makeSelectProfileTool() {
  return tool({
    description:
      "FRP profile SELECTOR — given a span, load and deflection limit, returns which of our standard pultruded profiles PASS (stress + deflection), ranked lightest-first. " +
      "Call this whenever the user asks 'which profile / 哪个型材 / 选哪个 / what size do I need / size a beam for me / recommend a section' for a span+load — i.e. they want a RECOMMENDATION, not a check of a section they already specified (use profile_mechanics for that). " +
      "Returns EXACT engine-computed results — do NOT estimate. Report figures from the returned `summary` line; do not swap values. Always pass through the returned `caveat`. " +
      `FRP material grades (use the key, default 'frp-e23'): ${FRP_LIST}.`,
    inputSchema: z.object({
      span: z.number().positive().describe("Span / cantilever length (mm)."),
      load: z.number().positive().describe("Load magnitude — kN/m for distributed (udl), kN for point loads."),
      loadType: z
        .enum(["udl", "point-mid", "cantilever-point", "cantilever-udl"])
        .optional()
        .describe("Load case. Default 'udl'."),
      deflLimit: z
        .number()
        .positive()
        .optional()
        .describe("Deflection limit denominator, i.e. allowable span/N. Default 250 (use 360 for stiffer service, 180 for pedestrian grating-like)."),
      material: z
        .enum(MATERIAL_KEYS as [MaterialKey, ...MaterialKey[]])
        .optional()
        .describe("FRP grade key. Default 'frp-e23'."),
      shapes: z
        .array(z.enum(["i-beam", "channel", "angle", "square-tube", "round-tube"]))
        .optional()
        .describe("Optional shape filter, e.g. ['i-beam'] to only consider I-beams."),
    }),
    execute: async (a) => {
      const matKey = (a.material ?? "frp-e23") as MaterialKey;
      const loadType = a.loadType ?? "udl";
      const deflLimit = a.deflLimit ?? 250;
      const input: SelectInput = {
        matKey,
        loadType,
        span: a.span,
        load: a.load,
        deflLimit,
        shapes: a.shapes,
        topN: 5,
      };
      const r = selectProfile(input);

      const best = r.lightest;
      const summary = best
        ? `${materialLabel(matKey)}, 跨 ${a.span}mm, ${loadType} ${a.load}${loadType.includes("udl") ? "kN/m" : "kN"}, 限 L/${deflLimit}: ` +
          `共 ${r.considered} 个型材中 ${r.passingCount} 个通过;最轻通过=${best.label} ` +
          `(米重 ${best.weight_kg_per_m} kg/m${best.weightSource === "published" ? "·厂商发布" : "·计算值"}, 应力利用 ${best.stress_util_pct}%, 挠度 ${best.deflection_mm}mm = ${best.deflection_ratio}).`
        : `${materialLabel(matKey)}, 跨 ${a.span}mm, ${loadType} ${a.load}: ${r.considered} 个型材均不满足 L/${deflLimit} + 强度;需加大截面/缩短跨度/换更高等级(如 frp-e23/frp-high)或加中间支撑。`;

      const caveat =
        (best?.weightSource === "published"
          ? "初步选型筛查:米重为 f1 厂商发布值,但截面特性(Ix/Wx)、应力与挠度为引擎按标准截面计算的初步筛查值,未含 FRP 剪切变形、蠕变、温度、局部屈曲与连接。"
          : "初步选型筛查:截面特性与米重均为引擎按标准截面计算的示例值(非厂商发布),未含 FRP 剪切变形、蠕变、温度、局部屈曲与连接。") +
        "正式选型须按 EN 13706 / ASCE / GB/T 31539 取安全系数复核,并以 f1 实际可供型材与厂商规格表为准;可在 /tech/calculator 复算具体截面。";

      return {
        query: { material: matKey, span_mm: a.span, load: a.load, loadType, deflLimit, shapes: a.shapes ?? "all" },
        considered: r.considered,
        passingCount: r.passingCount,
        recommendations: r.passing,
        lightest: best,
        summary,
        caveat,
      };
    },
  });
}
