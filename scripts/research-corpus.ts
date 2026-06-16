// Pull real source material for the f1frp-research-digest skill from the DB:
// relevant ingested papers + patents (CrossRef/OpenAlex/PatentsView via the
// ingest-daily cron) and the list of existing article titles (for dedup).
//
// Usage: pnpm tsx --env-file=.env.local scripts/research-corpus.ts "<keyword>"
//   keyword is matched (ILIKE) against title/abstract/keywords. Omit for recent.

import { existsSync, readFileSync } from "node:fs";

for (const envPath of [".env.local", ".env"]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    let v = raw.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[key] = v;
  }
}

import { sql, desc } from "drizzle-orm";
import { db } from "../src/lib/db";
import { papers, patents, articles } from "../src/lib/db/schema";

function snip(s: string | null | undefined, n = 300): string {
  if (!s) return "";
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

async function main() {
  const kw = (process.argv[2] ?? "").trim();
  const like = `%${kw}%`;

  const paperRows = await db
    .select({
      title: papers.title,
      titleEn: papers.titleEn,
      journal: papers.journal,
      year: papers.year,
      doi: papers.doi,
      sourceUrl: papers.sourceUrl,
      abstract: papers.abstract,
      commentary: papers.commentary,
      cites: papers.citationCount,
    })
    .from(papers)
    .where(
      kw
        ? sql`(${papers.title} ILIKE ${like} OR ${papers.titleEn} ILIKE ${like} OR ${papers.abstract} ILIKE ${like} OR ${papers.keywords}::text ILIKE ${like})`
        : sql`true`,
    )
    .orderBy(desc(papers.citationCount), desc(papers.year))
    .limit(12);

  const patentRows = await db
    .select({
      title: patents.title,
      titleEn: patents.titleEn,
      applicant: patents.applicant,
      pubNo: patents.publicationNo,
      sourceUrl: patents.sourceUrl,
      abstract: patents.abstract,
      commentary: patents.commentary,
      date: patents.publicationDate,
    })
    .from(patents)
    .where(
      kw
        ? sql`(${patents.title} ILIKE ${like} OR ${patents.titleEn} ILIKE ${like} OR ${patents.abstract} ILIKE ${like} OR ${patents.applicant} ILIKE ${like})`
        : sql`true`,
    )
    .orderBy(desc(patents.publicationDate))
    .limit(10);

  const existing = await db
    .select({ title: articles.title, slug: articles.slug })
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(60);

  console.log(`# 研究语料 — keyword: ${kw || "(recent)"}\n`);
  console.log(`## 论文 (${paperRows.length}) — 库内真实条目, 引用其结论需注明来源\n`);
  for (const p of paperRows) {
    console.log(`- 【${p.year ?? "?"}】${p.title}${p.titleEn ? ` / ${p.titleEn}` : ""}`);
    console.log(`  期刊:${p.journal ?? "-"} 引用:${p.cites ?? 0} DOI:${p.doi ?? "-"} URL:${p.sourceUrl ?? "-"}`);
    if (p.commentary) console.log(`  解读:${snip(p.commentary, 220)}`);
    else if (p.abstract) console.log(`  摘要:${snip(p.abstract, 220)}`);
  }
  console.log(`\n## 专利 (${patentRows.length})\n`);
  for (const p of patentRows) {
    console.log(`- ${p.title}${p.titleEn ? ` / ${p.titleEn}` : ""}`);
    console.log(`  申请人:${p.applicant ?? "-"} 公开号:${p.pubNo ?? "-"} URL:${p.sourceUrl ?? "-"}`);
    if (p.commentary) console.log(`  解读:${snip(p.commentary, 200)}`);
    else if (p.abstract) console.log(`  摘要:${snip(p.abstract, 200)}`);
  }
  console.log(`\n## 已有文章标题 (${existing.length}) — 选题须与这些去重\n`);
  for (const a of existing) console.log(`- ${a.title}  [${a.slug}]`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("failed:", e);
    process.exit(1);
  });
