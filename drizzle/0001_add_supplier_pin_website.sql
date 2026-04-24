-- Incremental migration: adds `pinned` + `website` to supplier_listings so a
-- supplier can be shown at the top of the directory with a link to its site.
-- Kept hand-written (not generated) because this repo uses `pnpm db:push` as
-- the normal flow and we do not have a tracked baseline migration.
--
-- Apply with either:
--   pnpm db:push               (auto-diff from schema.ts)
--   psql $DATABASE_URL -f drizzle/0001_add_supplier_pin_website.sql

ALTER TABLE "supplier_listings"
  ADD COLUMN IF NOT EXISTS "pinned" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "website" varchar(255);

CREATE INDEX IF NOT EXISTS "supplier_listings_pinned_idx"
  ON "supplier_listings" ("pinned");
