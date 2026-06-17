import { tool } from "ai";
import { z } from "zod";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/sourcing/spec";
import { evaluateCompliance } from "@/lib/data/compliance-rules";

// Sourcing Desk · step 4 — "Compliance Flags".
// Given destination + application, returns regulatory red flags for sourcing
// Chinese FRP (Buy America block / CBAM doc / fire rating / ICC-ES). Determin-
// istic rule table; the model only orchestrates. The point is HONESTY — flagging
// "we can't do this" (e.g. US federal Buy America) builds trust, per the getfrp
// positioning (compliance hard-wall) and the competitor distillation (信任优势).
export function makeComplianceFlagsTool() {
  return tool({
    description:
      "Surface regulatory / compliance red flags for sourcing a Chinese FRP product to a given country + end-use. " +
      "Call this once you know the destination and the application — e.g. 'is this OK for a US federal bridge?', 'any issues importing FRP grating to the EU?', '出口到美国/欧盟有什么合规问题'. " +
      "Returns a list of flags, each {type, severity (block / doc-needed / check), message}: buy_america (US federally-funded → Chinese FRP excluded → BLOCK), cbam (EU import → carbon docs needed), fire (building/transit → fire rating ASTM E84 / EN 13501), icc_es (US structural building → ICC-ES ESR often missing). " +
      "Report EVERY flag honestly — especially blocks; do NOT downplay a 'block'. If there are no flags, say the obvious regulatory hard-walls look clear but final compliance is confirmed by the F1 Composite (曜一) team. ALWAYS pass through `caveat`.",
    inputSchema: z.object({
      destinationCountry: z
        .string()
        .optional()
        .describe('Destination country/market, e.g. "US", "Germany", "EU", "Canada".'),
      application: z
        .string()
        .optional()
        .describe('End use, e.g. "federal highway bridge deck", "cooling tower walkway", "passive-house window frames", "data-center cable tray".'),
      productCategory: z
        .enum([...PRODUCT_CATEGORIES] as [ProductCategory, ...ProductCategory[]])
        .optional()
        .describe("FRP product family (optional context)."),
    }),
    execute: async (input) => {
      const flags = evaluateCompliance(input);
      const blocks = flags.filter((f) => f.severity === "block");
      return {
        destinationCountry: input.destinationCountry ?? null,
        application: input.application ?? null,
        flags,
        hasBlocker: blocks.length > 0,
        summary:
          flags.length === 0
            ? "No hard regulatory blocker detected for this destination/use from the P0 rule set — but final compliance (fire class, certifications, import docs) is confirmed by the F1 Composite team."
            : `${flags.length} flag(s)${blocks.length ? ` incl. ${blocks.length} BLOCKER` : ""}: ${flags.map((f) => `${f.type}=${f.severity}`).join(", ")}.`,
        caveat:
          "Indicative compliance screen from a P0 rule set (Buy America / CBAM / fire / ICC-ES only) — NOT legal advice and not exhaustive. Final regulatory compliance, certifications and import documentation are confirmed by the F1 Composite (曜一) team per the specific project and jurisdiction.",
      };
    },
  });
}
