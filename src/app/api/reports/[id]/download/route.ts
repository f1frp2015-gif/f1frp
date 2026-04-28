import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reportPurchases } from "@/lib/db/schema";
import {
  findPaidPurchase,
  findReportBySlugOrId,
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

// 已购研报下载入口。
// 当前阶段 PDF 存储在阿里云 OSS 私有 bucket 的方案待实施，先返回 503 + 引导邮件。
// 接通后此处改为：拼装 OSS V4 签名（5min TTL）+ 嵌用户邮箱水印的 PDF，302 到签名 URL。
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
        `/sign-in?redirect_url=/api/reports/${encodeURIComponent(slugOrId)}/download`,
        url
      )
    );
  }

  const report = await findReportBySlugOrId(slugOrId);
  if (!report || !report.isPublished) {
    return NextResponse.json({ ok: false, reason: "report-not-found" }, { status: 404 });
  }

  const paid = await findPaidPurchase(viewer.userId, report.id);
  if (!paid) {
    return NextResponse.json(
      { ok: false, reason: "not-purchased", checkoutUrl: `/api/reports/${report.slug}/checkout` },
      { status: 403 }
    );
  }

  await db
    .update(reportPurchases)
    .set({
      downloadCount: sql`${reportPurchases.downloadCount} + 1`,
      lastDownloadedAt: new Date(),
    })
    .where(eq(reportPurchases.id, paid.id));

  // OSS 接入待办：当前 pdfPath 仅落库，未生成预签名 URL。
  return NextResponse.json(
    {
      ok: false,
      reason: "storage-not-configured",
      message: "PDF 存储与下发通道接入中，请联系 service@f1frp.com 由人工发送。",
      reportSlug: report.slug,
      orderId: paid.providerOrderId,
    },
    { status: 503 }
  );
}
