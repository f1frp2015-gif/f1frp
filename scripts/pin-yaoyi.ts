/**
 * One-shot: insert (or update) the F1Composite / 重庆曜一新材料有限公司 supplier
 * row and pin it to the top of /suppliers. Idempotent — safe to re-run.
 *
 * Usage (locally, with .env.local providing DATABASE_URL):
 *   pnpm tsx --env-file=.env.local scripts/pin-yaoyi.ts
 *
 * Run AFTER the schema migration in drizzle/0001_add_supplier_pin_website.sql
 * has been applied (or `pnpm db:push`).
 */
import { db } from "../src/lib/db";
import { supplierListings } from "../src/lib/db/schema";

const YAOYI = {
  id: "s0-yaoyi",
  name: "重庆曜一新材料有限公司",
  location: "重庆江北区",
  province: "重庆",
  category: "manufacturer",
  products: ["FRP 拉挤型材", "FRP 制品", "技术服务出海"],
  processList: ["拉挤成型", "技术咨询"],
  established: 2015,
  verified: true,
  pinned: true,
  website: "https://f1composite.com",
  description:
    "F1Composite (复材站) 运营主体。专注 FRP 型材与海外技术服务，覆盖欧美客户的选型、合规与交付。",
  certifications: ["PHI", "DNV", "CE", "ISO 9001"],
} as const;

async function main() {
  await db
    .insert(supplierListings)
    .values({
      id: YAOYI.id,
      name: YAOYI.name,
      location: YAOYI.location,
      province: YAOYI.province,
      category: YAOYI.category,
      products: [...YAOYI.products],
      processList: [...YAOYI.processList],
      established: YAOYI.established,
      verified: YAOYI.verified,
      pinned: YAOYI.pinned,
      website: YAOYI.website,
      description: YAOYI.description,
      certifications: [...YAOYI.certifications],
    })
    .onConflictDoUpdate({
      target: supplierListings.id,
      set: {
        name: YAOYI.name,
        location: YAOYI.location,
        province: YAOYI.province,
        category: YAOYI.category,
        products: [...YAOYI.products],
        processList: [...YAOYI.processList],
        established: YAOYI.established,
        verified: YAOYI.verified,
        pinned: YAOYI.pinned,
        website: YAOYI.website,
        description: YAOYI.description,
        certifications: [...YAOYI.certifications],
        updatedAt: new Date(),
      },
    });

  console.log(`✅ pinned ${YAOYI.name} (${YAOYI.id}) → ${YAOYI.website}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
