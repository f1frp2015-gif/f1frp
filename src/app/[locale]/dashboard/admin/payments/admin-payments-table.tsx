"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export interface AdminPaymentRow {
  orderNo: string;
  orderType: string;
  relatedId: string | null;
  payerName: string;
  payerEmail: string;
  payerPhone: string | null;
  payerCompany: string | null;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  payerTransferAmountCents: number | null;
  payerTransferAt: string | null;
  payerTransferNote: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_transfer: { label: "未付款", variant: "outline" },
  awaiting_review: { label: "待审核", variant: "default" },
  confirmed: { label: "已通过", variant: "secondary" },
  rejected: { label: "已驳回", variant: "destructive" },
  refunded: { label: "已退款", variant: "secondary" },
  expired: { label: "已过期", variant: "outline" },
};

const TYPE_LABEL: Record<string, string> = {
  rfq: "付费询盘",
  report: "研报",
  pro_membership: "Pro 会员",
  agency_deposit: "代理保证金",
  other: "其它",
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "对公转账",
  alipay: "支付宝",
  wechat: "微信",
};

function fmtYuan(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `¥ ${(cents / 100).toFixed(2)}`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

export function AdminPaymentsTable({ rows }: { rows: AdminPaymentRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <PaymentCard key={r.orderNo} row={r} />
      ))}
    </div>
  );
}

function PaymentCard({ row }: { row: AdminPaymentRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const badge = STATUS_BADGE[row.status] ?? { label: row.status, variant: "outline" as const };
  const isActionable = row.status === "awaiting_review" || row.status === "pending_transfer";

  const amountMatch =
    row.payerTransferAmountCents != null && row.payerTransferAmountCents === row.amountCents;

  async function call(path: string, body: Record<string, unknown>) {
    setError(null);
    setResult(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean; reason?: string; granted?: boolean; grantNotes?: string[] };
    if (!data.ok) {
      setError(data.reason ?? "操作失败");
      return;
    }
    setResult(
      data.granted === false
        ? `订单状态已更新（业务侧未开通：${data.grantNotes?.join("; ") ?? "见日志"}）`
        : "操作成功",
    );
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-sm">{row.orderNo}</code>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <Badge variant="outline">{TYPE_LABEL[row.orderType] ?? row.orderType}</Badge>
          <Badge variant="outline">{METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod}</Badge>
          <span className="ml-auto text-[12px] text-muted-foreground">建单 {fmtTime(row.createdAt)}</span>
        </div>

        <div className="grid gap-3 text-[13px] sm:grid-cols-2">
          <div>
            <div className="text-[11px] text-muted-foreground">付款方</div>
            <div className="font-medium">{row.payerName}</div>
            <div className="text-muted-foreground">{row.payerEmail}{row.payerPhone ? ` · ${row.payerPhone}` : ""}</div>
            {row.payerCompany && <div className="text-muted-foreground">{row.payerCompany}</div>}
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">应付 / 实付</div>
            <div className="font-medium tabular-nums">
              {fmtYuan(row.amountCents)}
              {row.payerTransferAmountCents != null && (
                <span className={`ml-2 ${amountMatch ? "text-emerald-600" : "text-amber-600"}`}>
                  ↪ {fmtYuan(row.payerTransferAmountCents)} {amountMatch ? "✓" : "(金额不符)"}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              业务关联：<code className="font-mono">{row.relatedId ?? "—"}</code>
            </div>
            {row.payerTransferAt && <div className="text-[11px] text-muted-foreground">转账时间 {fmtTime(row.payerTransferAt)}</div>}
          </div>
        </div>

        {row.payerTransferNote && (
          <div className="rounded border border-border bg-muted/30 p-2 text-[12px]">
            <span className="text-muted-foreground">付款方备注：</span>{row.payerTransferNote}
          </div>
        )}

        {row.reviewNote && (
          <div className="rounded border border-border bg-muted/20 p-2 text-[12px]">
            <span className="text-muted-foreground">审核备注：</span>{row.reviewNote}
          </div>
        )}

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</div>
        )}
        {result && (
          <div className="rounded border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-[13px] text-emerald-700">{result}</div>
        )}

        {isActionable && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => call(`/api/admin/payments/${row.orderNo}/confirm`, {})}
            >
              {pending ? "处理中…" : "通过"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setShowReject((v) => !v)}
            >
              驳回
            </Button>
            {showReject && (
              <div className="flex w-full items-start gap-2">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="驳回原因（≥4 字符，会发邮件给付款方）"
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending || reason.trim().length < 4}
                  onClick={() => call(`/api/admin/payments/${row.orderNo}/reject`, { reason })}
                >
                  确认驳回
                </Button>
              </div>
            )}
          </div>
        )}

        {!isActionable && row.reviewedAt && (
          <div className="text-[11px] text-muted-foreground">审核于 {fmtTime(row.reviewedAt)}</div>
        )}
      </CardContent>
    </Card>
  );
}
