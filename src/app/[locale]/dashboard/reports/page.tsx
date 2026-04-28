import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { reportPurchases, reports as reportsTable } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CONTACT } from "@/lib/contact";
import { formatYuan } from "@/lib/pricing";
import { resolveReportViewer } from "@/lib/reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的研报订单 | f1frp",
};

export default async function DashboardReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();
  setRequestLocale(locale);
  const { order: highlightOrder } = await searchParams;

  const viewer = await resolveReportViewer();
  if (!viewer.signedIn || !viewer.userId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">我的研报订单</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          请先{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            登录
          </Link>{" "}
          查看订单。
        </p>
      </div>
    );
  }

  const orders = await db
    .select()
    .from(reportPurchases)
    .where(eq(reportPurchases.userId, viewer.userId))
    .orderBy(desc(reportPurchases.createdAt));

  const reportIds = Array.from(new Set(orders.map((o) => o.reportId)));
  const reportRows = reportIds.length
    ? await db
        .select({
          id: reportsTable.id,
          slug: reportsTable.slug,
          title: reportsTable.title,
          category: reportsTable.category,
        })
        .from(reportsTable)
        .where(inArray(reportsTable.id, reportIds))
    : [];
  const reportMap = new Map(reportRows.map((r) => [r.id, r]));

  const paid = orders.filter((o) => o.status === "paid");
  const pending = orders.filter((o) => o.status === "pending");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">我的研报订单</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          管理你购买和下单的研报，下载已购研报或完成待支付订单。
        </p>
      </header>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-base font-semibold">待支付订单（{pending.length}）</h2>
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <CardContent className="space-y-4 p-5">
              <div className="rounded-md bg-amber-100/60 p-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                <strong>支付通道接入中。</strong>
                {" "}请通过微信添加 <strong>{CONTACT.wechat}</strong>{" "}
                ({CONTACT.name})，备注订单号完成转账，款到 1 个工作日内开通下载权限。
              </div>
              <div className="space-y-3">
                {pending.map((o) => {
                  const r = reportMap.get(o.reportId);
                  const highlighted =
                    highlightOrder && o.providerOrderId === highlightOrder;
                  return (
                    <div
                      key={o.id}
                      className={`rounded-md border p-3 ${
                        highlighted
                          ? "border-amber-400 ring-2 ring-amber-300/50"
                          : "border-amber-200/70 dark:border-amber-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={r ? (`/reports/${r.slug}` as never) : ("/reports" as never)}
                            className="line-clamp-1 text-sm font-medium hover:text-primary"
                          >
                            {r?.title ?? "未知研报"}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>订单号 {o.providerOrderId ?? o.id.slice(0, 8)}</span>
                            <span>·</span>
                            <span>{o.createdAt.toISOString().slice(0, 10)}</span>
                            {o.discountApplied === "pro_member" && (
                              <Badge variant="outline" className="text-[10px]">
                                Pro 7 折
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                            {formatYuan(o.priceCentsPaid)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            待支付
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {paid.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">已购研报（{paid.length}）</h2>
          <div className="space-y-3">
            {paid.map((o) => {
              const r = reportMap.get(o.reportId);
              return (
                <Card key={o.id}>
                  <CardContent className="flex items-start justify-between gap-3 p-5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={r ? (`/reports/${r.slug}` as never) : ("/reports" as never)}
                        className="line-clamp-1 text-base font-medium hover:text-primary"
                      >
                        {r?.title ?? "未知研报"}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>购买于 {o.paidAt?.toISOString().slice(0, 10) ?? "—"}</span>
                        <span>·</span>
                        <span>实付 {formatYuan(o.priceCentsPaid)}</span>
                        {o.discountApplied === "pro_member" && (
                          <Badge variant="outline" className="text-[10px]">
                            Pro 7 折
                          </Badge>
                        )}
                        {o.downloadCount > 0 && (
                          <>
                            <span>·</span>
                            <span>下载 {o.downloadCount} 次</span>
                          </>
                        )}
                      </div>
                    </div>
                    {r && (
                      <a
                        href={`/api/reports/${r.slug}/download`}
                        className={buttonVariants({ size: "sm" })}
                      >
                        下载 PDF
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              你还没有购买任何研报。
            </p>
            <Link
              href="/reports"
              className={buttonVariants({ size: "sm" }) + " mt-4"}
            >
              浏览研报库
            </Link>
          </CardContent>
        </Card>
      )}

      <Separator className="my-10" />
      <p className="text-xs text-muted-foreground">
        电子发票请在购买后联系 {CONTACT.email} 由人工开具。
      </p>
    </div>
  );
}
