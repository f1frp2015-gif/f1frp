// Idempotent DDL for the weekly price-report feature: price_reports (+ enum),
// applied over the Neon HTTP driver (drizzle-kit push hangs in this env).
// Safe to re-run.
//
//   tsx --env-file=.env.local scripts/apply-price-reports.ts

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE price_report_status AS ENUM ('draft','published');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS price_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      week_of date NOT NULL,
      title varchar(200),
      summary text,
      quotes jsonb NOT NULL DEFAULT '[]'::jsonb,
      sources jsonb,
      status price_report_status NOT NULL DEFAULT 'draft',
      generated_by varchar(40),
      reviewer_id uuid REFERENCES users(id),
      published_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS price_reports_status_published_idx ON price_reports (status, published_at)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS price_reports_week_idx ON price_reports (week_of)`);

  const r = await db.execute(sql`
    select table_name from information_schema.tables where table_name = 'price_reports'
  `);
  console.log(
    "[apply-price-reports] table present:",
    (r.rows ?? []).length ? "price_reports" : "(none)",
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
