// Count rows per content table to scope translation work.
// Run: pnpm tsx --env-file=.env.local scripts/count-zh-rows.ts

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const tables = [
  "materials",
  "papers",
  "patents",
  "standards",
  "standard_sections",
  "processes",
  "formulas",
  "articles",
  "cases",
  "downloads",
  "supplier_listings",
  "enterprises",
];

async function main() {
  console.log("Row counts by table:");
  for (const t of tables) {
    const r = (await sql.query(`SELECT COUNT(*)::int AS c FROM ${t}`)) as Array<{ c: number }>;
    console.log(`  ${t.padEnd(20)} ${r[0]?.c ?? 0}`);
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
