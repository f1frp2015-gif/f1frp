import { tool } from "ai";
import { z } from "zod";
import {
  analyzeBeam,
  equivalence,
  PROFILE_MATERIALS,
  MATERIAL_KEYS,
  type MaterialKey,
} from "@/lib/data/profile-mechanics";

// FRP profile engineering calculator, exposed to the chat LLM. Backed by the
// SAME @/lib/data/profile-mechanics module that powers the on-site
// /tech/calculator, so the AI and the calculator never disagree (same pattern
// as window_u_value ↔ jgt571). Two modes:
//   - "beam": single-span / cantilever bending check (stress + deflection)
//   - "equivalence": metal → FRP equal-stiffness / equal-strength resizing
// The point is to give the model EXACT computed numbers (Ix, Wx, σ, deflection,
// weight, replacement sizing) instead of letting it estimate beam mechanics.

const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

const matInfo = (key: MaterialKey) => {
  const m = PROFILE_MATERIALS[key];
  return { key, name: m.label, E_GPa: m.E, sigma_MPa: m.sigma, density_g_cm3: m.density, group: m.group };
};

const MATERIAL_LIST = MATERIAL_KEYS.map(
  (k) => `${k} (${PROFILE_MATERIALS[k].label}, E=${PROFILE_MATERIALS[k].E}GPa, σ=${PROFILE_MATERIALS[k].sigma}MPa)`,
).join("; ");

