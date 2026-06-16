// Shared embed + upsert for knowledge_chunks — the single "回灌桥" used by every
// live ingest path (UGC approval, daily paper/patent cron, demand digest), so
// they all write RAG chunks the same way as scripts/embed-corpus.ts.
//
// ⚠️ Embedding-provider invariant: the chunk is embedded with whatever
// EMBEDDING_PROVIDER this deployment has set (DashScope domestic / Google
// overseas). The knowledge_chunks index must stay single-provider — run live
// embeds on the deploy whose provider matches the index (same constraint
// embed-corpus.ts already lives under). Mixing providers => garbage retrieval.

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { embedText } from "@/lib/ai/embed";

export type KbSourceType =
  | "material"
  | "standard"
  | "paper"
  | "patent"
  | "formula"
  | "article"
  | "supplier";

export type KbChunk = {
  id: string;
  sourceType: KbSourceType;
  sourceId: string;
  title: string;
  content: string;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function embedAndUpsertChunk(c: KbChunk): Promise<void> {
  const emb = await embedText(`${c.title}\n${c.content}`.slice(0, 2000));
  const embStr = `[${emb.join(",")}]`;
  await db.execute(sql`
    INSERT INTO knowledge_chunks (id, source_type, source_id, title, content, url, metadata, embedding, updated_at)
    VALUES (${c.id}, ${c.sourceType}::knowledge_source, ${c.sourceId}, ${c.title}, ${c.content},
            ${c.url ?? null}, ${c.metadata ?? null}, ${embStr}::vector, now())
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      url = EXCLUDED.url,
      metadata = EXCLUDED.metadata,
      embedding = EXCLUDED.embedding,
      updated_at = now();
  `);
}

// Embed many chunks; per-chunk failures are counted, not fatal.
export async function embedAndUpsertChunks(chunks: KbChunk[]): Promise<{ embedded: number; errors: number }> {
  let embedded = 0;
  let errors = 0;
  for (const c of chunks) {
    try {
      await embedAndUpsertChunk(c);
      embedded++;
    } catch (e) {
      errors++;
      console.warn("[kb-chunk] embed failed", c.id, e instanceof Error ? e.message : e);
    }
  }
  return { embedded, errors };
}
