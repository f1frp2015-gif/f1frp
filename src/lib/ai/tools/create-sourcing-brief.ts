import { tool } from "ai";
import { z } from "zod";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/sourcing/spec";
import { createSourcingBrief } from "@/lib/sourcing/brief";

// Sourcing Desk · step 5 — Human Handoff. Call ONLY when the buyer explicitly
// wants to proceed ("get this sourced" / "have your team contact me") AND has
// given at least an email. Persists a structured brief + emails the getfrp
// ops inbox; returns a ticket id. NEVER closes a deal itself — high-value
// orders always go to a human (per the P0 spec "不做 AI 直接成交").
export function makeCreateSourcingBriefTool(host?: string | null, locale?: string) {
  return tool({
    description:
      "Hand off the buyer to the getfrp sourcing team by creating a Sourcing Brief. " +
      "Call this ONLY when the buyer clearly wants to proceed (e.g. 'get this sourced', 'send me a quote', 'have your team contact me') AND you have collected at least their email (ask for name + email + company first if missing). " +
      "Pass everything gathered so far: buyer contact, the product spec, and short notes summarizing the feasibility / landed-cost / compliance results from earlier tool calls. " +
      "Returns a ticketId + confirmation. After calling, tell the buyer the getfrp team will contact them within 24h about the next sourcing step. Do NOT promise pricing or commit an order — this is a handoff, not a sale.",
    inputSchema: z.object({
      buyerEmail: z.string().describe("Buyer email — REQUIRED for handoff. Ask for it before calling if not yet given."),
      buyerName: z.string().optional().describe("Buyer contact name."),
      buyerCompany: z.string().optional().describe("Buyer company."),
      buyerCountry: z.string().optional().describe("Destination country / market."),
      productCategory: z
        .enum([...PRODUCT_CATEGORIES] as [ProductCategory, ...ProductCategory[]])
        .optional()
        .describe("FRP product family."),
      specSummary: z.string().optional().describe("One-paragraph recap of the spec (shape, dimensions, material, surface, application)."),
      standards: z.array(z.string()).optional().describe("Requested standard codes."),
      quantity: z.string().optional().describe("Order quantity as given (kg / containers / meters)."),
      application: z.string().optional().describe("End use."),
      feasibilityNote: z.string().optional().describe("Short recap of feasibility_match result (canMake + candidates + standards gap)."),
      landedCostNote: z.string().optional().describe("Short recap of landed_cost_usd result (DDP/CIF/FOB ranges)."),
      complianceNote: z.string().optional().describe("Short recap of compliance_flags result (any blockers / docs needed)."),
    }),
    execute: async (a) => {
      const r = await createSourcingBrief({
        host,
        locale,
        buyer: { company: a.buyerCompany, name: a.buyerName, email: a.buyerEmail, country: a.buyerCountry },
        spec: {
          productCategory: a.productCategory,
          specSummary: a.specSummary,
          standards: a.standards,
          quantity: a.quantity,
          application: a.application,
        },
        feasibility: a.feasibilityNote ? { note: a.feasibilityNote } : undefined,
        landedCost: a.landedCostNote ? { note: a.landedCostNote } : undefined,
        complianceFlags: a.complianceNote ? [{ note: a.complianceNote }] : undefined,
      });
      return {
        ok: r.ok,
        ticketId: r.ticketId,
        opsNotified: r.notified,
        message: r.ticketId
          ? `Sourcing brief ${r.ticketId} created. The getfrp team will contact ${a.buyerEmail} within 24h about the next sourcing step. Tell the buyer this and that no order is committed yet.`
          : "Brief could not be stored, but the getfrp team has been notified of this lead — confirm to the buyer that the team will reach out within 24h.",
      };
    },
  });
}
