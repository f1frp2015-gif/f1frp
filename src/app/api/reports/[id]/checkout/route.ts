import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reportPurchases } from "@/lib/db/schema";
import {
  findPaidPurchase,
  findPendingOrder,
  findReportBySlugOrId,
  newOrderId,
  quoteForViewer,
  resolveReportViewer,
} from "@/lib/reports";

export const runtime = "nodejs";

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// 创建（或复用）一个 pending 订单。备案下来前不接通正式商户号，
// 用户被引到 /dashboard/reports?order=xxx 看付款状态 + 人工付款指引。
// 备案 + 商户号到位后此处改为：调微信支付 unifiedorder / 支付宝 alipay.trade.page.pay
// 拿到 code_url（微信扫码）或 form_url（支付宝），重定向用户到收银台。
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(req.url);
  const { id: raw } = await params;
  const slugOrId = safeDecode(raw);

  const viewer = await resolveReportViewer();
  if (!viewer.signedIn || !viewer.userId) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?redirect_url=/api/reports/${encodeURIComponent(slugOrId)}/checkout`,
        url
      )
    );
  }

  const report = await findReportBySlugOrId(slugOrId);
  if (!report || !report.isPublished) {
    return NextResponse.json({ ok: false, reason: "report-not-found" }, { status: 404 });
  }

  const paid = await findPaidPurchase(viewer.userId, report.id);
  if (paid) {
    return NextResponse.redirect(new URL(`/reports/${report.slug}`, url));
  }

  const existingPending = await findPendingOrder(viewer.userId, report.id);
  if (existingPending) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/reports?order=${existingPending.providerOrderId ?? existingPending.id}`,
        url
      )
    );
  }

  const quote = quoteForViewer(report, viewer);
  const orderId = newOrderId();

  const [created] = await db
    .insert(reportPurchases)
    .values({
      userId: viewer.userId,
      reportId: report.id,
      priceCentsOriginal: quote.originalCents,
      priceCentsPaid: quote.priceCents,
      discountApplied: quote.discountApplied ?? null,
      userTierAtPurchase: viewer.tier,
      providerOrderId: orderId,
      status: "pending",
    })
    .returning();

  // 备案 + 商户号到位后这里替换为调起支付并 302 到第三方收银台
  return NextResponse.redirect(
    new URL(
      `/dashboard/reports?order=${created?.providerOrderId ?? created?.id}`,
      url
    )
  );
}
