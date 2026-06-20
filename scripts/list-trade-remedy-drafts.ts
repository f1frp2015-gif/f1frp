// List trade-remedy measures (published + drafts pending review) for human HITL.
//   tsx --env-file=.env.local scripts/list-trade-remedy-drafts.ts
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tradeRemedyMeasures } from "@/lib/db/schema";

async function main() {
  const rows = await db.select().from(tradeRemedyMeasures).orderBy(desc(tradeRemedyMeasures.createdAt));
  const drafts = rows.filter((r) => r.reviewStatus === "draft");
  const pub = rows.filter((r) => r.reviewStatus === "published");

  console.log(`=== published (${pub.length}) ===`);
  for (const r of pub) {
    console.log(`  ${r.measureId} [${r.destination}/${r.measureStatus}] max ${r.rateMaxBp / 100}% — ${r.productScope}`);
  }

  console.log(`\n=== drafts pending review (${drafts.length}) ===`);
  for (const r of drafts) {
    console.log(`  ${r.id}`);
    console.log(`     ${r.measureId} [${r.destination}/${r.measureStatus}] max ${r.rateMaxBp / 100}% — ${r.productScope}`);
    console.log(`     source: ${JSON.stringify(r.source)}`);
    console.log(`     caveat: ${r.caveat ?? ""}`);
  }
  if (drafts.length) {
    console.log(`\npublish one: tsx --env-file=.env.local scripts/publish-trade-remedy.ts <id>`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
