import { tool } from "ai";
import { SourcingSpecSchema } from "@/lib/sourcing/spec";
import { matchSuppliers } from "@/lib/sourcing/match";

// Sourcing Desk · step 2 — "Feasibility & Standards Match".
// Given a buyer's spec (which the concierge extracts from the conversation or an
// uploaded drawing), answers "can a Chinese factory make this, to which
// standards, and who" against f1frp's EXPORT-READY supply graph. Returns atomic
// data + an explicit caveat (per feedback_ai_tool_atomic_data): a feasibility
// shortlist, NOT a quote — pricing/compliance/final factory are separate steps
// confirmed by the F1 Composite (曜一) team after spec lock.
export function makeFeasibilityMatchTool() {
  return tool({
    description:
      "Check whether Chinese FRP factories can make a requested product to spec, which standards can or can't be met, and return up to 3 export-ready candidate suppliers. " +
      "Call this when an overseas buyer describes WHAT they want to source from China — a pultruded profile, grating, rebar, rod, tube, panel, or custom shape (e.g. 'can a Chinese factory make a 100×100 GFRP I-beam to EN 13706?', 'who can supply FRP grating to ASTM?', '中国哪家厂能做这个型材'). " +
      "Returns canMake, up to 3 ranked candidates (name, province, scale tier, certifications, per-candidate standardsMet / standardsGap, MOQ kg, lead-time days), plus which requested standards ANY candidate meets vs none. " +
      "ALWAYS report the candidates and the standards gap honestly, and ALWAYS pass through `caveat`. For a landed price use the landed-cost tool; for compliance blockers (Buy America / CBAM / fire rating) use the compliance tool; this tool only answers feasibility + supplier shortlist.",
    inputSchema: SourcingSpecSchema,
    execute: async (spec) => {
      const r = await matchSuppliers(spec);
      return {
        canMake: r.canMake,
        productCategory: r.productCategory,
        candidateCount: r.candidateCount,
        candidates: r.candidates.map((c, i) => ({
          rank: i + 1,
          name: c.nameEn || c.name,
          province: c.province,
          scaleTier: c.scaleTier,
          certifications: c.certifications,
          standardsMet: c.standardsMet,
          standardsGap: c.standardsGap,
          moqKg: c.moqKg,
          leadTimeDays: c.leadTimeDays,
        })),
        standardsRequested: r.standardsRequested,
        standardsMetByAny: r.standardsMetByAny,
        standardsGapForAll: r.standardsGapForAll,
        summary: r.canMake
          ? `${r.candidateCount} export-ready Chinese ${r.productCategory} supplier(s) matched; showing top ${r.candidates.length}.` +
            (r.standardsGapForAll.length
              ? ` No matched supplier currently documents: ${r.standardsGapForAll.join(", ")} — flag for verification.`
              : r.standardsRequested.length
                ? " All requested standards are covered by at least one candidate."
                : "")
          : `No export-ready ${r.productCategory} supplier matched in the f1frp supply graph yet. Offer to take the buyer's spec to the F1 Composite sourcing team to source a factory.`,
        caveat:
          "Feasibility shortlist from f1frp's export-ready supply graph — indicative, NOT a quote or commitment. 'Met' standards reflect what the factory documents (incl. GB⇄ASTM/EN crosswalk equivalence) and must be re-verified against datasheets / test reports before order. Final factory, pricing, samples and compliance are confirmed by the F1 Composite (曜一) sourcing team after spec lock.",
      };
    },
  });
}
