import { db } from "../src/lib/db";
import { papers, patents, articles } from "../src/lib/db/schema";
import { sql, isNotNull } from "drizzle-orm";

async function main() {
  const [p] = await db.select({ c: sql<number>`count(*)::int` }).from(papers);
  const [pc] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(papers)
    .where(isNotNull(papers.commentary));
  const [pt] = await db.select({ c: sql<number>`count(*)::int` }).from(patents);
  const [a] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(articles);

  const byCat = await db
    .select({
      category: papers.category,
      count: sql<number>`count(*)::int`,
    })
    .from(papers)
    .groupBy(papers.category)
    .orderBy(sql`count(*) desc`);

  const byPCat = await db
    .select({
      category: patents.category,
      count: sql<number>`count(*)::int`,
    })
    .from(patents)
    .groupBy(patents.category)
    .orderBy(sql`count(*) desc`);

  console.log(`📄 论文: ${p.c} 条 (${pc.c} 有中文解读)`);
  for (const r of byCat) console.log(`   · ${r.category ?? "(未分类)"}: ${r.count}`);
  console.log();
  console.log(`🔖 专利: ${pt.c} 条`);
  for (const r of byPCat) console.log(`   · ${r.category ?? "(未分类)"}: ${r.count}`);
  console.log();
  console.log(`📰 文章: ${a.c} 条`);
}

main().then(() => process.exit(0));