export function makeProfileCalcTool() {
  return tool({
    description:
      "Engineering calculator for FRP (玻璃钢/复材拉挤) structural profiles — bending check and metal→FRP replacement sizing. " +
      "Call this whenever the user asks to size a beam/profile, check 挠度/deflection or 应力/stress, compute 惯性矩 Ix / 截面模量 Wx / 米重, or replace steel/aluminum with FRP (等强度/等刚度替代、减重). " +
      "Returns EXACT computed values — do NOT estimate beam mechanics yourself when this tool applies. " +
      "mode='beam': single-span or cantilever bending check (σ_max vs allowable, deflection vs L/limit). " +
      "mode='equivalence': metal→FRP equal-stiffness and equal-strength resizing under geometric similarity (I∝k⁴, W∝k³), with governing criterion + weight saving. " +
      `Material grades (use the key): ${MATERIAL_LIST}. ` +
      "CRITICAL: report figures from the returned `summary` line; do not swap values. Always pass through the returned `caveat` — this is a preliminary estimate, not a stamped design; FRP needs creep/temperature/connection checks per EN 13706 / ASCE / GB/T 31539.",
    inputSchema: z.object({
      mode: z.enum(["beam", "equivalence"]).describe("'beam' for a bending check, 'equivalence' for metal→FRP resizing."),
      shape: z
        .enum(["i-beam", "channel", "angle", "square-tube", "round-tube"])
        .describe("Cross-section. For round-tube, h = outer diameter and b is ignored."),
      h: z.number().positive().describe("Section height / outer diameter (mm)."),
      b: z.number().positive().optional().describe("Section width / flange width (mm); ignored for round-tube."),
      tw: z.number().positive().describe("Web / wall thickness (mm)."),
      tf: z.number().positive().optional().describe("Flange thickness (mm); used by i-beam/channel only."),
      // beam-mode fields
      material: z
        .enum(MATERIAL_KEYS as [MaterialKey, ...MaterialKey[]])
        .optional()
        .describe("beam mode: the profile material grade key (e.g. 'frp-e23')."),
      loadType: z
        .enum(["udl", "point-mid", "cantilever-point", "cantilever-udl"])
        .optional()
        .describe("beam mode: load case. Default 'udl'."),
      span: z.number().positive().optional().describe("beam mode: span / cantilever length (mm)."),
      load: z
        .number()
        .positive()
        .optional()
        .describe("beam mode: load magnitude — kN/m for distributed (udl), kN for point loads."),
      deflLimit: z
        .number()
        .positive()
        .optional()
        .describe("beam mode: deflection limit denominator, i.e. allowable span/N. Default 250."),
      // equivalence-mode fields
      sourceMaterial: z
        .enum(MATERIAL_KEYS as [MaterialKey, ...MaterialKey[]])
        .optional()
        .describe("equivalence mode: the existing metal grade being replaced (e.g. 'steel-q235', 'alu-6061')."),
      targetMaterial: z
        .enum(MATERIAL_KEYS as [MaterialKey, ...MaterialKey[]])
        .optional()
        .describe("equivalence mode: the FRP grade to replace it with (e.g. 'frp-gb-i')."),
    }),
    execute: async (a) => {
      const b = a.b ?? a.h; // width defaults to height (e.g. square tube) when omitted
      const tf = a.tf ?? a.tw;

      if (a.mode === "equivalence") {
        const r = equivalence({
          sourceMatKey: a.sourceMaterial ?? "steel-q235",
          targetMatKey: a.targetMaterial ?? "frp-gb-i",
          shape: a.shape,
          h: a.h,
          b,
          tw: a.tw,
          tf,
        });
        const gov = r.governingIsStiffness ? "等刚度 (equal stiffness)" : "等强度 (equal strength)";
        return {
          mode: "equivalence",
          source: matInfo((a.sourceMaterial ?? "steel-q235") as MaterialKey),
          target: matInfo((a.targetMaterial ?? "frp-gb-i") as MaterialKey),
          original_section: {
            shape: a.shape,
            h_mm: a.h,
            b_mm: b,
            Ix_cm4: round(r.srcIx / 1e4, 1),
            Wx_cm3: round(r.srcWx / 1e3, 1),
            weight_kg_per_m: round(r.srcWeight, 2),
          },
          equal_stiffness: { scale: round(r.stiffnessScale, 3), H_mm: r.stiffH, B_mm: r.stiffB, Tw_mm: r.stiffTw, Tf_mm: r.stiffTf },
          equal_strength: { scale: round(r.strengthScale, 3), H_mm: r.strengthH, B_mm: r.strengthB, Tw_mm: r.strengthTw, Tf_mm: r.strengthTf },
          governing: r.governingIsStiffness ? "stiffness" : "strength",
          governing_scale: round(r.governingScale, 3),
          target_weight_kg_per_m: round(r.tgtWeight, 2),
          weight_saving_pct: round(r.weightSaving, 0),
          summary:
            `${PROFILE_MATERIALS[(a.sourceMaterial ?? "steel-q235") as MaterialKey].label} ${a.shape} ${a.h}×${b} → ` +
            `${PROFILE_MATERIALS[(a.targetMaterial ?? "frp-gb-i") as MaterialKey].label}: 控制准则=${gov}, 放大系数 ×${round(r.governingScale, 2)}, ` +
            `建议截面约 H${r.governingIsStiffness ? r.stiffH : r.strengthH}×B${r.governingIsStiffness ? r.stiffB : r.strengthB} mm; ` +
            `米重 ${round(r.srcWeight, 1)}→${round(r.tgtWeight, 1)} kg/m, 减重约 ${round(r.weightSaving, 0)}%.`,
          caveat:
            "初步几何相似估算 (I∝k⁴, W∝k³)，未含 FRP 蠕变/温度/连接/局部稳定。正式选型须按 EN 13706 / ASCE / GB/T 31539 复核并取安全系数；可让用户在 /tech/calculator 复算。",
        };
      }

      // beam mode
      const r = analyzeBeam({
        matKey: a.material ?? "frp-e23",
        shape: a.shape,
        h: a.h,
        b,
        tw: a.tw,
        tf,
        loadType: a.loadType ?? "udl",
        span: a.span ?? 3000,
        load: a.load ?? 5,
        deflLimit: a.deflLimit ?? 250,
      });
      return {
        mode: "beam",
        material: matInfo((a.material ?? "frp-e23") as MaterialKey),
        shape: a.shape,
        span_mm: a.span ?? 3000,
        load: a.load ?? 5,
        loadType: a.loadType ?? "udl",
        section: { Ix_cm4: round(r.Ix / 1e4, 1), Wx_cm3: round(r.Wx / 1e3, 1), weight_kg_per_m: round(r.weightPerM, 2) },
        results: {
          M_max_kNm: round(r.M_max / 1e6, 2),
          sigma_max_MPa: round(r.sigma_max, 1),
          allowable_sigma_MPa: r.material.sigma,
          stress_utilization_pct: round((r.sigma_max / r.material.sigma) * 100, 0),
          stress_ok: r.stressOk,
          deflection_mm: round(r.defl, 1),
          deflection_ratio: `L/${round(r.deflRatio, 0)}`,
          deflection_limit: `L/${a.deflLimit ?? 250}`,
          deflection_ok: r.deflOk,
        },
        summary:
          `${r.material.label} ${a.shape} ${a.h}×${b}, 跨 ${a.span ?? 3000}mm, ${a.loadType ?? "udl"} ${a.load ?? 5}: ` +
          `σ_max=${round(r.sigma_max, 1)}MPa (许用 ${r.material.sigma}, 利用率 ${round((r.sigma_max / r.material.sigma) * 100, 0)}%, ${r.stressOk ? "通过" : "超限"}); ` +
          `挠度=${round(r.defl, 1)}mm = L/${round(r.deflRatio, 0)} (限 L/${a.deflLimit ?? 250}, ${r.deflOk ? "通过" : "超限"}); 米重 ${round(r.weightPerM, 2)} kg/m.`,
        caveat:
          "初步单跨/悬臂估算，未含 FRP 剪切变形、蠕变、温度、局部屈曲与连接。正式设计须按 EN 13706 / ASCE / GB/T 31539 取安全系数复核；可让用户在 /tech/calculator 复算。",
      };
    },
  });
}
