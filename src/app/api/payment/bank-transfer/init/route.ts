/**
 * POST /api/payment/bank-transfer/init
 *
 * 用户选择"对公转账/支付宝/微信"并填了基础信息后调用：
 *   - 服务端生成订单号
 *   - 写入 offline_payments(status=pending_transfer)
 *   - 返回订单号 + 当前可用的收款渠道信息（银行账号 / 支付宝二维码 URL / 微信二维码 URL）
 *
 * 用户根据返回信息线下转账/扫码后，再调 /api/payment/bank-transfer/confirm 提交凭证。
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offlinePayments } from "@/lib/db/schema";
import { generateOrderNo, getOfflineChannels } from "@/lib/payment/bank-info";

export const runtime = "nodejs";

interface InitBody {
  orderType?: "rfq" | "report" | "pro_membership" | "agency_deposit" | "other";
  relatedId?: string | null;
  paymentMethod?: "bank_transfer" | "alipay" | "wechat";
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string | null;
  payerCompany?: string | null;
  amountCents?: number;
  currency?: string;
}

const ORDER_TTL_HOURS = 72; // 订单 3 天内未支付自动 expired

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(req: Request) {
  let body: InitBody;
  try {
    body = (await req.json()) as InitBody;
  } catch {
    return bad("bad-json");
  }

  const {
    orderType,
    relatedId,
    paymentMethod,
    payerName,
    payerEmail,
    payerPhone,
    payerCompany,
    amountCents,
    currency = "CNY",
  } = body;

  if (!orderType) return bad("missing-order-type");
  if (!paymentMethod) return bad("missing-payment-method");
  if (!payerName || payerName.length < 1) return bad("missing-payer-name");
  if (!payerEmail || !payerEmail.includes("@")) return bad("missing-payer-email");
  if (!Number.isInteger(amountCents) || (amountCents ?? 0) < 100) return bad("bad-amount");

  const channels = getOfflineChannels();
  if (paymentMethod === "alipay" && !channels.alipay.available) return bad("alipay-not-available");
  if (paymentMethod === "wechat" && !channels.wechat.available) return bad("wechat-not-available");

  const orderNo = generateOrderNo(orderType);
  const expiresAt = new Date(Date.now() + ORDER_TTL_HOURS * 3600 * 1000);

  await db.insert(offlinePayments).values({
    orderNo,
    orderType,
    relatedId: relatedId ?? null,
    payerName,
    payerEmail,
    payerPhone: payerPhone ?? null,
    payerCompany: payerCompany ?? null,
    amountCents: amountCents!,
    currency,
    paymentMethod,
    status: "pending_transfer",
    expiresAt,
  });

  // 返回可用收款渠道信息（仅返回所选 method 对应的字段）
  const channelInfo: Record<string, unknown> = { method: paymentMethod };
  if (paymentMethod === "bank_transfer") {
    channelInfo.bank = channels.bankTransfer;
    channelInfo.note = `请在转账备注栏填写订单号：${orderNo}`;
  } else if (paymentMethod === "alipay") {
    channelInfo.qrUrl = channels.alipay.qrUrl;
    channelInfo.note = `扫码后在备注里填订单号：${orderNo}`;
  } else if (paymentMethod === "wechat") {
    channelInfo.qrUrl = channels.wechat.qrUrl;
    channelInfo.note = `扫码后在备注里填订单号：${orderNo}`;
  }

  return NextResponse.json({
    ok: true,
    orderNo,
    expiresAt: expiresAt.toISOString(),
    amountCents,
    currency,
    channel: channelInfo,
    contact: { email: channels.contactEmail, phone: channels.contactPhone },
  });
}
