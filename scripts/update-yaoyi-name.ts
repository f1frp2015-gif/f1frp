// Rename sup-yaoyi to use the F1 Composites brand name + ensure website canonical.
// Triggered by user request 2026-05-02: getfrp.com 海外侧应展示 F1 Composites Co.,Ltd. 品牌，
// 不显示曜一中文/拼音名（getfrp 是英文站），中文站 f1frp.com 仍可走 .name (中文工商登记名)。

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
    console.error("sup-yaoyi not found");
    process.exit(1);
  }
  console.log("BEFORE:", JSON.stringify({
    id: before[0].id,
    name: before[0].name,
    nameEn: before[0].nameEn,
    website: before[0].website,
    brandPriority: before[0].brandPriority,
  }, null, 2));

  await db
    .update(supplierListings)
    .set({
      nameEn: "F1 Composites Co., Ltd.",
      website: "https://www.f1composite.com",
      updatedAt: new Date(),
    })
    .where(eq(supplierListings.id, "sup-yaoyi"));

  const after = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, "sup-yaoyi"))
    .limit(1);

  console.log("AFTER:", JSON.stringify({
    id: after[0].id,
    name: after[0].name,
    nameEn: after[0].nameEn,
    website: after[0].website,
    brandPriority: after[0].brandPriority,
  }, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
