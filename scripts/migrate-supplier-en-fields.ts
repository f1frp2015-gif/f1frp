// One-off migration: add English-version columns to supplier_listings.
// Idempotent — safe to run multiple times.

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding English columns to supplier_listings…");

  await db.execute(sql`
    ALTER TABLE supplier_listings
      ADD COLUMN IF NOT EXISTS name_en VARCHAR(200),
      ADD COLUMN IF NOT EXISTS location_en VARCHAR(100),
      ADD COLUMN IF NOT EXISTS products_en JSONB,
      ADD COLUMN IF NOT EXISTS process_list_en JSONB,
      ADD COLUMN IF NOT EXISTS description_en TEXT,
      ADD COLUMN IF NOT EXISTS certifications_en JSONB
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS supplier_listings_name_en_idx
      ON supplier_listings(name_en)
  `);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
