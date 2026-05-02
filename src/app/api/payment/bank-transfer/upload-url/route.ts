/**
 * POST /api/payment/bank-transfer/upload-url
 *
 * 用户在转账后准备上传凭证截图前调用：
 *   - 校验 orderNo + payerEmail 与 offline_payments 行匹配
 *   - 校验文件类型 / 大小
 *   - 返回 OSS 直传的签名 PUT URL + 即将存入的 key
 *
 * 客户端拿到 URL 后直接 PUT 到 OSS，无需经过我们的服务器（ECS 3Mbps 带宽撑不住代理）。
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offlinePayments } from "@/lib/db/schema";
import { signedPutUrl, PAYMENT_PROOF_PREFIX } from "@/lib/oss";

export const runtime = "nodejs";

interface Body {
  orderNo?: string;
  payerEmail?: string;
  filename?: string;
  contentType?: string;
  fileSize?: number;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("bad-json");
  }

  const { orderNo, payerEmail, filename, contentType, fileSize } = body;
  if (!orderNo) return bad("missing-order-no");
  if (!payerEmail) return bad("missing-payer-email");
  if (!filename) return bad("missing-filename");
  if (!contentType || !ALLOWED_TYPES.has(contentType)) return bad("bad-content-type");
  if (!Number.isFinite(fileSize) || (fileSize ?? 0) <= 0 || (fileSize ?? 0) > MAX_BYTES) {
    return bad("bad-file-size");
  }

  const [order] = await db
    .select()
    .from(offlinePayments)
    .where(eq(offlinePayments.orderNo, orderNo))
    .limit(1);

  if (!order) return bad("order-not-found", 404);
  if (order.payerEmail !== payerEmail) return bad("payer-email-mismatch", 403);
  if (order.status === "confirmed" || order.status === "rejected" || order.status === "refunded") {
    return bad(`order-${order.status}`, 409);
  }
  if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
    return bad("order-expired", 410);
  }

  const ts = Date.now();
  const key = `${PAYMENT_PROOF_PREFIX}/${orderNo}/${ts}-${safeFilename(filename)}`;

  let url: string;
  try {
    url = signedPutUrl(key, contentType, 600);
  } catch (err) {
    console.error("[upload-url] signing failed", err);
    return bad("oss-not-configured", 500);
  }

  return NextResponse.json({ ok: true, url, key });
}
