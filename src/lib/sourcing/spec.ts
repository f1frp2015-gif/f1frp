// FRP Sourcing Desk — shared spec model + capability / standards helpers.
//
// getfrp P0 (see vault: 2026-06-16-getfrp-P0实施规格-AI采购台MVP). The Sourcing
// Desk's "Spec Intake" is handled by the concierge model itself (it reads the
// drawing/text via vision and fills these tool arguments) — so there is NO
// separate extract LLM call. This module is the typed contract for that spec,
// plus pure helpers for capability tagging and GB⇄ASTM/EN standard equivalence.

import { z } from "zod";
import { crosswalk } from "@/lib/data/china-standards-crosswalk";

export const PRODUCT_CATEGORIES = [
  "profile",
  "grating",
  "rebar",
  "rod",
  "tube",
  "panel",
  "custom",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// The structured spec the concierge extracts from the buyer conversation /
// uploaded drawing and passes to feasibility_match. Only productCategory is
// required — everything else is best-effort, matching how real RFQs arrive.
export const SourcingSpecSchema = z.object({
  productCategory: z
    .enum([...PRODUCT_CATEGORIES] as [ProductCategory, ...ProductCategory[]])
    .describe(
      "FRP product family wanted: profile (pultruded structural shapes — I-beam / channel / angle / box), grating (molded or pultruded gratings), rebar (GFRP/BFRP reinforcing bar), rod (solid round/square bar), tube (hollow round/square), panel (sheet / plate), or custom (non-standard shape).",
    ),
  profileShape: z
    .string()
    .optional()
    .describe('Shape/size detail, e.g. "I-beam 100×100×6" or "50mm round tube".'),
  material: z
    .string()
    .optional()
    .describe('Fiber + resin, e.g. "ECR glass / vinyl ester" or "E-glass / polyester".'),
  dimensions: z.string().optional().describe('Key dimensions as given, e.g. "100×100×6 mm".'),
  standards: z
    .array(z.string())
    .optional()
    .describe('Requested standard codes, e.g. ["ASTM D3039","EN 13706","ISO 9001"].'),
  quantityKg: z.number().positive().optional().describe("Approximate order quantity in kg, if known."),
  quantityNote: z
    .string()
    .optional()
    .describe('Quantity as phrased if not in kg, e.g. "2×40HQ containers" or "5000 m".'),
  application: z
    .string()
    .optional()
    .describe('End use, e.g. "cooling tower walkway", "passive-house window frames", "cable tray".'),
  destinationCountry: z
    .string()
    .optional()
    .describe('Destination country / market, e.g. "US", "Germany", "EU".'),
});
export type SourcingSpec = z.infer<typeof SourcingSpecSchema>;

// ── Capability tagging ──────────────────────────────────────────────────────
// Map free-text / Chinese product labels to coarse capability tags. Used by the
// backfill to populate supplier_listings.capabilities from existing products[].
const CAPABILITY_KEYWORDS: Array<[ProductCategory, RegExp]> = [
  ["grating", /grating|格栅/i],
  ["rebar", /rebar|筋材|螺纹筋|增强筋|gfrp\s*bar/i],
  ["tube", /tube|pipe|\b管\b|圆管|方管|管材/i],
  ["rod", /\brod\b|实心棒|圆棒|棒材|芯棒/i],
  ["panel", /panel|sheet|plate|板材|面板|平板/i],
  ["profile", /profile|型材|拉挤|pultrud|工字|角钢|槽钢|i-?beam|channel|angle/i],
];

export function deriveCapabilities(products: string[] | null | undefined): ProductCategory[] {
  const hay = (products ?? []).join(" ");
  const out = new Set<ProductCategory>();
  for (const [cap, re] of CAPABILITY_KEYWORDS) if (re.test(hay)) out.add(cap);
  return [...out];
}

// ── Standard normalization + GB⇄ASTM/EN equivalence ─────────────────────────
// Normalize a standard code for comparison: upper-case, collapse whitespace,
// drop a trailing year suffix ("GB/T 1447-2005" → "GB/T 1447").
export function normStd(code: string): string {
  return code
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[-–]\s*(19|20)\d{2}.*$/, "")
    .trim();
}

// Equivalence index built from the curated crosswalk: every normalized code maps
// to the set of all codes sharing a crosswalk row (incl. its GB counterpart), so
// a factory documenting GB/T 1447 satisfies a buyer asking for ASTM D3039 / ISO 527-4.
const EQUIV: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const row of crosswalk) {
    const codes = [row.gb, ...row.intl.map((i) => i.code)]
      // Split only on " / " separators between alternative codes (e.g.
      // "ISO 527-4 / 527-5"), NOT the "/" inside a single code like "GB/T 1447".
      .flatMap((c) => c.split(/\s+\/\s+/).map((x) => normStd(x)))
      .filter(Boolean);
    const set = new Set(codes);
    for (const c of codes) {
      const cur = m.get(c) ?? new Set<string>();
      for (const x of set) cur.add(x);
      m.set(c, cur);
    }
  }
  return m;
})();

export function standardEquivalents(code: string): Set<string> {
  const n = normStd(code);
  return EQUIV.get(n) ?? new Set([n]);
}

// Does a supplier's documented-standard set satisfy a requested code, directly
// or via crosswalk equivalence?
export function supplierMeetsStandard(requested: string, supported: string[]): boolean {
  const sup = new Set(supported.map(normStd));
  if (sup.has(normStd(requested))) return true;
  for (const eq of standardEquivalents(requested)) if (sup.has(eq)) return true;
  return false;
}
