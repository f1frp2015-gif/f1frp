// Idempotent DDL for the supplier-qualification feature (交付 2):
//   supplier_documents + supplier_document_tags (+ 3 enums), applied over the
//   Neon HTTP driver. `drizzle-kit push` hangs in this env (websocket pull);
//   the app's own client (src/lib/db) uses Neon HTTP, which is reliable.
//   Additive + guarded — safe to re-run.
//
//   tsx --env-file=.env.local scripts/apply-supplier-documents.ts

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  // ── enums(CREATE TYPE 无 IF NOT EXISTS,用 DO 块吞 duplicate_object)──
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE supplier_doc_kind AS ENUM ('license','product','test','cert');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE supplier_doc_status AS ENUM
        ('uploaded','extracting','extracted','needs_review','approved','rejected','expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE tag_source AS ENUM ('ai','human','rollup');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  // ── supplier_documents ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS supplier_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_listing_id varchar(50) REFERENCES supplier_listings(id) ON DELETE CASCADE,
      enterprise_id uuid REFERENCES enterprises(id),
      uploaded_by_user_id uuid NOT NULL REFERENCES users(id),
      kind supplier_doc_kind NOT NULL,
      oss_key text NOT NULL,
      file_name varchar(200),
      content_type varchar(80),
      status supplier_doc_status NOT NULL DEFAULT 'uploaded',
      extracted_data jsonb,
      extraction_model varchar(40),
      extraction_confidence integer,
      cert_no varchar(120),
      issuer varchar(120),
      valid_from date,
      valid_to date,
      reviewer_id uuid REFERENCES users(id),
      review_note text,
      reviewed_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_documents_supplier_idx ON supplier_documents (supplier_listing_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_documents_enterprise_idx ON supplier_documents (enterprise_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_documents_status_idx ON supplier_documents (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_documents_kind_idx ON supplier_documents (kind)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_documents_valid_to_idx ON supplier_documents (valid_to)`);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS supplier_documents_certno_uq
      ON supplier_documents (issuer, cert_no) WHERE cert_no IS NOT NULL
  `);

  // ── supplier_document_tags ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS supplier_document_tags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES supplier_documents(id) ON DELETE CASCADE,
      supplier_listing_id varchar(50) REFERENCES supplier_listings(id) ON DELETE CASCADE,
      tag_id varchar(64) NOT NULL,
      facet varchar(16) NOT NULL,
      trust integer NOT NULL DEFAULT 0,
      source tag_source NOT NULL DEFAULT 'ai',
      cert_no varchar(120),
      valid_to date,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_document_tags_supplier_facet_idx ON supplier_document_tags (supplier_listing_id, facet)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS supplier_document_tags_tag_idx ON supplier_document_tags (tag_id)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS supplier_document_tags_doc_tag_uq ON supplier_document_tags (document_id, tag_id)`);

  // ── verify ──
  const r = await db.execute(sql`
    select table_name from information_schema.tables
    where table_name in ('supplier_documents','supplier_document_tags')
    order by table_name
  `);
  const rows = (r.rows ?? []) as Array<{ table_name: string }>;
  console.log(
    "[apply-supplier-documents] tables present:",
    rows.map((x) => x.table_name).join(", ") || "(none)",
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
