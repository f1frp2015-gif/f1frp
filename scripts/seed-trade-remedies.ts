// Seed trade_remedy_measures from the static TRADE_REMEDIES baseline (as published),
// so the DB-backed lookup returns the current baseline immediately. Idempotent by measure_id.
//   tsx --env-file=.env.local scripts/seed-trade-remedies.ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tradeRemedyMeasures } from "@/lib/db/schema";
import { TRADE_REMEDIES } from "@/lib/data/trade-remedy";

async function main() {
  let inserted = 0;
  let skipped = 0;
  for (const m of TRADE_REMEDIES) {
    const existing = await db
      .select({ id: tradeRemedyMeasures.id })
      .from(tradeRemedyMeasures)
      .where(eq(tradeRemedyMeasures.measureId, m.id))
      .limit(1);
    if (existing.length) {
      skipped++;
      continue;
    }
    await db.insert(tradeRemedyMeasures).values({
      measureId: m.id,
      destination: m.destination,
      origin: m.origin,
      productScope: m.productScope,
      scopeEn: m.scopeEn,
      hsCodes: m.hsCodes,
      appliesTo: m.appliesTo,
      kind: m.kind,
      rateMaxBp: Math.round(m.rateMaxPct * 100),
      basis: m.basis,
      measureStatus: m.status,
      effectiveFrom: m.effectiveFrom ?? null,
      expiresOn: m.expiresOn ?? null,
      sunsetReview: m.sunsetReview ?? null,
      source: m.source,
      caveat: m.caveat,
      reviewStatus: "published",
      generatedBy: "seed",
      publishedAt: new Date(),
    });
    inserted++;
  }
  console.log(`[seed-trade-remedies] inserted ${inserted}, skipped ${skipped} (already present)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
