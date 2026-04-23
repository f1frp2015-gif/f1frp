import "dotenv/config";

import { db } from "../src/lib/db";
import {
  materials as materialsTable,
  formulas as formulasTable,
  supplierListings,
} from "../src/lib/db/schema";
import {
  MATERIALS_SEED,
  FORMULAS_SEED,
  SUPPLIERS_SEED,
} from "./seed-data";

async function run() {
  console.log(`🌱 Starting large seed…`);
  console.log(`   materials: ${MATERIALS_SEED.length}`);
  console.log(`   formulas:  ${FORMULAS_SEED.length}`);
  console.log(`   suppliers: ${SUPPLIERS_SEED.length}`);

  // Clean materials first so stale rows (e.g. old `fiber` category before the
  // yarn/mat/fabric split) don't linger as orphans. Formulas & suppliers use
  // upsert because they may have manual enrichments worth preserving.
  const deleted = await db.delete(materialsTable);
  console.log(`🧹 materials table cleared${deleted ? "" : ""}`);

  // Materials
  let i = 0;
  for (const m of MATERIALS_SEED) {
    await db
      .insert(materialsTable)
      .values({
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        category: m.category,
        subCategory: m.subCategory,
        brand: m.brand,
        model: m.model,
        properties: m.properties,
        applications: m.applications,
        description: m.description,
      })
      .onConflictDoUpdate({
        target: materialsTable.id,
        set: {
          name: m.name,
          nameEn: m.nameEn,
          category: m.category,
          subCategory: m.subCategory,
          brand: m.brand,
          model: m.model,
          properties: m.properties,
          applications: m.applications,
          description: m.description,
          updatedAt: new Date(),
        },
      });
    if (++i % 100 === 0) console.log(`  📦 materials ${i}/${MATERIALS_SEED.length}`);
  }
  console.log(`✅ materials: ${MATERIALS_SEED.length}`);

  // Formulas
  i = 0;
  for (const f of FORMULAS_SEED) {
    await db
      .insert(formulasTable)
      .values(f)
      .onConflictDoUpdate({
        target: formulasTable.id,
        set: { ...f, updatedAt: new Date() },
      });
    if (++i % 30 === 0) console.log(`  🧪 formulas ${i}/${FORMULAS_SEED.length}`);
  }
  console.log(`✅ formulas: ${FORMULAS_SEED.length}`);

  // Suppliers
  i = 0;
  for (const s of SUPPLIERS_SEED) {
    await db
      .insert(supplierListings)
      .values({
        id: s.id,
        name: s.name,
        location: s.location,
        province: s.province,
        category: s.category,
        products: s.products,
        processList: s.processes,
        established: s.established,
        verified: s.verified,
        description: s.description,
        certifications: s.certifications,
      })
      .onConflictDoUpdate({
        target: supplierListings.id,
        set: {
          name: s.name,
          location: s.location,
          province: s.province,
          category: s.category,
          products: s.products,
          processList: s.processes,
          established: s.established,
          verified: s.verified,
          description: s.description,
          certifications: s.certifications,
          updatedAt: new Date(),
        },
      });
    if (++i % 20 === 0) console.log(`  🏭 suppliers ${i}/${SUPPLIERS_SEED.length}`);
  }
  console.log(`✅ suppliers: ${SUPPLIERS_SEED.length}`);

  console.log(`\n🎉 Large seed done.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ seed-large failed:", err);
    process.exit(1);
  });
