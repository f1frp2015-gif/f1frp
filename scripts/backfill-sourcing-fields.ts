// Backfill Sourcing Desk fields (getfrp P0): export_ready + capabilities +
// standards_supported + moq_kg + lead_time_days for verified FRP-product makers.
//
//   1) npm run db:push                                  # apply the new columns
//   2) tsx --env-file=.env.local scripts/backfill-sourcing-fields.ts
//
// Idempotent. Derives a coarse capability set from each supplier's product
// labels and marks verified finished-product makers as export-ready. This is the
// 国内筛选→海外消费 gate — only export_ready rows surface to getfrp's
// feasibility_match. Defaults below are conservative placeholders; tune per real
// factory in later weeks (W5-6: real MOQ / lead time / documented standards).

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deriveCapabilities } from "@/lib/sourcing/spec";

const DEFAULT_STANDARDS = ["ISO 9001", "GB/T 1447", "GB/T 1449"];
const DEFAULT_MOQ_KG = 500;
const DEFAULT_LEAD_DAYS = 35;

async function main() {
  const rows = await db
    .select({
      id: supplierListings.id,
      products: supplierListings.products,
      certifications: supplierListings.certifications,
      verified: supplierListings.verified,
    })
    .from(supplierListings);

  let updated = 0;
  let skipped = 0;
  for (const r of rows) {
    // Only verified makers whose products map to a matchable FRP product family.
    if (!r.verified) {
      skipped++;
      continue;
    }
    const caps = deriveCapabilities(r.products);
    if (caps.length === 0) {
      skipped++;
      continue;
    }

    const standards = Array.from(new Set([...(r.certifications ?? []), ...DEFAULT_STANDARDS]));

    await db
      .update(supplierListings)
      .set({
        capabilities: caps,
        standardsSupported: standards,
        moqKg: DEFAULT_MOQ_KG,
        leadTimeDays: DEFAULT_LEAD_DAYS,
        exportReady: true,
        updatedAt: new Date(),
      })
      .where(eq(supplierListings.id, r.id));
    updated++;
  }

  console.log(
    `[backfill-sourcing-fields] export-ready makers updated: ${updated}, skipped: ${skipped}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
