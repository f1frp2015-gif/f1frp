/**
 * POST /api/admin/payments/[orderNo]/reject
 *
 * 管理员驳回订单（金额不符 / 转账人非本人 / 订单超时等）
 *   - offline_payments → status=rejected
 *   - 发邮件给 payer 说明原因 + 提供补救途径
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offlinePayments } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { sendOrderRejectedEmail } from "@/lib/email/notify";

export const runtime = "nodejs";

interface RejectBody {
  reason?: string;
}

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const { orderNo } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, reason: gate.reason }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as RejectBody;
  const reason = (body?.reason ?? "").trim();
  if (reason.length < 4) return bad("reason-too-short");

  const [order] = await db
    .select()
    .from(offlinePayments)
    .where(eq(offlinePayments.orderNo, orderNo))
    .limit(1);
  if (!order) return bad("order-not-found", 404);
  if (order.status === "confirmed") return bad("order-already-confirmed", 409);
  if (order.status === "rejected") return NextResponse.json({ ok: true, alreadyRejected: true });

  await db
    .update(offlinePayments)
    .set({
      status: "rejected",
      reviewerId: gate.user.id,
      reviewNote: reason,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(offlinePayments.orderNo, orderNo));

  try {
    await sendOrderRejectedEmail(order.payerEmail, {
      orderNo: order.orderNo,
      payerName: order.payerName,
      amountCents: order.amountCents,
      reason,
    });
  } catch (err) {
    console.error("[admin/reject] email failed", err);
  }

  return NextResponse.json({ ok: true, orderNo });
}
