// One-shot: ensure pgvector + knowledge_chunks table + HNSW index.
// Run: pnpm tsx --env-file=.env.local scripts/migrate-rag.ts

import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

async function run() {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  console.log("✓ vector extension ready");

  // Ensure enum
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE knowledge_source AS ENUM ('material','standard','paper','patent','formula','article','supplier');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id varchar(200) PRIMARY KEY,
      source_type knowledge_source NOT NULL,
      source_id varchar(200) NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      url text,
      metadata jsonb,
      embedding vector(768),
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS knowledge_chunks_source_idx ON knowledge_chunks (source_type, source_id)`
  );

  // HNSW cosine index — empty table is fine
  try {
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)`
    );
    console.log("✓ HNSW index ready");
  } catch (e) {
    console.log(
      "! HNSW skipped:",
      e instanceof Error ? e.message : e
    );
  }

  console.log("✅ migration complete");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
