import { db } from "../src/lib/db";
import { papers } from "../src/lib/db/schema";
import { sql, isNotNull, desc } from "drizzle-orm";

async function main() {
  const totalRow = await db.select({ c: sql<number>`count(*)::int` }).from(papers);
  const withSource = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(papers)
    .where(isNotNull(papers.sourceUrl));
  const withDoi = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(papers)
    .where(isNotNull(papers.doi));

  console.log(`total: ${totalRow[0].c}`);
  console.log(`with sourceUrl: ${withSource[0].c}`);
  console.log(`with doi: ${withDoi[0].c}`);

  const sample = await db
    .select({
      id: papers.id,
      slug: papers.slug,
      title: papers.title,
      sourceUrl: papers.sourceUrl,
      doi: papers.doi,
    })
    .from(papers)
    .orderBy(desc(papers.createdAt))
    .limit(5);
  console.log("\nSample:");
  for (const p of sample) {
    console.log(`  - ${p.slug}`);
    console.log(`    id=${p.id}`);
    console.log(`    doi=${p.doi ?? "(none)"}`);
    console.log(`    sourceUrl=${p.sourceUrl ?? "(none)"}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
