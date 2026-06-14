import { tool } from "ai";
import { z } from "zod";
import { lookupWindowUValue } from "@/lib/data/jgt571";

// Deterministic JG/T 571-2019 Appendix C window U-value lookup, exposed to the
// chat LLM as a tool. Pure table lookup — no external API, no env, works on
// both the domestic (DeepSeek) and overseas (Gemini) providers. The point is
// to give the model EXACT standard values instead of letting it estimate /
// hallucinate window Uw. The same lib/data/jgt571 table powers the on-site
// /tech/u-value-calculator, so the AI and the calculator never disagree.
export function makeWindowUValueTool() {
  return tool({
    description:
      "Look up the whole-window heat-transfer coefficient (整窗传热系数 Uw) and thermal-insulation grade of a glass-fiber reinforced polyurethane (玻纤增强聚氨酯 / GFRP-PU / FRP) energy-saving window or door, per Chinese industry standard JG/T 571-2019 Appendix C, Table C.1 (frame-to-glass ratio 30:70). " +
      "Call this whenever the user asks about FRP / 聚氨酯 window or door U-value, 传热系数, 保温性能 / 等级, 节能配置, or which profile series + glass build hits a target Uw. " +
      "Returns exact standard values — do NOT estimate window Uw yourself when this tool applies. " +
      "CRITICAL: each returned config has a `summary` line that binds one glass build to ITS OWN figures — report each build's Uw from its own summary; never swap or mix Uw values between different glass builds. " +
      "Cite the standard EXACTLY as given in the result's `standard` field — do NOT invent or guess the standard's Chinese title. Each summary already includes the thermal grade for the sliding and unfilled-cavity variants, so use those rather than recomputing grades yourself.",
    inputSchema: z.object({
      series: z
        .number()
        .int()
        .optional()
        .describe(
          "Profile series number: one of 55, 60, 65, 70, 75, 80, 85, 90, 95, 100 (larger = wider profile = lower frame Uf = better insulation). Omit to get an overview of every series with its frame U-value (Uf) and best achievable Uw.",
        ),
      gas: z
        .enum(["air", "ar"])
        .optional()
        .describe(
          "Insulating-glass cavity fill gas: 'air' (空气) or 'ar' (氩气 / argon). Default 'ar'.",
        ),
      glassQuery: z
        .string()
        .optional()
        .describe(
          "Optional filter for the glass build — e.g. '三玻' / 'triple', 'Low-E', '暖边' / 'warm-edge', or a spec fragment like '5Low-E+12'. Omit to return all glass builds for the series.",
        ),
    }),
    execute: async ({ series, gas, glassQuery }) => {
      return lookupWindowUValue({ series, gas, glassQuery });
    },
  });
}
