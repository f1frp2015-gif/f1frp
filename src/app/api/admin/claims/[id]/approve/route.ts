import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  enterprises,
  supplierClaims,
  supplierListings,
  users,
} from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const body = await req.json().catch(() => ({}));
  const reviewNote: string | null = body?.reviewNote ?? null;

  const [claim] = await db
    .select()
    .from(supplierClaims)
    .where(eq(supplierClaims.id, id))
    .limit(1);
  if (!claim) {
    return NextResponse.json({ error: "认领记录不存在" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: `当前状态 ${claim.status}，无法重复审核` },
      { status: 409 }
    );
  }

  const [supplier] = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, claim.supplierListingId))
    .limit(1);
  if (!supplier) {
    return NextResponse.json({ error: "供应商不存在" }, { status: 404 });
  }

  // 1. Create or find enterprise record
  let enterpriseId = supplier.enterpriseId;
  if (!enterpriseId) {
    const [ent] = await db
      .insert(enterprises)
      .values({
        name: supplier.name,
        category: supplier.category ?? "manufacturer",
        province: supplier.province ?? null,
        city: supplier.location ?? null,
        contactName: claim.contactName,
        contactPhone: claim.contactPhone,
        contactEmail: claim.contactEmail,
        description: supplier.description ?? null,
        products: (supplier.products ?? []) as string[],
        processes: (supplier.processList ?? []) as string[],
        certifications: (supplier.certifications ?? []) as string[],
        established: supplier.established ?? null,
        businessLicense: claim.businessLicenseUrl ?? null,
        status: "verified",
      })
      .returning({ id: enterprises.id });
    enterpriseId = ent.id;

    await db
      .update(supplierListings)
      .set({ enterpriseId, updatedAt: new Date() })
      .where(eq(supplierListings.id, supplier.id));
  }

  // 2. Promote user to enterprise_admin
  await db
    .update(users)
    .set({
      enterpriseId,
      role: "enterprise_admin",
      updatedAt: new Date(),
    })
    .where(eq(users.id, claim.userId));

  // 3. Mark this claim approved
  await db
    .update(supplierClaims)
    .set({
      status: "approved",
      reviewerId: gate.user.id,
      reviewNote,
      reviewedAt: new Date(),
    })
    .where(eq(supplierClaims.id, claim.id));

  // 4. Auto-reject competing pending claims on same supplier
  await db
    .update(supplierClaims)
    .set({
      status: "rejected",
      reviewerId: gate.user.id,
      reviewNote: "该企业已由其他申请人认领",
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(supplierClaims.supplierListingId, supplier.id),
        eq(supplierClaims.status, "pending"),
        ne(supplierClaims.id, claim.id)
      )
    );

  return NextResponse.json({
    data: {
      claimId: claim.id,
      enterpriseId,
      status: "approved",
    },
  });
}
