// Idempotent DDL to add the Sourcing Desk columns (getfrp P0) to
// supplier_listings, applied over the Neon HTTP driver.
//
// Why not `drizzle-kit push`: its websocket-based schema pull hangs / drops in
// this environment. The app's own client (src/lib/db) uses the Neon HTTP driver,
// which is reliable — so we run the additive DDL directly. Safe to re-run.
//
//   tsx --env-file=.env.local scripts/apply-sourcing-columns.ts

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE supplier_listings
      ADD COLUMN IF NOT EXISTS capabilities jsonb,
      ADD COLUMN IF NOT EXISTS standards_supported jsonb,
      ADD COLUMN IF NOT EXISTS moq_kg integer,
      ADD COLUMN IF NOT EXISTS lead_time_days integer,
      ADD COLUMN IF NOT EXISTS export_ready boolean NOT NULL DEFAULT false
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS supplier_listings_export_ready_idx
      ON supplier_listings (export_ready)
  `);

  const r = await db.execute(sql`
    select column_name from information_schema.columns
    where table_name = 'supplier_listings'
      and column_name in ('capabilities','standards_supported','moq_kg','lead_time_days','export_ready')
    order by column_name
  `);
  const rows = (r.rows ?? []) as Array<{ column_name: string }>;
  console.log(
    "[apply-sourcing-columns] present columns:",
    rows.map((x) => x.column_name).join(", ") || "(none)",
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
