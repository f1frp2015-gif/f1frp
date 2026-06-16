import { tool } from "ai";
import { z } from "zod";
import { selectMaterials, PROCESSES } from "@/lib/data/frp-micromechanics";

// Inverse / target-driven material selection ("目标性能 → 候选 + 估算物性").
// Given performance targets (modulus, strength, weight, temperature, corrosion,
// insulation, cost), returns ranked fiber + resin + process candidates with
// rule-of-mixtures property estimates and a fit rationale. This is the
// Citrine-style "retrieval → prediction" upgrade — but estimates are INDICATIVE
// (ROM 0° upper bounds), not code design values, and the tool says so.
export function makeMaterialSelectorTool() {
  return tool({
    description:
      "Recommend FRP material systems (fiber + resin + process) from PERFORMANCE TARGETS — i.e. reverse/inverse material selection (逆向选材 / 反查选材 / 按性能选材料). " +
      "Call this when the user describes what they NEED (a stiffness/strength target, a weight or density ceiling, a service temperature, a corrosive environment, an electrical-insulation need, a cost preference) and wants to know which fiber+resin to use — rather than asking about a specific named material. " +
      "Returns the top candidates ranked by fit, each with rule-of-mixtures estimated longitudinal modulus (E1), tensile (0° upper bound), density, service temperature, corrosion grade, relative cost, plus a per-candidate rationale. " +
      "ALWAYS report the figures from each candidate's `estimate`, and ALWAYS pass through `caveat`: these are INDICATIVE estimates (ROM 0° upper bounds), NOT datasheet or standard design values — final selection must use supplier datasheets + EN 13706 / ASCE / GB/T 31539 characteristic values. " +
      "For a concrete profile sizing/deflection check, use the profile_mechanics tool instead.",
    inputSchema: z.object({
      process: z
        .enum(Object.keys(PROCESSES) as [string, ...string[]])
        .optional()
        .describe("Manufacturing process (sets typical fiber volume fraction & orientation). Default 'pultrusion' (f1frp's focus)."),
      minModulusGPa: z.number().positive().optional().describe("Required longitudinal tensile modulus E1 (GPa)."),
      minTensileMPa: z.number().positive().optional().describe("Required longitudinal tensile strength (MPa, 0° direction)."),
      maxDensity: z.number().positive().optional().describe("Maximum density (g/cm³) — i.e. a weight ceiling."),
      minServiceTempC: z.number().optional().describe("Required continuous service temperature (°C)."),
      corrosionService: z.boolean().optional().describe("True if the part sees a wet / chemical / corrosive environment (needs corrosion grade ≥4)."),
      electricalInsulation: z.boolean().optional().describe("True if the part must be electrically non-conductive (rules out carbon fiber)."),
      costSensitive: z.boolean().optional().describe("True to weight the ranking toward cheaper systems."),
    }),
    execute: async (targets) => {
      const candidates = selectMaterials(targets, 4);
      const processKey = targets.process && PROCESSES[targets.process] ? targets.process : "pultrusion";
      return {
        process: PROCESSES[processKey].label,
        targets,
        candidates: candidates.map((c, i) => ({
          rank: i + 1,
          system: `${c.fiberLabel} + ${c.resinLabel}`,
          fiber: c.fiberLabel,
          resin: c.resinLabel,
          estimate: {
            modulus_E1_GPa: c.estimate.E1,
            tensile_MPa_0deg_upper: c.estimate.tensile,
            density_g_cm3: c.estimate.density,
            max_service_temp_C: c.estimate.maxServiceTempC,
            corrosion_grade_5: c.estimate.corrosion,
            relative_cost_5: c.estimate.costRel,
            conductive: c.estimate.conductive,
            fiber_volume_fraction: c.estimate.vf,
          },
          fit: c.fit,
        })),
        summary:
          candidates.length > 0
            ? `${PROCESSES[processKey].label} 推荐 Top${candidates.length}: ` +
              candidates
                .map(
                  (c) =>
                    `①${c.fiberLabel.split(" ")[0]}+${c.resinLabel}(E1≈${c.estimate.E1}GPa, ρ${c.estimate.density}, 耐温${c.estimate.maxServiceTempC}°C, 耐蚀${c.estimate.corrosion}/5)`,
                )
                .join("; ")
            : "无候选——请放宽目标条件。",
        caveat:
          "以上为规则混合律(ROM)0° 估算值，是理论上限/指示性参考，非数据表或标准设计值。拉挤/层合实际设计值(EN 13706 / ASCE / GB/T 31539 特征值)通常明显更低；最终选材须以供应商数据表 + 标准特征值为准，并结合工艺、界面、长期蠕变/耐候复核。",
      };
    },
  });
}
