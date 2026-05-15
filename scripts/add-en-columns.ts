// Adds *_en columns required for getfrp.com (English overseas site).
// Idempotent (uses IF NOT EXISTS). Pure additive — no data destruction.
//
// Run: pnpm tsx --env-file=.env.local scripts/add-en-columns.ts

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const STATEMENTS: string[] = [
  // materials
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS sub_category_en varchar(100)`,
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS brand_en varchar(100)`,
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS model_en varchar(100)`,
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS properties_en jsonb`,
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS applications_en jsonb`,
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS description_en text`,

  // formulas
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS name_en varchar(200)`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS process_en varchar(100)`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS application_en varchar(200)`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS description_en text`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS resin_system_en jsonb`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS reinforcement_en jsonb`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS auxiliaries_en jsonb`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS processing_en jsonb`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS properties_en jsonb`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS tips_en jsonb`,
  `ALTER TABLE formulas ADD COLUMN IF NOT EXISTS safety_notes_en jsonb`,

  // standards
  `ALTER TABLE standards ADD COLUMN IF NOT EXISTS country_en varchar(50)`,
  `ALTER TABLE standards ADD COLUMN IF NOT EXISTS category_en varchar(50)`,
  `ALTER TABLE standards ADD COLUMN IF NOT EXISTS process_en jsonb`,
  `ALTER TABLE standards ADD COLUMN IF NOT EXISTS status_en varchar(20)`,
  `ALTER TABLE standards ADD COLUMN IF NOT EXISTS description_en text`,

  // standard_sections
  `ALTER TABLE standard_sections ADD COLUMN IF NOT EXISTS title_en text`,
  `ALTER TABLE standard_sections ADD COLUMN IF NOT EXISTS body_en text`,
  `ALTER TABLE standard_sections ADD COLUMN IF NOT EXISTS key_points_en jsonb`,

  // papers
  `ALTER TABLE papers ADD COLUMN IF NOT EXISTS affiliation_en text`,
  `ALTER TABLE papers ADD COLUMN IF NOT EXISTS journal_en varchar(200)`,
  `ALTER TABLE papers ADD COLUMN IF NOT EXISTS abstract_en text`,
  `ALTER TABLE papers ADD COLUMN IF NOT EXISTS commentary_en text`,
  `ALTER TABLE papers ADD COLUMN IF NOT EXISTS keywords_en jsonb`,
  `ALTER TABLE papers ADD COLUMN IF NOT EXISTS category_en varchar(50)`,

  // patents
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS applicant_en text`,
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS inventors_en jsonb`,
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS commentary_en text`,
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS country_en varchar(30)`,
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS abstract_en text`,
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS claims_en text`,
  `ALTER TABLE patents ADD COLUMN IF NOT EXISTS category_en varchar(50)`,

  // processes
  `ALTER TABLE processes ADD COLUMN IF NOT EXISTS description_en text`,
  `ALTER TABLE processes ADD COLUMN IF NOT EXISTS advantages_en jsonb`,
  `ALTER TABLE processes ADD COLUMN IF NOT EXISTS disadvantages_en jsonb`,
  `ALTER TABLE processes ADD COLUMN IF NOT EXISTS applications_en jsonb`,
  `ALTER TABLE processes ADD COLUMN IF NOT EXISTS key_parameters_en jsonb`,

  // articles
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_en text`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS excerpt_en text`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS body_en text`,

  // cases
  `ALTER TABLE cases ADD COLUMN IF NOT EXISTS title_en text`,
  `ALTER TABLE cases ADD COLUMN IF NOT EXISTS description_en text`,
  `ALTER TABLE cases ADD COLUMN IF NOT EXISTS location_en varchar(100)`,
  `ALTER TABLE cases ADD COLUMN IF NOT EXISTS industry_en varchar(50)`,

  // downloads
  `ALTER TABLE downloads ADD COLUMN IF NOT EXISTS title_en text`,
  `ALTER TABLE downloads ADD COLUMN IF NOT EXISTS description_en text`,
];

async function main() {
  console.log(`Applying ${STATEMENTS.length} ALTER TABLE statements…`);
  for (const stmt of STATEMENTS) {
    try {
      await sql.query(stmt);
      console.log(`  ✓ ${stmt.slice(0, 80)}…`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${stmt}`);
      throw err;
    }
  }
  console.log("All columns added.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
