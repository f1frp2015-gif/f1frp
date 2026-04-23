// Throwaway: report today's ingested content counts.
// Run: pnpm tsx --env-file=.env.local scripts/check-today.ts

import { db } from "../src/lib/db";
import { papers, patents, articles, posts } from "../src/lib/db/schema";
import { gte, sql, desc, and, isNotNull } from "drizzle-orm";

function startOfDayUTC(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function startOfDayLocal(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function main() {
  const today = startOfDayLocal();
  const todayUTC = startOfDayUTC();
  const last24h = new Date(Date.now() - 24 * 3600 * 1000);

  console.log(`⏱  Now: ${new Date().toISOString()}`);
  console.log(`   Local start-of-day: ${today.toISOString()}`);
  console.log(`   UTC start-of-day:   ${todayUTC.toISOString()}`);
  console.log(`   Last 24h cutoff:    ${last24h.toISOString()}`);
  console.log();

  // ── Papers today
  const papersToday = await db
    .select({
      id: papers.id,
      slug: papers.slug,
      title: papers.title,
      createdAt: papers.createdAt,
      hasCommentary: sql<boolean>`${papers.commentary} IS NOT NULL`,
    })
    .from(papers)
    .where(gte(papers.createdAt, last24h))
    .orderBy(desc(papers.createdAt))
    .limit(20);

  console.log(`📄 Papers (last 24h): ${papersToday.length}`);
  for (const p of papersToday) {
    const mark = p.hasCommentary ? "✓ 解读" : "—";
    console.log(`   [${mark}] ${p.title?.slice(0, 50)} — /papers/${p.slug}`);
  }
  console.log();

  // ── Patents today
  const patentsToday = await db
    .select({
      id: patents.id,
      slug: patents.slug,
      title: patents.title,
      createdAt: patents.createdAt,
    })
    .from(patents)
    .where(gte(patents.createdAt, last24h))
    .orderBy(desc(patents.createdAt))
    .limit(20);

  console.log(`🔖 Patents (last 24h): ${patentsToday.length}`);
  for (const p of patentsToday) {
    console.log(`   ${p.title?.slice(0, 50)} — /patents/${p.slug}`);
  }
  console.log();

  // ── Articles today (RSS ingestion)
  const articlesToday = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      category: articles.category,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(gte(articles.createdAt, last24h))
    .orderBy(desc(articles.createdAt))
    .limit(20);

  console.log(`📰 Articles (last 24h): ${articlesToday.length}`);
  for (const a of articlesToday) {
    console.log(`   [${a.category}] ${a.title?.slice(0, 50)} — /articles/${a.slug}`);
  }
  console.log();

  // ── Q&A posts today
  const postsToday = await db
    .select({
      id: posts.id,
      title: posts.title,
      type: posts.type,
      status: posts.status,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(gte(posts.createdAt, last24h))
    .orderBy(desc(posts.createdAt))
    .limit(20);

  console.log(`❓ Community posts (last 24h): ${postsToday.length}`);
  for (const p of postsToday) {
    console.log(`   [${p.type}/${p.status}] ${p.title?.slice(0, 50)}`);
  }
  console.log();

  // ── Totals
  const [{ totalPapers }] = await db
    .select({ totalPapers: sql<number>`count(*)::int` })
    .from(papers);
  const [{ totalPatents }] = await db
    .select({ totalPatents: sql<number>`count(*)::int` })
    .from(patents);
  const [{ totalArticles }] = await db
    .select({ totalArticles: sql<number>`count(*)::int` })
    .from(articles);
  const [{ papersWithCommentary }] = await db
    .select({ papersWithCommentary: sql<number>`count(*)::int` })
    .from(papers)
    .where(isNotNull(papers.commentary));

  console.log("📊 Totals:");
  console.log(`   papers:    ${totalPapers} (${papersWithCommentary} 有解读)`);
  console.log(`   patents:   ${totalPatents}`);
  console.log(`   articles:  ${totalArticles}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
