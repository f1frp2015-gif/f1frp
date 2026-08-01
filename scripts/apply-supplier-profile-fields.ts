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
      ADD COLUMN IF NOT EXISTS ecatalogs jsonb,
      ADD COLUMN IF NOT EXISTS profile_published boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS profile_reviewed_at timestamp,
      ADD COLUMN IF NOT EXISTS logo varchar(500),
      ADD COLUMN IF NOT EXISTS contact_email varchar(255),
      ADD COLUMN IF NOT EXISTS contact_phone varchar(64),
      ADD COLUMN IF NOT EXISTS address text
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS supplier_listings_profile_published_idx
      ON supplier_listings (profile_published)
  `);

  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'supplier_listings'
      AND column_name IN (
        'products_services_summary',
        'products_services_summary_en',
        'ecatalogs',
        'profile_published',
        'profile_reviewed_at',
        'logo',
        'contact_email',
        'contact_phone',
        'address'
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
