/**
 * POST /api/payment/bank-transfer/confirm
 *
 * 用户已经线下完成转账/扫码后调用：
 *   - 提交转账详情（金额 / 时间 / 备注 / 付款方银行账户后 4 位等）
 *   - 状态从 pending_transfer → awaiting_review
 *   - 后台对账后人工切到 confirmed / rejected
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offlinePayments } from "@/lib/db/schema";

export const runtime = "nodejs";

interface ConfirmBody {
  orderNo?: string;
  payerTransferAmountCents?: number;
  payerTransferAt?: string; // ISO date
  payerTransferNote?: string;
}

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(req: Request) {
  let body: ConfirmBody;
  try {
    body = (await req.json()) as ConfirmBody;
  } catch {
    return bad("bad-json");
  }

  const { orderNo, payerTransferAmountCents, payerTransferAt, payerTransferNote } = body;
  if (!orderNo) return bad("missing-order-no");
  if (!Number.isInteger(payerTransferAmountCents) || (payerTransferAmountCents ?? 0) < 100) {
    return bad("bad-transfer-amount");
  }
  if (!payerTransferNote || payerTransferNote.length < 4) {
    return bad("missing-transfer-note");
  }

  const [existing] = await db
    .select()
    .from(offlinePayments)
    .where(eq(offlinePayments.orderNo, orderNo))
    .limit(1);

  if (!existing) return bad("order-not-found", 404);
  if (existing.status === "confirmed") {
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }
  if (existing.status === "rejected" || existing.status === "refunded") {
    return bad(`order-${existing.status}`, 409);
  }
  if (existing.expiresAt && new Date() > new Date(existing.expiresAt)) {
    await db
      .update(offlinePayments)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(offlinePayments.orderNo, orderNo));
    return bad("order-expired", 410);
  }

  let transferAt: Date | null = null;
  if (payerTransferAt) {
    const d = new Date(payerTransferAt);
    if (!Number.isNaN(d.getTime())) transferAt = d;
  }

  await db
    .update(offlinePayments)
    .set({
      payerTransferAmountCents: payerTransferAmountCents!,
      payerTransferAt: transferAt,
      payerTransferNote,
      status: "awaiting_review",
      updatedAt: new Date(),
    })
    .where(eq(offlinePayments.orderNo, orderNo));

  return NextResponse.json({
    ok: true,
    orderNo,
    status: "awaiting_review",
    message: "我们将在 1 个工作日内对账并通过邮件通知。",
  });
}
