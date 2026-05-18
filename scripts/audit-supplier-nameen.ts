// Counts how many suppliers currently have an English name + verified flag.
// These are the rows that will get a dedicated /suppliers/[id] landing page.
// Anything missing nameEn is a missing long-tail page — those rows are the
// queue for scripts/backfill-supplier-translations.ts.
//
// Run: pnpm tsx --env-file=.env.local scripts/audit-supplier-nameen.ts

import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { supplierListings } from "../src/lib/db/schema";

async function main() {
  const [totals, verifiedWithEn, verifiedTotal, byCategory] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierListings),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierListings)
      .where(
        and(
          eq(supplierListings.verified, true),
          isNotNull(supplierListings.nameEn),
          ne(supplierListings.nameEn, ""),
        ),
      ),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierListings)
      .where(eq(supplierListings.verified, true)),
    db
      .select({
        category: supplierListings.category,
        total: sql<number>`count(*)::int`,
        withEn: sql<number>`sum(case when ${supplierListings.nameEn} is not null and ${supplierListings.nameEn} <> '' then 1 else 0 end)::int`,
      })
      .from(supplierListings)
      .where(eq(supplierListings.verified, true))
      .groupBy(supplierListings.category),
  ]);

  console.log("Supplier nameEn coverage audit");
  console.log("==============================");
  console.log(`Total rows:                ${totals[0]?.c ?? 0}`);
  console.log(`Verified rows:             ${verifiedTotal[0]?.c ?? 0}`);
  console.log(`Verified WITH nameEn:      ${verifiedWithEn[0]?.c ?? 0}`);
  const v = verifiedTotal[0]?.c ?? 0;
  const e = verifiedWithEn[0]?.c ?? 0;
  if (v > 0) {
    console.log(
      `Coverage:                  ${((e / v) * 100).toFixed(1)}% (${v - e} need backfill)`,
    );
  }
  console.log("");
  console.log("By category (verified only):");
  for (const r of byCategory) {
    const cat = r.category ?? "(none)";
    const total = Number(r.total ?? 0);
    const en = Number(r.withEn ?? 0);
    const pct = total > 0 ? `${((en / total) * 100).toFixed(0)}%` : "—";
    console.log(`  ${cat.padEnd(16)} ${en}/${total}  (${pct})`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
