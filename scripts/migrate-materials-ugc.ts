import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS enterprise_id uuid`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS source varchar(16) NOT NULL DEFAULT 'curated'`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'verified'`;
  await sql`CREATE INDEX IF NOT EXISTS materials_status_idx ON materials (status)`;

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='materials' AND column_name IN ('enterprise_id','source','status')
    ORDER BY column_name`;
  const cnt = await sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status='verified')::int AS verified,
           count(*) FILTER (WHERE source='curated')::int AS curated
    FROM materials`;
  console.log("新增列:", cols.map((c: { column_name: string }) => c.column_name).join(", "));
  console.log("materials 行统计:", JSON.stringify(cnt[0]));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
