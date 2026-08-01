// Idempotent DDL for Thomasnet-style supplier company pages.
//
//   tsx --env-file=.env.local scripts/apply-supplier-profile-fields.ts

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE supplier_listings
      ADD COLUMN IF NOT EXISTS products_services_summary text,
      ADD COLUMN IF NOT EXISTS products_services_summary_en text,
      ADD COLUMN IF NOT EXISTS ecatalogs jsonb
  `);

  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'supplier_listings'
      AND column_name IN (
        'products_services_summary',
        'products_services_summary_en',
        'ecatalogs'
      )
    ORDER BY column_name
  `);
  const rows = (result.rows ?? []) as Array<{ column_name: string }>;
  console.log(
    "[apply-supplier-profile-fields] present columns:",
    rows.map((row) => row.column_name).join(", ") || "(none)",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
