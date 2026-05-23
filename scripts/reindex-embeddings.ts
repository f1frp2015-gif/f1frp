// Reindex knowledge_chunks.embedding using the currently-configured
// embedding provider (set by EMBEDDING_PROVIDER env in .env.local).
//
// Run this after switching providers — different models produce
// incompatible vector spaces even at the same dimensionality, so
// existing vectors would deliver semantically garbage matches.
//
// Usage:
//   # 1) Set in .env.local:
//   #       EMBEDDING_PROVIDER=dashscope
//   #       DASHSCOPE_API_KEY=sk-...
//   # 2) Dry run to count rows + smoke-test one embed:
//   pnpm tsx --env-file=.env.local scripts/reindex-embeddings.ts --dry-run
//   # 3) Full run:
//   pnpm tsx --env-file=.env.local scripts/reindex-embeddings.ts
//   # 4) Resume from a checkpoint (e.g. after a transient API error):
//   pnpm tsx --env-file=.env.local scripts/reindex-embeddings.ts --from-id <last-processed-id>
//
// Flags:
//   --dry-run         No DB writes; embed first row only as a smoke test.
//   --from-id <id>    Resume from rows where id > <id> (lexicographic).
//   --batch <N>       Rows per batch (default 25 — DashScope per-request cap).
//   --limit <N>       Stop after processing N rows total (debug).

import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { embedBatch } from "../src/lib/ai/embed";
import { activeEmbeddingProvider, EMBED_DIMS } from "../src/lib/ai/provider";

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.findIndex((a) => a === `--${name}`);
  if (i === -1) return def;
  return process.argv[i + 1];
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

interface Row {
  id: string;
  content: string;
}

async function fetchBatch(
  afterId: string,
  batchSize: number,
): Promise<Row[]> {
  const result = await db.execute<{ id: string; content: string }>(
    sql`SELECT id, content
        FROM knowledge_chunks
        WHERE id > ${afterId}
        ORDER BY id
        LIMIT ${batchSize}`,
  );
  const rows = (Array.isArray(result)
    ? result
    : (result as { rows?: unknown[] }).rows ?? []) as Row[];
  return rows;
}

async function totalCount(): Promise<number> {
  const result = await db.execute<{ count: number }>(
    sql`SELECT COUNT(*)::int AS count FROM knowledge_chunks`,
  );
  const rows = (Array.isArray(result)
    ? result
    : (result as { rows?: unknown[] }).rows ?? []) as Array<{
    count: number;
  }>;
  return Number(rows[0]?.count ?? 0);
}

async function updateEmbeddings(updates: { id: string; vec: number[] }[]) {
  // Use a parameterised CASE so the whole batch is a single statement —
  // avoids N round-trips on Neon.
  if (updates.length === 0) return;
  for (const u of updates) {
    const vec = `[${u.vec.join(",")}]`;
    await db.execute(
      sql`UPDATE knowledge_chunks
          SET embedding = ${vec}::vector,
              updated_at = NOW()
          WHERE id = ${u.id}`,
    );
  }
}

async function main() {
  const dryRun = flag("dry-run");
  const fromId = arg("from-id", "") ?? "";
  const batchSize = Number(arg("batch", "25"));
  const limit = arg("limit") ? Number(arg("limit")) : Infinity;

  console.log("─".repeat(60));
  console.log(`reindex-embeddings`);
  console.log(`  provider: ${activeEmbeddingProvider}`);
  console.log(`  target dims: ${EMBED_DIMS}`);
  console.log(`  dry run: ${dryRun}`);
  console.log(`  resume from id > "${fromId || "(start)"}"`);
  console.log(`  batch size: ${batchSize}`);
  if (limit !== Infinity) console.log(`  limit: ${limit}`);
  console.log("─".repeat(60));

  const total = await totalCount();
  console.log(`Total rows in knowledge_chunks: ${total}`);

  if (dryRun) {
    const sample = await fetchBatch(fromId, 1);
    if (sample.length === 0) {
      console.log("No rows. Exiting.");
      return;
    }
    console.log(`Dry-run smoke test on row id=${sample[0].id}`);
    const embeds = await embedBatch([sample[0].content.slice(0, 1000)]);
    console.log(
      `  → got ${embeds[0].length}-dim vector (expected ${EMBED_DIMS})`,
    );
    if (embeds[0].length !== EMBED_DIMS) {
      console.error(
        `  ✗ DIMENSION MISMATCH — fix providerOptions before real run`,
      );
      process.exit(2);
    }
    console.log("  ✓ Smoke test passed.");
    return;
  }

  let cursor = fromId;
  let processed = 0;
  const startedAt = Date.now();

  while (processed < limit) {
    const rows = await fetchBatch(cursor, batchSize);
    if (rows.length === 0) break;

    const take = Math.min(rows.length, limit - processed);
    const slice = rows.slice(0, take);

    const texts = slice.map((r) => r.content.slice(0, 2000));
    let vecs: number[][];
    try {
      vecs = await embedBatch(texts);
    } catch (e) {
      console.error(
        `  ✗ embed batch failed at id > "${cursor}":`,
        e instanceof Error ? e.message : e,
      );
      console.error(
        `    Resume with: --from-id ${cursor} after the cause is fixed.`,
      );
      process.exit(3);
    }

    await updateEmbeddings(
      slice.map((r, i) => ({ id: r.id, vec: vecs[i] })),
    );

    processed += take;
    cursor = slice[slice.length - 1].id;
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
    const pct = total ? Math.round((processed / total) * 100) : 0;
    console.log(
      `  ✓ ${processed}/${total} (${pct}%) — last id="${cursor}" — ${elapsedSec}s`,
    );
  }

  console.log("─".repeat(60));
  console.log(
    `Done. ${processed} rows reindexed in ${
      Math.round((Date.now() - startedAt) / 1000)
    }s.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
