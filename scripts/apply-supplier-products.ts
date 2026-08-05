// Idempotent, additive DDL for the structured supplier-product catalog.
// Safe to re-run; no existing row or column is changed.
//
//   pnpm exec tsx --env-file=.env.local scripts/apply-supplier-products.ts

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS supplier_catalog_products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      enterprise_id uuid NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
      supplier_listing_id varchar(50) REFERENCES supplier_listings(id) ON DELETE SET NULL,
      created_by_user_id uuid NOT NULL REFERENCES users(id),
      name varchar(200) NOT NULL,
      name_en varchar(200) NOT NULL,
      description text,
      description_en text,
      object_type varchar(48) NOT NULL,
      product_family varchar(64) NOT NULL,
      form varchar(48),
      processes jsonb NOT NULL DEFAULT '[]'::jsonb,
      materials jsonb NOT NULL DEFAULT '[]'::jsonb,
      resins jsonb NOT NULL DEFAULT '[]'::jsonb,
      applications jsonb NOT NULL DEFAULT '[]'::jsonb,
      standards jsonb NOT NULL DEFAULT '[]'::jsonb,
      specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
      datasheet_key text,
      datasheet_file_name varchar(200),
      classification_status varchar(32) NOT NULL DEFAULT 'supplier_confirmed',
      classification_source varchar(32) NOT NULL DEFAULT 'deterministic_rule',
      classification_rule_version varchar(48) NOT NULL,
      classification_confidence integer NOT NULL,
      classification_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
      publication_status varchar(24) NOT NULL DEFAULT 'draft',
      reviewer_id uuid REFERENCES users(id),
      review_note text,
      reviewed_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT supplier_catalog_products_confidence_check
        CHECK (classification_confidence BETWEEN 0 AND 100),
      CONSTRAINT supplier_catalog_products_classification_status_check
        CHECK (classification_status IN ('suggested','supplier_confirmed','platform_verified','rejected')),
      CONSTRAINT supplier_catalog_products_publication_status_check
        CHECK (publication_status IN ('draft','published','archived','rejected'))
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_catalog_products_enterprise_idx ON supplier_catalog_products (enterprise_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_catalog_products_listing_idx ON supplier_catalog_products (supplier_listing_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_catalog_products_family_idx ON supplier_catalog_products (product_family)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_catalog_products_publication_idx ON supplier_catalog_products (publication_status)`);

  const result = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'supplier_catalog_products'
  `);
  console.log(
    "[apply-supplier-products] table present:",
    result.rows?.length === 1 ? "supplier_catalog_products" : "(missing)",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
