// Backfill commentary for existing papers that were ingested before the
// commentary column / generator existed. One-shot — re-run idempotent (skips
// rows that already have commentary, so it's safe to run repeatedly).
//
// Run: pnpm tsx --env-file=.env.local scripts/backfill-commentary.ts
//   Optional flags:
//     --limit=N      only process N rows (default: all)
//     --dry-run      preview without writing
//     --concurrency=N  parallel Gemini calls (default: 3)

import { db } from "../src/lib/db";
import { papers } from "../src/lib/db/schema";
import { generatePaperCommentary } from "../src/lib/ingest/commentary";
import { isNull, eq, desc } from "drizzle-orm";

type Args = { limit?: number; dryRun: boolean; concurrency: number };
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const a: Args = { dryRun: false, concurrency: 3 };
  for (const s of args) {
    if (s === "--dry-run") a.dryRun = true;
    else if (s.startsWith("--limit=")) a.limit = parseInt(s.slice(8), 10);
    else if (s.startsWith("--concurrency="))
      a.concurrency = Math.max(1, parseInt(s.slice(14), 10) || 3);
  }
  return a;
}

async function main() {
  const { limit, dryRun, concurrency } = parseArgs();

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY not set");
    process.exit(1);
  }

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
    .orderBy(desc(papers.createdAt))
    .limit(limit ?? 10_000);

  console.log(
    `📋 Found ${rows.length} papers missing commentary (concurrency=${concurrency}${
      dryRun ? ", DRY RUN" : ""
    })`
  );

  let done = 0;
  let skipped = 0;
  let errors = 0;

  // Simple worker pool
  const queue = [...rows];
  async function worker(workerId: number) {
    while (queue.length) {
      const row = queue.shift();
      if (!row) break;
      const idx = rows.length - queue.length;
      try {
        const commentary = await generatePaperCommentary({
          title: row.title,
          titleEn: row.titleEn ?? undefined,
          abstract: row.abstract ?? undefined,
          journal: row.journal ?? undefined,
          year: row.year ?? undefined,
          keywords: (row.keywords as string[] | null) ?? undefined,
        });

        if (!commentary) {
          skipped++;
          console.log(
            `  [w${workerId}] ${idx}/${rows.length} skip (empty): ${row.title?.slice(0, 40)}`
          );
          continue;
        }

        if (!dryRun) {
          await db
            .update(papers)
            .set({ commentary, updatedAt: new Date() })
            .where(eq(papers.id, row.id));
        }
        done++;
        console.log(
          `  [w${workerId}] ${idx}/${rows.length} ✓ ${row.title?.slice(0, 40)} (${commentary.length} chars)`
        );
      } catch (e) {
        errors++;
        console.warn(
          `  [w${workerId}] ${idx}/${rows.length} ✗ ${row.id}: ${
            e instanceof Error ? e.message : e
          }`
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, (_, i) => worker(i + 1))
  );

  console.log();
  console.log(
    `🎉 Backfill done: ${done} written, ${skipped} skipped (empty), ${errors} errors`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
