// Idempotent DDL for trade_remedy_measures (+ review-status enum), Neon HTTP driver
// (drizzle-kit push hangs in this env). Safe to re-run.
//   tsx --env-file=.env.local scripts/apply-trade-remedies.ts
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE trade_remedy_review_status AS ENUM ('draft','published');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trade_remedy_measures (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      measure_id varchar(80) NOT NULL,
      destination varchar(8) NOT NULL,
      origin varchar(40) NOT NULL,
      product_scope varchar(200) NOT NULL,
      scope_en varchar(200),
      hs_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
      applies_to jsonb NOT NULL DEFAULT '[]'::jsonb,
      kind varchar(20) NOT NULL,
      rate_max_bp integer NOT NULL DEFAULT 0,
      basis varchar(80),
      measure_status varchar(20) NOT NULL,
      effective_from date,
      expires_on date,
      sunset_review date,
      source jsonb,
      caveat text,
      review_status trade_remedy_review_status NOT NULL DEFAULT 'draft',
      generated_by varchar(40),
      reviewer_id uuid REFERENCES users(id),
      published_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trade_remedy_review_dest_idx ON trade_remedy_measures (review_status, destination)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trade_remedy_measure_id_idx ON trade_remedy_measures (measure_id)`);

  const r = await db.execute(
    sql`select table_name from information_schema.tables where table_name = 'trade_remedy_measures'`,
  );
  console.log("[apply-trade-remedies] table present:", (r.rows ?? []).length ? "trade_remedy_measures" : "(none)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
