// POST /api/admin/qualifications/[id]/approve
// 审核通过一份资质文档:文档置 approved,其全部标签实例信任分抬到 T3(已审核),
// 并触发 rollup —— 把 T2+ 认证标签合并进 supplierListings.certifications。

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { supplierDocumentTags, supplierDocuments } from "@/lib/db/schema";
import { rollupSupplierTags } from "@/lib/qualification/rollup";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const body = await req.json().catch(() => ({}));
  const reviewNote: string | null = body?.reviewNote ?? null;

  const [doc] = await db
    .select()
    .from(supplierDocuments)
    .where(eq(supplierDocuments.id, id))
    .limit(1);
  if (!doc) {
    return NextResponse.json({ error: "资质文档不存在" }, { status: 404 });
  }
  if (doc.status !== "needs_review" && doc.status !== "extracted") {
    return NextResponse.json(
      { error: `当前状态 ${doc.status}，无法审核` },
      { status: 409 },
    );
  }

  await db
    .update(supplierDocuments)
    .set({
      status: "approved",
      reviewerId: gate.user.id,
      reviewNote,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(supplierDocuments.id, doc.id));

  // 人工背书 → 该文档所有标签实例升到 T3
  await db
    .update(supplierDocumentTags)
    .set({ trust: 3, source: "human" })
    .where(eq(supplierDocumentTags.documentId, doc.id));

  // 回填到展示数组(只在已关联供应商时)
  let rolledUp: string[] = [];
  if (doc.supplierListingId) {
    const r = await rollupSupplierTags(doc.supplierListingId);
    rolledUp = r.certifications;
  }

  return NextResponse.json({
    data: { documentId: doc.id, status: "approved", certifications: rolledUp },
  });
}
