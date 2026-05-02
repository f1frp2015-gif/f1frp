/**
 * GET /api/admin/payments/[orderNo]/proof-url
 *
 * 管理员对账时点"查看凭证"按钮调用：
 *   - 查 offline_payments.proofImagePath
 *   - 签 1 小时有效的 OSS GET URL 返回前端
 *   - 凭证文件不公开访问，每次查看都要重新签
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offlinePayments } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { signedGetUrl } from "@/lib/oss";

export const runtime = "nodejs";

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const gate = await gateAdmin();
  if (!gate.ok) return bad(gate.reason ?? "forbidden", gate.status);

  const { orderNo } = await params;
  if (!orderNo) return bad("missing-order-no");

  const [order] = await db
    .select({ proofImagePath: offlinePayments.proofImagePath })
    .from(offlinePayments)
    .where(eq(offlinePayments.orderNo, orderNo))
    .limit(1);

  if (!order) return bad("order-not-found", 404);
  if (!order.proofImagePath) return bad("no-proof", 404);

  let url: string;
  try {
    url = signedGetUrl(order.proofImagePath, 3600);
  } catch (err) {
    console.error("[proof-url] sign failed", err);
    return bad("oss-not-configured", 500);
  }

  return NextResponse.json({ ok: true, url });
}
