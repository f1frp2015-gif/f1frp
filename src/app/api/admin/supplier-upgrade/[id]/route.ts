import { NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  enterprises,
  supplierUpgradeRequests,
  subscriptions,
} from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type Body = {
  action: "approve" | "reject" | "paid";
  targetTier: "basic" | "pro";
  targetCategory?: string;
  reviewNote?: string;
};

const TIER_PRICE_CENTS: Record<"basic" | "pro", number> = {
  basic: 380000, // Verified
  pro: 1880000, // Featured
};
const ONE_YEAR_MS = 365 * 86400 * 1000;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await gateAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, reason: gate.reason }, { status: gate.status });
  const admin = gate.user;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action) return NextResponse.json({ ok: false, reason: "missing-action" }, { status: 400 });

  const [reqRow] = await db
    .select()
    .from(supplierUpgradeRequests)
    .where(eq(supplierUpgradeRequests.id, id))
    .limit(1);
  if (!reqRow) return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });

  if (body.action === "reject") {
    await db
      .update(supplierUpgradeRequests)
      .set({
        status: "rejected",
        reviewerId: admin.id,
        reviewNote: body.reviewNote,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supplierUpgradeRequests.id, id));
    return NextResponse.json({ ok: true });
  }

  // approve / paid both promote the enterprise tier; "paid" additionally
  // records that money has changed hands and locks the supplier in.
  if (!reqRow.enterpriseId) {
    return NextResponse.json(
      { ok: false, reason: "请先在企业资料里关联 listing 与企业" },
      { status: 409 }
    );
  }

  // Featured 名额校验：每品类最多 10 家
  if (body.targetTier === "pro" && body.targetCategory) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(enterprises)
      .where(
        and(
          eq(enterprises.featuredCategory, body.targetCategory),
          eq(enterprises.membershipTier, "pro")
        )
      );
    if (value >= 10) {
      return NextResponse.json(
        { ok: false, reason: `品类 ${body.targetCategory} 已满（10 家），不能再加 Featured` },
        { status: 409 }
      );
    }
  }

  const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
  const fullPriceCents = TIER_PRICE_CENTS[body.targetTier];
  const discount = reqRow.discountApplied ?? 0;
  const finalPriceCents = Math.round(fullPriceCents * (1 - discount / 100));

  await db
    .update(enterprises)
    .set({
      membershipTier: body.targetTier,
      membershipExpiry: expiresAt,
      featuredCategory: body.targetTier === "pro" ? body.targetCategory : null,
      updatedAt: new Date(),
    })
    .where(eq(enterprises.id, reqRow.enterpriseId));

  await db.insert(subscriptions).values({
    enterpriseId: reqRow.enterpriseId,
    plan: body.targetTier === "basic" ? "supplier_verified" : "supplier_featured",
    tier: body.targetTier,
    provider: "manual",
    amountCents: finalPriceCents,
    currency: "CNY",
    status: body.action === "paid" ? "active" : "trialing",
    expiresAt,
    metadata: {
      requestId: id,
      discountApplied: discount,
      featuredCategory: body.targetCategory ?? null,
    },
  });

  await db
    .update(supplierUpgradeRequests)
    .set({
      status: body.action,
      reviewerId: admin.id,
      reviewNote: body.reviewNote,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(supplierUpgradeRequests.id, id));

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString(), finalPriceCents });
}
