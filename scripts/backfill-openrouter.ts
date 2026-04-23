// Backfill commentary via OpenRouter (Claude Haiku by default).
// Priority-first: pultrusion / RTM / HP-RTM hits go to the front.
//
// Run: pnpm tsx --env-file=.env.local scripts/backfill-openrouter.ts
//   --concurrency=N    (default 5)
//   --papers-only / --patents-only
//   --rpm=N            optional soft cap (default 60; OpenRouter has no free-tier wall)

import { db } from "../src/lib/db";
import { papers, patents } from "../src/lib/db/schema";
import {
  generatePaperCommentaryOR,
  generatePatentCommentaryOR,
} from "../src/lib/ingest/openrouter-commentary";
import { eq, isNull, desc, sql } from "drizzle-orm";

type Args = {
  concurrency: number;
  papersOnly: boolean;
  patentsOnly: boolean;
  rpm: number;
};
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const a: Args = {
    concurrency: 5,
    papersOnly: false,
    patentsOnly: false,
    rpm: 60,
  };
  for (const s of args) {
    if (s.startsWith("--concurrency="))
      a.concurrency = Math.max(1, parseInt(s.slice(14), 10) || 5);
    else if (s.startsWith("--rpm="))
      a.rpm = Math.max(1, parseInt(s.slice(6), 10) || 60);
    else if (s === "--papers-only") a.papersOnly = true;
    else if (s === "--patents-only") a.patentsOnly = true;
  }
  return a;
}

let minIntervalMs = 1000;
let lastRequestAt = 0;
async function pace() {
  const wait = minIntervalMs - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

const PRIORITY = ["拉挤", "pultrus", "pultrud", "RTM", "VARTM", "树脂传递", "HP-RTM"];
function priorityScore(text: string): number {
  if (!text) return 0;
  for (let i = 0; i < PRIORITY.length; i++) {
    if (text.toLowerCase().includes(PRIORITY[i].toLowerCase())) return 10 - i;
  }
  return 0;
}

async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number, total: number) => Promise<void>
) {
  const queue = items.map((item, idx) => ({ item, idx }));
  const total = items.length;
  async function worker(wid: number) {
    while (queue.length) {
      const next = queue.shift();
      if (!next) break;
      try {
        await fn(next.item, next.idx, total);
      } catch (e) {
        console.warn(`[w${wid}] err: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));
}

async function backfillPapers(concurrency: number) {
  console.log(`📄 fetching papers with commentary=NULL`);
  const rows = await db
    .select({
      id: papers.id,
      title: papers.title,
      titleEn: papers.titleEn,
      abstract: papers.abstract,
      journal: papers.journal,
      year: papers.year,
      keywords: papers.keywords,
    })
    .from(papers)
    .where(isNull(papers.commentary))
    .orderBy(desc(papers.createdAt));

  const scored = rows
    .map((r) => ({
      row: r,
      score: priorityScore(`${r.title ?? ""} ${r.titleEn ?? ""} ${r.abstract ?? ""}`),
    }))
    .sort((a, b) => b.score - a.score);

  const prio = scored.filter((s) => s.score > 0).length;
  console.log(
    `   total=${rows.length}, priority=${prio}, rest=${rows.length - prio}`
  );

  let done = 0,
    skipped = 0,
    errors = 0;
  await pool(scored, concurrency, async ({ row, score }, idx, total) => {
    await pace();
    const commentary = await generatePaperCommentaryOR({
      title: row.title,
      titleEn: row.titleEn ?? undefined,
      abstract: row.abstract ?? undefined,
      journal: row.journal ?? undefined,
      year: row.year ?? undefined,
      keywords: (row.keywords as string[] | null) ?? undefined,
    });
    if (!commentary) {
      skipped++;
      return;
    }
    try {
      await db
        .update(papers)
        .set({ commentary, updatedAt: new Date() })
        .where(eq(papers.id, row.id));
      done++;
      const tag = score > 0 ? "⭐" : " ";
      if (done % 10 === 0 || score > 0) {
        console.log(
          `  ${tag} paper ${idx + 1}/${total} ✓ ${row.title?.slice(0, 50)} (${commentary.length} chars) · done=${done}`
        );
      }
    } catch (e) {
      errors++;
      console.warn(`  paper ${row.id}: ${e instanceof Error ? e.message : e}`);
    }
  });
  console.log(`📊 papers: ${done} written, ${skipped} empty, ${errors} errors`);
}

async function backfillPatents(concurrency: number) {
  console.log(`🔖 fetching patents with commentary=NULL`);
  const rows = await db
    .select({
      id: patents.id,
      title: patents.title,
      titleEn: patents.titleEn,
      abstract: patents.abstract,
      applicant: patents.applicant,
      country: patents.country,
      filingDate: patents.filingDate,
      grantDate: patents.grantDate,
    })
    .from(patents)
    .where(isNull(patents.commentary))
    .orderBy(desc(patents.createdAt));

  const scored = rows
    .map((r) => ({
      row: r,
      score: priorityScore(`${r.title ?? ""} ${r.titleEn ?? ""} ${r.abstract ?? ""}`),
    }))
    .sort((a, b) => b.score - a.score);

  const prio = scored.filter((s) => s.score > 0).length;
  console.log(
    `   total=${rows.length}, priority=${prio}, rest=${rows.length - prio}`
  );

  let done = 0,
    skipped = 0,
    errors = 0;
  await pool(scored, concurrency, async ({ row, score }, idx, total) => {
    await pace();
    const commentary = await generatePatentCommentaryOR({
      title: row.title,
      titleEn: row.titleEn ?? undefined,
      abstract: row.abstract ?? undefined,
      applicant: row.applicant ?? undefined,
      country: row.country ?? undefined,
      filingDate: row.filingDate ?? undefined,
      grantDate: row.grantDate ?? undefined,
    });
    if (!commentary) {
      skipped++;
      return;
    }
    try {
      await db
        .update(patents)
        .set({ commentary, updatedAt: new Date() })
        .where(eq(patents.id, row.id));
      done++;
      const tag = score > 0 ? "⭐" : " ";
      if (done % 20 === 0 || score > 0) {
        console.log(
          `  ${tag} patent ${idx + 1}/${total} ✓ ${row.title?.slice(0, 50)} (${commentary.length} chars) · done=${done}`
        );
      }
    } catch (e) {
      errors++;
      console.warn(`  patent ${row.id}: ${e instanceof Error ? e.message : e}`);
    }
  });
  console.log(`📊 patents: ${done} written, ${skipped} empty, ${errors} errors`);
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not set");
    process.exit(1);
  }
  const { concurrency, papersOnly, patentsOnly, rpm } = parseArgs();
  minIntervalMs = Math.max(50, Math.ceil(60_000 / rpm));

  console.log(`🤖 model = ${process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4.5"}`);
  console.log(`🎯 priority keywords: ${PRIORITY.join(", ")}`);
  console.log(
    `   concurrency=${concurrency} rpm=${rpm} (minInterval=${minIntervalMs}ms)\n`
  );

  if (!patentsOnly) await backfillPapers(concurrency);
  if (!papersOnly) await backfillPatents(concurrency);

  console.log(`\n🎉 backfill done`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
