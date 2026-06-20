// Insert trade-remedy measures as DRAFT (review_status=draft) for human final review.
// Used by the f1frp-trade-remedy-digest skill. NEVER publishes.
//   tsx --env-file=.env.local scripts/create-trade-remedy-draft.ts <draft.json>
// draft.json: an array, OR { measures: [ ... ] }, each:
//   { measureId, destination, origin?, productScope, scopeEn?, hsCodes[], appliesTo[],
//     kind, rateMaxPct, basis?, measureStatus, effectiveFrom?, expiresOn?, sunsetReview?,
//     source:{name,url?,retrievedOn}, caveat, generatedBy? }
import { existsSync, readFileSync } from "node:fs";
import { db } from "@/lib/db";
import { tradeRemedyMeasures } from "@/lib/db/schema";

type M = Record<string, unknown>;
const str = (v: unknown, d = ""): string => (v == null ? d : String(v));
const strOrNull = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
const arrStr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

async function main() {
  const path = process.argv[2];
  if (!path || !existsSync(path)) {
    console.error("usage: create-trade-remedy-draft.ts <draft.json>");
    process.exit(1);
  }
  const parsed: unknown = JSON.parse(readFileSync(path, "utf-8"));
  const measures: M[] = Array.isArray(parsed)
    ? (parsed as M[])
    : Array.isArray((parsed as { measures?: unknown }).measures)
      ? ((parsed as { measures: M[] }).measures)
      : [];
  if (!measures.length) {
    console.error("no measures in draft");
    process.exit(1);
  }
  let n = 0;
  for (const m of measures) {
    await db.insert(tradeRemedyMeasures).values({
      measureId: str(m.measureId ?? m.id),
      destination: str(m.destination),
      origin: str(m.origin, "CN"),
      productScope: str(m.productScope),
      scopeEn: strOrNull(m.scopeEn),
      hsCodes: arrStr(m.hsCodes),
      appliesTo: arrStr(m.appliesTo),
      kind: str(m.kind, "AD"),
      rateMaxBp: Math.round(Number(m.rateMaxPct ?? 0) * 100),
      basis: strOrNull(m.basis),
      measureStatus: str(m.measureStatus ?? m.status, "in_force"),
      effectiveFrom: strOrNull(m.effectiveFrom),
      expiresOn: strOrNull(m.expiresOn),
      sunsetReview: strOrNull(m.sunsetReview),
      source: (m.source as { name: string; url?: string; retrievedOn: string }) ?? null,
      caveat: strOrNull(m.caveat),
      reviewStatus: "draft",
      generatedBy: str(m.generatedBy, "skill:trade-remedy-digest"),
    });
    n++;
  }
  console.log(
    `[create-trade-remedy-draft] inserted ${n} DRAFT measure(s). ` +
      `Review: tsx --env-file=.env.local scripts/list-trade-remedy-drafts.ts → ` +
      `publish: tsx --env-file=.env.local scripts/publish-trade-remedy.ts <id>`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
