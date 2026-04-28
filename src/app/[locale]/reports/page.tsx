import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { reports as reportsTable } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  REPORT_CATEGORY_LABELS,
  formatYuan,
  quoteReportPrice,
  type ReportCategory,
} from "@/lib/pricing";
import { resolveReportViewer } from "@/lib/reports";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "复材行业研报库 | f1frp",
  description:
    "f1frp 自研行业研报：玻纤 / 碳纤 / 拉挤 / 缠绕 / 风电叶片 / 储氢瓶 / 桥梁修复 等行业、应用领域、单客户、全产业链深度研报。¥299/篇，会员 7 折。",
  alternates: { canonical: "https://f1frp.com/reports" },
};

const CATEGORY_ORDER: ReportCategory[] = [
  "industry",
  "application",
  "single_customer",
  "full_chain",
];

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // 研报库仅国内侧（f1frp.com / zh）。getfrp.com 海外侧（locales=en）一律 404。
  if (locale !== "zh") notFound();
  setRequestLocale(locale);

  const [rows, viewer] = await Promise.all([
    db
      .select({
        id: reportsTable.id,
        slug: reportsTable.slug,
        title: reportsTable.title,
        subtitle: reportsTable.subtitle,
        category: reportsTable.category,
        summary: reportsTable.summary,
        coverUrl: reportsTable.coverUrl,
        pageCount: reportsTable.pageCount,
        publishedAt: reportsTable.publishedAt,
        priceCents: reportsTable.priceCents,
        proDiscountBps: reportsTable.proDiscountBps,
        purchaseCount: reportsTable.purchaseCount,
        tags: reportsTable.tags,
      })
      .from(reportsTable)
      .where(eq(reportsTable.isPublished, true))
      .orderBy(desc(reportsTable.publishedAt)),
    resolveReportViewer(),
  ]);

  const isPro = viewer.tier === "pro" || viewer.tier === "enterprise";

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: REPORT_CATEGORY_LABELS[cat].zh,
    items: rows.filter((r) => r.category === cat),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">复材行业研报库</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          f1frp 自研深度研报 · 单篇 ¥299 ·{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            Pro 会员
          </Link>{" "}
          享 7 折（¥209.30/篇）
          {!viewer.signedIn && (
            <>
              {" · "}
              <Link href="/sign-in" className="text-primary hover:underline">
                登录
              </Link>{" "}
              查看会员价
            </>
          )}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-12 text-center text-sm text-muted-foreground">
          研报库正在筹备中，首批研报即将上线。
        </div>
      ) : (
        <div className="space-y-12">
          {grouped.map(
            (g) =>
              g.items.length > 0 && (
                <section key={g.cat}>
                  <h2 className="mb-4 flex items-baseline gap-2 text-lg font-semibold">
                    <span>{g.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {g.items.length} 篇
                    </span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((r) => {
                      const quote = quoteReportPrice(
                        r.priceCents,
                        r.proDiscountBps,
                        viewer.tier
                      );
                      return (
                        <Link
                          key={r.id}
                          href={`/reports/${encodeURIComponent(r.slug)}` as never}
                          className="group block"
                        >
                          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                            <CardContent className="flex h-full flex-col gap-3 p-5">
                              <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {g.label}
                                </Badge>
                                {r.pageCount && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {r.pageCount} 页
                                  </Badge>
                                )}
                              </div>
                              <h3 className="line-clamp-2 text-base font-medium leading-snug group-hover:text-primary">
                                {r.title}
                              </h3>
                              {r.subtitle && (
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  {r.subtitle}
                                </p>
                              )}
                              <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                                {r.summary}
                              </p>
                              <div className="mt-auto flex items-baseline justify-between border-t pt-3">
                                <div className="flex items-baseline gap-2">
                                  {quote.discountApplied ? (
                                    <>
                                      <span className="text-lg font-semibold text-emerald-600">
                                        {formatYuan(quote.priceCents)}
                                      </span>
                                      <span className="text-xs text-muted-foreground line-through">
                                        {formatYuan(quote.originalCents)}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-lg font-semibold">
                                        {formatYuan(quote.priceCents)}
                                      </span>
                                      {!isPro && viewer.signedIn && (
                                        <span className="text-[10px] text-muted-foreground">
                                          会员价 {formatYuan(
                                            Math.round(
                                              (r.priceCents * r.proDiscountBps) /
                                                10000
                                            )
                                          )}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                {(r.purchaseCount ?? 0) > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {r.purchaseCount} 人已购
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )
          )}
        </div>
      )}
    </div>
  );
}
