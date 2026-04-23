import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  enterprises,
  supplierListings,
  supplierUpgradeRequests,
  supplierClaims,
} from "@/lib/db/schema";

export const runtime = "nodejs";

type Body = {
  supplierListingId: string;
  targetTier: "basic" | "pro"; // basic=Verified, pro=Featured
  targetCategory?: string; // Featured 时品类
  contactName: string;
  contactPhone: string;
  contactWechat?: string;
  note?: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (
    !body?.supplierListingId ||
    !body?.targetTier ||
    !body?.contactName ||
    !body?.contactPhone
  ) {
    return NextResponse.json({ ok: false, reason: "missing-fields" }, { status: 400 });
  }
  if (body.targetTier === "pro" && !body.targetCategory) {
    return NextResponse.json({ ok: false, reason: "featured-needs-category" }, { status: 400 });
  }

  const [u] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!u) return NextResponse.json({ ok: false, reason: "user-not-synced" }, { status: 401 });

  // Confirm the user has an approved claim on this supplier listing.
  const [claim] = await db
    .select()
    .from(supplierClaims)
    .where(
      and(
        eq(supplierClaims.userId, u.id),
        eq(supplierClaims.supplierListingId, body.supplierListingId),
        eq(supplierClaims.status, "approved")
      )
    )
    .limit(1);
  if (!claim) {
    return NextResponse.json(
      { ok: false, reason: "需要先认领并通过审核才能升级" },
      { status: 403 }
    );
  }

  // Resolve listing → enterpriseId (admin must have linked them).
  const [listing] = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, body.supplierListingId))
    .limit(1);
  if (!listing?.enterpriseId) {
    return NextResponse.json(
      { ok: false, reason: "该供应商尚未关联企业资料，请联系客服补全后再升级" },
      { status: 409 }
    );
  }

  // First-100 Verified customers get 50% off.
  let discount: number | null = null;
  if (body.targetTier === "basic") {
    const verifiedCount = await db
      .select({ id: enterprises.id })
      .from(enterprises)
      .where(eq(enterprises.membershipTier, "basic"));
    if (verifiedCount.length < 100) discount = 50;
  }

  const [created] = await db
    .insert(supplierUpgradeRequests)
    .values({
      userId: u.id,
      enterpriseId: listing.enterpriseId,
      targetTier: body.targetTier,
      targetCategory: body.targetCategory,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactWechat: body.contactWechat,
      note: body.note,
      discountApplied: discount,
    })
    .returning({ id: supplierUpgradeRequests.id });

  return NextResponse.json({
    ok: true,
    requestId: created.id,
    discountApplied: discount,
    nextStep:
      "客服将在 1 个工作日内联系你确认付款方式。Verified 前 100 家享 50% 首年折扣。",
  });
}
