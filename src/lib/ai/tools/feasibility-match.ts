import { tool } from "ai";
import { headers } from "next/headers";
import { SourcingSpecSchema } from "@/lib/sourcing/spec";
import { matchSuppliers } from "@/lib/sourcing/match";

// Overseas-side anonymization. getfrp.com (and any non-domestic / unknown host)
// must NOT surface specific factory identities to overseas buyers — handing out
// names + province would let a buyer go direct and disintermediate the F1
// sourcing desk. Only the domestic f1frp.com host gets named candidates;
// overseas gets an anonymized capability/standards shortlist and is funnelled to
// the RFQ, where the desk discloses the plant after spec lock.
const DOMESTIC_HOSTS = new Set(["f1frp.com", "www.f1frp.com"]);
async function isDomesticRequest(): Promise<boolean> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") || h.get("host") || "")
      .toLowerCase()
      .split(":")[0];
    return DOMESTIC_HOSTS.has(host);
  } catch {
    // No request scope (script/build) → treat as overseas: anonymize (safe default).
    return false;
  }
}

// Sourcing Desk · step 2 — "Feasibility & Standards Match".
// Given a buyer's spec (which the concierge extracts from the conversation or an
// uploaded drawing), answers "can a Chinese factory make this, and to which
// standards" against f1frp's EXPORT-READY supply graph. Returns atomic data + an
// explicit caveat (per feedback_ai_tool_atomic_data): a feasibility shortlist,
// NOT a quote — pricing/compliance/final factory are separate steps confirmed by
// the F1 Composite (曜一) team after spec lock. On the overseas side the
// candidates are anonymized (no factory name/province).
export function makeFeasibilityMatchTool() {
  return tool({
    description:
      "Check whether Chinese FRP factories can make a requested product to spec, which standards can or can't be met, and return up to 3 export-ready candidate suppliers. " +
      "Call this when an overseas buyer describes WHAT they want to source from China — a pultruded profile, grating, rebar, rod, tube, panel, or custom shape (e.g. 'can a Chinese factory make a 100×100 GFRP I-beam to EN 13706?', 'who can supply FRP grating to ASTM?', '中国哪家厂能做这个型材'). " +
      "Returns canMake, up to 3 ranked candidates (scale tier, certifications, per-candidate standardsMet / standardsGap, MOQ kg, lead-time days), plus which requested standards ANY candidate meets vs none. " +
      "IMPORTANT: specific factory identities (name, location) are NOT disclosed in chat — they are confirmed by the F1 Composite sourcing desk after the buyer submits an RFQ and the spec is locked. Never invent or guess a factory name; refer the buyer to the RFQ to get matched to a named plant. " +
      "ALWAYS report the candidates and the standards gap honestly, and ALWAYS pass through `caveat`. For a landed price use the landed-cost tool; for compliance blockers (Buy America / CBAM / fire rating) use the compliance tool; this tool only answers feasibility + supplier shortlist.",
    inputSchema: SourcingSpecSchema,
    execute: async (spec) => {
      const r = await matchSuppliers(spec);
      const anonymize = !(await isDomesticRequest());
      return {
        canMake: r.canMake,
        productCategory: r.productCategory,
        candidateCount: r.candidateCount,
        candidates: r.candidates.map((c, i) =>
          anonymize
            ? {
                rank: i + 1,
                ref: `Candidate ${String.fromCharCode(65 + i)}`,
                scaleTier: c.scaleTier,
                certifications: c.certifications,
                standardsMet: c.standardsMet,
                standardsGap: c.standardsGap,
                moqKg: c.moqKg,
                leadTimeDays: c.leadTimeDays,
              }
            : {
                rank: i + 1,
                name: c.nameEn || c.name,
                province: c.province,
                scaleTier: c.scaleTier,
                certifications: c.certifications,
                standardsMet: c.standardsMet,
                standardsGap: c.standardsGap,
                moqKg: c.moqKg,
                leadTimeDays: c.leadTimeDays,
              },
        ),
        standardsRequested: r.standardsRequested,
        standardsMetByAny: r.standardsMetByAny,
        standardsGapForAll: r.standardsGapForAll,
        summary: r.canMake
          ? `${r.candidateCount} export-ready Chinese ${r.productCategory} supplier(s) matched; showing top ${r.candidates.length}.` +
            (r.standardsGapForAll.length
              ? ` No matched supplier currently documents: ${r.standardsGapForAll.join(", ")} — flag for verification.`
              : r.standardsRequested.length
                ? " All requested standards are covered by at least one candidate."
                : "") +
            (anonymize
              ? " Candidates are anonymized — submit an RFQ to have the F1 desk match and disclose the specific plant."
              : "")
          : `No export-ready ${r.productCategory} supplier matched in the f1frp supply graph yet. Offer to take the buyer's spec to the F1 Composite sourcing team to source a factory.`,
        caveat: anonymize
          ? "Anonymized feasibility shortlist from f1frp's export-ready supply graph — indicative, NOT a quote or commitment. Specific factory identities are disclosed by the F1 Composite (曜一) sourcing desk after the buyer submits an RFQ and the spec is locked. 'Met' standards reflect what each factory documents (incl. GB⇄ASTM/EN crosswalk equivalence) and must be re-verified against datasheets / test reports before order."
          : "Feasibility shortlist from f1frp's export-ready supply graph — indicative, NOT a quote or commitment. 'Met' standards reflect what the factory documents (incl. GB⇄ASTM/EN crosswalk equivalence) and must be re-verified against datasheets / test reports before order. Final factory, pricing, samples and compliance are confirmed by the F1 Composite (曜一) sourcing team after spec lock.",
      };
    },
  });
}
