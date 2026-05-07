import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { PaymentDialog } from "@/components/payment/payment-dialog";
import {
  REPORT_CATEGORY_LABELS,
  formatYuan,
  type ReportCategory,
} from "@/lib/pricing";
import {
  findPaidPurchase,
  findReportBySlugOrId,
  quoteForViewer,
  resolveReportViewer,
} from "@/lib/reports";

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id: raw } = await params;
  const r = await findReportBySlugOrId(safeDecode(raw));
  if (!r) return { title: "研报未找到 | f1frp" };
  return {
    title: `${r.title} | f1frp 研报库`,
    description: r.summary.slice(0, 140),
    alternates: { canonical: `https://f1frp.com/reports/${r.slug}` },
  };
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: raw } = await params;
  if (locale !== "zh") notFound();
  setRequestLocale(locale);

  const id = safeDecode(raw);
  const report = await findReportBySlugOrId(id);
  if (!report || !report.isPublished) notFound();

  const viewer = await resolveReportViewer();
  const quote = quoteForViewer(report, viewer);

  const paid = viewer.userId
    ? await findPaidPurchase(viewer.userId, report.id)
    : null;

  const categoryLabel = REPORT_CATEGORY_LABELS[report.category as ReportCategory].zh;
  const proPriceCents = Math.round(
    (report.priceCents * report.proDiscountBps) / 10000
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: report.title,
    description: report.summary,
    datePublished: report.publishedAt.toISOString(),
    inLanguage: "zh-CN",
    offers: {
      "@type": "Offer",
      price: (report.priceCents / 100).toFixed(2),
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
    },
    url: `https://f1frp.com/reports/${report.slug}`,
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "首页", url: "https://f1frp.com/" },
          { name: "研报库", url: "https://f1frp.com/reports" },
          { name: report.title, url: `https://f1frp.com/reports/${report.slug}` },
        ]}
      />

      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/reports" className="hover:text-primary hover:underline">
          研报库
        </Link>
        <span className="mx-1.5">/</span>
        <span className="truncate">{report.title}</span>
      </nav>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px]">
          {categoryLabel}
        </Badge>
        {report.pageCount && (
          <Badge variant="outline" className="text-[10px]">
            {report.pageCount} 页
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          {report.publishedAt.toISOString().slice(0, 10)}
        </Badge>
        {(report.tags ?? []).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>

      <h1 className="text-2xl font-bold leading-snug">{report.title}</h1>
      {report.subtitle && (
        <p className="mt-2 text-sm text-muted-foreground">{report.subtitle}</p>
      )}

      <Card className="mt-6">
        <CardContent className="p-5">
          {paid ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-600">
                  ✓ 已购买
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  购买于 {paid.paidAt?.toISOString().slice(0, 10) ?? "—"} ·{" "}
                  实付 {formatYuan(paid.priceCentsPaid)}
                </div>
              </div>
              <a
                href={`/api/reports/${report.slug}/download`}
                className={buttonVariants({ size: "lg" })}
              >
                下载 PDF
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {formatYuan(quote.priceCents)}
                  </span>
                  {quote.discountApplied && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatYuan(quote.originalCents)}
                      </span>
                      <Badge className="bg-emerald-600 text-[10px] text-white">
                        Pro 会员 7 折
                      </Badge>
                    </>
                  )}
                </div>
                {!quote.discountApplied && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Pro 会员 7 折价 {formatYuan(proPriceCents)} ·{" "}
                    <Link href="/pricing" className="text-primary hover:underline">
                      升级 Pro
                    </Link>
                  </div>
                )}
              </div>
              {viewer.signedIn ? (
                <PaymentDialog
                  orderType="report"
                  amountCents={quote.priceCents}
                  relatedId={report.id}
                  triggerLabel="立即购买"
                  triggerClassName={buttonVariants({ size: "lg" })}
                  dialogTitle={`购买研报 — ${report.title}`}
                  dialogDescription={`¥${(quote.priceCents / 100).toFixed(2)} · 银行对公转账，1 个工作日对账后开通访问权限`}
                />
              ) : (
                <Link
                  href={`/sign-in?redirect_url=/reports/${report.slug}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  登录后购买
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <section>
        <h2 className="text-base font-semibold">研报摘要</h2>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.9] text-foreground/90">
          {report.summary}
        </p>
      </section>

      {(report.tableOfContents ?? []).length > 0 && (
        <>
          <Separator className="my-8" />
          <section>
            <h2 className="text-base font-semibold">研报目录</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-[15px] leading-[1.9] text-foreground/90">
              {(report.tableOfContents as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </section>
        </>
      )}

      {report.previewPdfPath && !paid && (
        <>
          <Separator className="my-8" />
          <section className="rounded-lg border bg-muted/20 p-5">
            <h2 className="text-sm font-semibold">免费试读</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              查看研报前几页样章后再决定是否购买
            </p>
            <a
              href={`/api/reports/${report.slug}/preview`}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-3"}
            >
              下载试读 PDF
            </a>
          </section>
        </>
      )}

      <div className="mt-10 flex items-center justify-between border-t pt-6 text-sm">
        <Link
          href="/reports"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← 返回研报库
        </Link>
        <span className="text-xs text-muted-foreground">
          电子发票请购买后联系 f1frp2015@gmail.com
        </span>
      </div>
    </article>
  );
}
