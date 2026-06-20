// Final-review publish a draft trade-remedy measure. Supersedes any prior published
// row of the same measure_id (single current authority). HITL — run by a human.
//   tsx --env-file=.env.local scripts/publish-trade-remedy.ts <draft-id>
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tradeRemedyMeasures } from "@/lib/db/schema";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: publish-trade-remedy.ts <draft-id>");
    process.exit(1);
  }
  const [row] = await db.select().from(tradeRemedyMeasures).where(eq(tradeRemedyMeasures.id, id)).limit(1);
  if (!row) {
    console.error("draft not found:", id);
    process.exit(1);
  }
  // 同 measure_id 的旧 published 降级为 draft(保持单一现行权威)。
  await db
    .update(tradeRemedyMeasures)
    .set({ reviewStatus: "draft", updatedAt: new Date() })
    .where(and(eq(tradeRemedyMeasures.measureId, row.measureId), eq(tradeRemedyMeasures.reviewStatus, "published")));
  await db
    .update(tradeRemedyMeasures)
    .set({ reviewStatus: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(tradeRemedyMeasures.id, id));
  console.log(`[publish-trade-remedy] published ${row.measureId} (${id}); superseded prior published of same measure_id.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
