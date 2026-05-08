// Soft-remove sup-yaoyi from the supplier directory.
//
// Why: featuring the operator's own legal entity as a "verified Chinese
// supplier" is a conflict of interest — both ethically (we curate this
// list) and from a brand-separation standpoint. The entity remains
// available as the *operator* in privacy/terms/JSON-LD Organization,
// just no longer surfaced as a supplier.
//
// Soft remove (vs hard delete) because downloads.supplier_id has a NO
// ACTION FK to supplier_listings; hard delete would fail or orphan rows.
// Setting verified=false + brandPriority=-100 drops it out of the
// "top 20 verified" JSON-LD ItemList and pushes it past every real
// supplier in the brandPriority DESC sort.

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const before = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, "sup-yaoyi"))
    .limit(1);

  if (before.length === 0) {
    console.log("[remove-yaoyi-supplier] sup-yaoyi not found — nothing to do");
    return;
  }

  console.log(
    "BEFORE:",
    JSON.stringify(
      {
        id: before[0].id,
        name: before[0].name,
        nameEn: before[0].nameEn,
        verified: before[0].verified,
        brandPriority: before[0].brandPriority,
      },
      null,
      2,
    ),
  );

  await db
    .update(supplierListings)
    .set({
      verified: false,
      brandPriority: -100,
      updatedAt: new Date(),
    })
    .where(eq(supplierListings.id, "sup-yaoyi"));

  const after = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, "sup-yaoyi"))
    .limit(1);

  console.log(
    "AFTER:",
    JSON.stringify(
      {
        id: after[0]?.id,
        name: after[0]?.name,
        verified: after[0]?.verified,
        brandPriority: after[0]?.brandPriority,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
