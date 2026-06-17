/**
 * 标签回填(rollup):把「已审核 / 可查验」的认证标签从关系表 supplier_document_tags
 * 合并进 supplierListings.certifications,让既有展示 UI 不改一行也能看到新数据。
 *
 * 设计取舍:
 *  - 真相源(SoT)是 supplier_document_tags(带 trust / 来源 / 有效期),分面筛选读它。
 *  - 这里**只**回填 cert facet 且 trust ≥ 2(可查验/已审核)的项,且**只合并不删除既有**
 *    (union),避免误删人工维护的条目。
 *  - ⚠️ **刻意不触碰** standards_supported / capabilities —— 这两列归 getfrp sourcing
 *    desk(feasibility_match / export_ready)所有,有独立取值口径;跨 feature 写同一列
 *    会互相覆盖。若将来要把 std/cat facet 也回填,需先与 sourcing 侧统一字段归属。
 *
 * 调用时机:后台审核 approve 成功后(见 /api/admin/qualifications/{id}/approve)。
 */
import { and, eq, gte } from "drizzle-orm";

import { db } from "@/lib/db";
import { supplierDocumentTags, supplierListings } from "@/lib/db/schema";

const TRUST_DISPLAY_MIN = 2; // 仅回填 T2+(可查验 / 已审核)

export async function rollupSupplierTags(
  supplierListingId: string,
): Promise<{ certifications: string[] }> {
  // 1) 取该供应商所有 T2+ 的认证标签
  const rows = await db
    .select({ tagId: supplierDocumentTags.tagId })
    .from(supplierDocumentTags)
    .where(
      and(
        eq(supplierDocumentTags.supplierListingId, supplierListingId),
        eq(supplierDocumentTags.facet, "cert"),
        gte(supplierDocumentTags.trust, TRUST_DISPLAY_MIN),
      ),
    );

  // 2) 与既有 certifications 做并集(只增不减)
  const [current] = await db
    .select({ certifications: supplierListings.certifications })
    .from(supplierListings)
    .where(eq(supplierListings.id, supplierListingId))
    .limit(1);

  const merged = Array.from(
    new Set([...(current?.certifications ?? []), ...rows.map((r) => r.tagId)]),
  );

  // 3) 写回(verified 是否一并置真,交由审核流程决定,这里不动)
  await db
    .update(supplierListings)
    .set({ certifications: merged, updatedAt: new Date() })
    .where(eq(supplierListings.id, supplierListingId));

  return { certifications: merged };
}
