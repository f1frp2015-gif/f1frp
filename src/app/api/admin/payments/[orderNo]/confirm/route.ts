/**
 * POST /api/admin/payments/[orderNo]/confirm
 *
 * 管理员对账后调用：
 *   - offline_payments → status=confirmed, reviewer_id, reviewed_at
 *   - 按 order_type 自动开通：
 *     - report          → 写 report_purchases(status=paid)
 *     - pro_membership  → 升级 users.membership_tier=pro + membership_expiry
 *                        + 写 subscriptions
 *     - rfq             → 升级 rfq_billing.status=paid
 *     - agency_deposit / other → 仅记录，业务侧手动跟进
 *   - 发邮件通知 payer
 */

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  offlinePayments,
  reportPurchases,
  reports,
  rfqBilling,
  subscriptions,
  users,
} from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { sendOrderConfirmedEmail } from "@/lib/email/notify";
import { getPlan, type PlanId } from "@/lib/pricing";

export const runtime = "nodejs";

interface ConfirmBody {
  reviewNote?: string;
}

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

async function findUserByEmail(email: string) {
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return u ?? null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const { orderNo } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, reason: gate.reason }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as ConfirmBody;
  const reviewNote = body?.reviewNote ?? null;

  const [order] = await db
    .select()
    .from(offlinePayments)
    .where(eq(offlinePayments.orderNo, orderNo))
    .limit(1);
  if (!order) return bad("order-not-found", 404);

  if (order.status === "confirmed") {
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }
  if (order.status === "rejected" || order.status === "refunded") {
    return bad(`order-${order.status}`, 409);
  }

  const grantNotes: string[] = [];
  let granted = false;

  // ── 按 order_type 自动开通 ─────────────────────
  switch (order.orderType) {
    case "report": {
      if (!order.relatedId) {
        grantNotes.push("relatedId missing — cannot link to report");
        break;
      }
      const [report] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, order.relatedId))
        .limit(1);
      if (!report) {
        grantNotes.push(`report ${order.relatedId} not found`);
        break;
      }
      const u = await findUserByEmail(order.payerEmail);
      if (!u) {
        grantNotes.push(`no user with email ${order.payerEmail} — buyer must register first; access not granted`);
        break;
      }
      // Upsert: 如果已有 pending 行（旧 checkout 路径），update；否则 insert
      const [existing] = await db
        .select()
        .from(reportPurchases)
        .where(and(eq(reportPurchases.userId, u.id), eq(reportPurchases.reportId, report.id)))
        .limit(1);
      if (existing) {
        await db
          .update(reportPurchases)
          .set({
            status: "paid",
            paidAt: new Date(),
            paymentProvider: "offline_bank_transfer",
            providerOrderId: order.orderNo,
            priceCentsPaid: order.amountCents,
          })
          .where(eq(reportPurchases.id, existing.id));
      } else {
        await db.insert(reportPurchases).values({
          userId: u.id,
          reportId: report.id,
          priceCentsOriginal: report.priceCents,
          priceCentsPaid: order.amountCents,
          userTierAtPurchase: u.membershipTier,
          paymentProvider: "offline_bank_transfer",
          providerOrderId: order.orderNo,
          status: "paid",
          paidAt: new Date(),
        });
      }
      granted = true;
      grantNotes.push(`report_purchases granted to user ${u.id} for report ${report.slug}`);
      break;
    }
    case "pro_membership": {
      if (!order.relatedId) {
        grantNotes.push("relatedId missing — cannot determine plan");
        break;
      }
      const plan = getPlan(order.relatedId as PlanId);
      if (!plan) {
        grantNotes.push(`plan ${order.relatedId} unknown`);
        break;
      }
      const u = await findUserByEmail(order.payerEmail);
      if (!u) {
        grantNotes.push(`no user with email ${order.payerEmail} — buyer must register first; membership not granted`);
        break;
      }
      const monthsToAdd = plan.period === "year" ? 12 : 1;
      const baseExpiry =
        u.membershipExpiry && u.membershipExpiry > new Date()
          ? new Date(u.membershipExpiry)
          : new Date();
      const newExpiry = new Date(baseExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

      await db
        .update(users)
        .set({
          membershipTier: plan.tier,
          membershipExpiry: newExpiry,
          subscriptionStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, u.id));

      await db.insert(subscriptions).values({
        userId: u.id,
        plan: plan.id,
        tier: plan.tier,
        provider: "manual", // 对公转账走人工开通
        providerSubId: order.orderNo,
        amountCents: order.amountCents,
        currency: order.currency,
        status: "active",
        expiresAt: newExpiry,
        metadata: { source: "offline_bank_transfer", orderNo: order.orderNo },
      });
      granted = true;
      grantNotes.push(`pro membership granted to ${u.id}, expires ${newExpiry.toISOString()}`);
      break;
    }
    case "rfq": {
      if (!order.relatedId) {
        grantNotes.push("relatedId missing — cannot link to rfq_billing");
        break;
      }
      const [rb] = await db
        .select()
        .from(rfqBilling)
        .where(eq(rfqBilling.rfqId, order.relatedId))
        .limit(1);
      if (rb) {
        await db
          .update(rfqBilling)
          .set({
            status: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(rfqBilling.rfqId, order.relatedId));
        granted = true;
        grantNotes.push(`rfq_billing ${order.relatedId} marked paid`);
      } else {
        // No prior rfq_billing row — create one for record
        await db.insert(rfqBilling).values({
          rfqId: order.relatedId,
          payerEmail: order.payerEmail,
          payerType: "buyer",
          amountCents: order.amountCents,
          currency: order.currency,
          status: "paid",
          paidAt: new Date(),
        });
        granted = true;
        grantNotes.push(`rfq_billing ${order.relatedId} created and marked paid`);
      }
      break;
    }
    default:
      grantNotes.push(`order_type=${order.orderType} requires manual follow-up`);
  }

  // ── Update offline_payments status ─────────────
  await db
    .update(offlinePayments)
    .set({
      status: "confirmed",
      reviewerId: gate.user.id,
      reviewNote: reviewNote ?? grantNotes.join("; "),
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(offlinePayments.orderNo, orderNo));

  // ── Send notification email (best-effort) ──────
  try {
    const ctx: Parameters<typeof sendOrderConfirmedEmail>[1] = {
      orderType: order.orderType,
      orderNo: order.orderNo,
      payerName: order.payerName,
      amountCents: order.amountCents,
    };
    if (order.orderType === "report" && order.relatedId) {
      const [r] = await db
        .select({ slug: reports.slug, title: reports.title })
        .from(reports)
        .where(eq(reports.id, order.relatedId))
        .limit(1);
      if (r) {
        ctx.reportTitle = r.title;
        ctx.reportSlug = r.slug;
      }
    } else if (order.orderType === "pro_membership" && order.relatedId) {
      const plan = getPlan(order.relatedId as PlanId);
      if (plan) {
        ctx.planName = plan.nameZh;
        const u = await findUserByEmail(order.payerEmail);
        if (u?.membershipExpiry) ctx.expiresAt = u.membershipExpiry;
      }
    }
    await sendOrderConfirmedEmail(order.payerEmail, ctx);
  } catch (err) {
    console.error("[admin/confirm] email failed", err);
  }

  return NextResponse.json({
    ok: true,
    orderNo,
    granted,
    grantNotes,
  });
}
