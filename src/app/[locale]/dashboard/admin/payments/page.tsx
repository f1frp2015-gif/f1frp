import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { offlinePayments, type OfflinePayment } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { AdminPaymentsTable, type AdminPaymentRow } from "./admin-payments-table";

export const metadata: Metadata = { title: "对账中心 — Admin" };
export const dynamic = "force-dynamic";

type StatusFilter = OfflinePayment["status"] | "all";
const ALLOWED: ReadonlyArray<StatusFilter> = [
  "all",
  "pending_transfer",
  "awaiting_review",
  "confirmed",
  "rejected",
  "refunded",
  "expired",
];

export default async function AdminPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const gate = await gateAdmin();
  if (!gate.ok) {
    if (gate.status === 401) redirect("/sign-in?redirect_url=/dashboard/admin/payments");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">无管理员权限</div>
          <p className="mt-2 text-sm text-muted-foreground">{gate.reason}</p>
        </CardContent>
      </Card>
    );
  }

  const sp = await searchParams;
  const requested = (sp.status ?? "awaiting_review") as StatusFilter;
  const statusFilter: StatusFilter = ALLOWED.includes(requested) ? requested : "awaiting_review";

  const base = db.select().from(offlinePayments).orderBy(desc(offlinePayments.createdAt));
  const rowsRaw = await (statusFilter === "all"
    ? base
    : base.where(eq(offlinePayments.status, statusFilter)));

  const rows: AdminPaymentRow[] = rowsRaw.map((p) => ({
    orderNo: p.orderNo,
    orderType: p.orderType,
    relatedId: p.relatedId,
    payerName: p.payerName,
    payerEmail: p.payerEmail,
    payerPhone: p.payerPhone,
    payerCompany: p.payerCompany,
    amountCents: p.amountCents,
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    payerTransferAmountCents: p.payerTransferAmountCents,
    payerTransferAt: p.payerTransferAt?.toISOString() ?? null,
    payerTransferNote: p.payerTransferNote,
    status: p.status,
    reviewNote: p.reviewNote,
    reviewedAt: p.reviewedAt?.toISOString() ?? null,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  const all = await db.select({ status: offlinePayments.status }).from(offlinePayments);
  const counts = {
    awaiting_review: all.filter((r) => r.status === "awaiting_review").length,
    pending_transfer: all.filter((r) => r.status === "pending_transfer").length,
    confirmed: all.filter((r) => r.status === "confirmed").length,
    rejected: all.filter((r) => r.status === "rejected").length,
    expired: all.filter((r) => r.status === "expired").length,
    refunded: all.filter((r) => r.status === "refunded").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支付对账中心</h1>
        <p className="text-sm text-muted-foreground">
          国内对公转账 / 支付宝 / 微信线下支付订单审核 — 确认后自动开通业务侧权益（研报 / 会员 / RFQ）。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusTab current={statusFilter} value="awaiting_review" label={`待审核 ${counts.awaiting_review}`} />
        <StatusTab current={statusFilter} value="pending_transfer" label={`未付款 ${counts.pending_transfer}`} />
        <StatusTab current={statusFilter} value="confirmed" label={`已通过 ${counts.confirmed}`} />
        <StatusTab current={statusFilter} value="rejected" label={`已驳回 ${counts.rejected}`} />
        <StatusTab current={statusFilter} value="expired" label={`已过期 ${counts.expired}`} />
        <StatusTab current={statusFilter} value="refunded" label={`已退款 ${counts.refunded}`} />
        <StatusTab current={statusFilter} value="all" label="全部" />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">没有匹配的订单</CardContent>
        </Card>
      ) : (
        <AdminPaymentsTable rows={rows} />
      )}
    </div>
  );
}

function StatusTab({ current, value, label }: { current: string; value: string; label: string }) {
  const active = current === value;
  return (
    <a
      href={`/dashboard/admin/payments?status=${value}`}
      className={`rounded-md border px-3 py-1.5 transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
      }`}
    >
      {label}
    </a>
  );
}
