"use client";

// 通用国内对公转账两步支付组件 — RFQ / 研报 / Pro 会员 / 代理保证金 都能用
//   step 1 init → 后端建单 + 返回收款方式信息
//   step 2 confirm → 用户填转账详情 → status=awaiting_review，等人工对账
//
// 复用同一个 offline_payments 表，order_type 区分业务类型。

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type OrderType = "rfq" | "report" | "pro_membership" | "agency_deposit" | "other";
type Method = "bank_transfer" | "alipay" | "wechat";

interface Props {
  orderType: OrderType;
  amountCents: number;
  /** 业务侧关联 id：reportId / rfqId / clerkId 等 — 仅作记录 */
  relatedId?: string | null;
  /** 触发器按钮文字，例如 "立即购买"、"试用付费询盘"、"开通 Pro" */
  triggerLabel: string;
  /** 触发器按钮 className（默认 default variant + w-full） */
  triggerClassName?: string;
  /** Dialog 标题 */
  dialogTitle?: string;
  /** Dialog 描述（可选）  */
  dialogDescription?: string;
  /** 默认 CNY；其它币种走 Stripe 路径，不应使用此组件 */
  currency?: string;
}

interface InitResponse {
  ok: boolean;
  orderNo?: string;
  amountCents?: number;
  currency?: string;
  expiresAt?: string;
  channel?: {
    method: Method;
    bank?: { payeeName: string; bankName: string; account: string; branch?: string; swift?: string };
    qrUrl?: string;
    note?: string;
  };
  contact?: { email: string; phone: string };
  reason?: string;
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  rfq: "付费询盘",
  report: "研报购买",
  pro_membership: "Pro 会员开通",
  agency_deposit: "代理保证金",
  other: "其他订单",
};

export function PaymentDialog({
  orderType,
  amountCents,
  relatedId,
  triggerLabel,
  triggerClassName,
  dialogTitle,
  dialogDescription,
  currency = "CNY",
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "transfer" | "confirmed">("form");
  const [method, setMethod] = useState<Method>("bank_transfer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<InitResponse | null>(null);

  const [transferAmount, setTransferAmount] = useState("");
  const [transferAt, setTransferAt] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  function reset() {
    setStep("form");
    setMethod("bank_transfer");
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setOrder(null);
    setTransferAmount("");
    setTransferAt("");
    setTransferNote("");
    setProofFile(null);
    setError(null);
  }

  async function uploadProof(orderNo: string, payerEmail: string, file: File): Promise<string> {
    const sigRes = await fetch("/api/payment/bank-transfer/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNo,
        payerEmail,
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });
    const sig = (await sigRes.json()) as { ok?: boolean; url?: string; key?: string; reason?: string };
    if (!sig.ok || !sig.url || !sig.key) {
      throw new Error(sig.reason ?? "upload-url-failed");
    }
    const putRes = await fetch(sig.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) throw new Error(`oss-put-${putRes.status}`);
    return sig.key;
  }

  async function init(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("请填联系人姓名");
    if (!email.includes("@")) return setError("请填有效邮箱");
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/bank-transfer/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          relatedId: relatedId ?? null,
          paymentMethod: method,
          payerName: name,
          payerEmail: email,
          payerPhone: phone || null,
          payerCompany: company || null,
          amountCents,
          currency,
        }),
      });
      const data = (await res.json()) as InitResponse;
      if (!data.ok) {
        const reasonMap: Record<string, string> = {
          "alipay-not-available": "支付宝渠道暂未开通",
          "wechat-not-available": "微信支付渠道暂未开通",
        };
        setError(reasonMap[data.reason ?? ""] ?? data.reason ?? "建单失败");
        return;
      }
      setOrder(data);
      setStep("transfer");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!order?.orderNo) return;
    setError(null);
    const amt = Number(transferAmount);
    if (!Number.isFinite(amt) || amt <= 0) return setError("请填转账金额（元）");
    if (transferNote.trim().length < 4) return setError("请填转账备注或付款方账号后 4 位（≥4 字符）");
    if (!proofFile) return setError("请上传转账凭证截图（jpg/png/pdf，≤10MB）");
    setSubmitting(true);
    try {
      let proofImagePath: string | null = null;
      let proofImageContentType: string | null = null;
      try {
        proofImagePath = await uploadProof(order.orderNo, email, proofFile);
        proofImageContentType = proofFile.type;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "upload-failed";
        setError(`凭证上传失败：${msg}`);
        return;
      }

      const res = await fetch("/api/payment/bank-transfer/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo: order.orderNo,
          payerTransferAmountCents: Math.round(amt * 100),
          payerTransferAt: transferAt ? new Date(transferAt).toISOString() : null,
          payerTransferNote: transferNote,
          proofImagePath,
          proofImageContentType,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (!data.ok) {
        setError(data.reason ?? "提交失败");
        return;
      }
      setStep("confirmed");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  const yuan = (amountCents / 100).toFixed(2);
  const ctxLabel = ORDER_TYPE_LABEL[orderType];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger className={triggerClassName ?? buttonVariants({ variant: "default" }) + " w-full"}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>{dialogTitle ?? `${ctxLabel} — 国内通道`}</DialogTitle>
              <DialogDescription>
                {dialogDescription ?? `¥${yuan} · 银行对公转账即时可用，支付宝/微信开通中。我们 1 个工作日内对账。`}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={init} className="space-y-3">
              <fieldset className="grid grid-cols-3 gap-2 text-[12px]">
                {(["bank_transfer", "alipay", "wechat"] as Method[]).map((m) => (
                  <label
                    key={m}
                    className={`cursor-pointer rounded border px-3 py-2 text-center transition-colors ${
                      method === m ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="hidden" />
                    {m === "bank_transfer" ? "对公银行转账" : m === "alipay" ? "支付宝（开通中）" : "微信（开通中）"}
                  </label>
                ))}
              </fieldset>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">联系人 *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="张三" required />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">邮箱 *</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">手机</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138xxxx" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">公司</label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="可选" />
                </div>
              </div>

              {error && (
                <p className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>
              )}

              <DialogFooter>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "建单中…" : "下一步：获取收款信息"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "transfer" && order && (
          <>
            <DialogHeader>
              <DialogTitle>第二步：转账并填写凭证</DialogTitle>
              <DialogDescription>订单号：<code className="font-mono text-foreground">{order.orderNo}</code> · 72 小时内有效</DialogDescription>
            </DialogHeader>

            <div className="rounded border border-border bg-muted/30 p-4 text-[13px] space-y-1.5">
              {order.channel?.method === "bank_transfer" && order.channel.bank && (
                <>
                  <div><span className="text-muted-foreground">收款方：</span><span className="font-medium">{order.channel.bank.payeeName}</span></div>
                  <div><span className="text-muted-foreground">开户行：</span>{order.channel.bank.bankName}</div>
                  <div><span className="text-muted-foreground">账号：</span><code className="font-mono">{order.channel.bank.account}</code></div>
                  {order.channel.bank.branch && <div><span className="text-muted-foreground">支行：</span>{order.channel.bank.branch}</div>}
                </>
              )}
              {order.channel?.qrUrl && (
                <div>
                  <div className="text-muted-foreground mb-2">扫码支付</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.channel.qrUrl} alt="payment QR" className="h-48 w-48 border bg-white p-2" />
                </div>
              )}
              <div className="mt-2 rounded bg-foreground/5 px-2 py-1 text-[12px] text-foreground">
                💡 {order.channel?.note}
              </div>
              <div className="text-[12px]"><span className="text-muted-foreground">应付：</span><span className="font-medium tabular-nums">¥ {yuan}</span></div>
              {order.contact && (
                <div className="pt-1 text-[11px] text-muted-foreground">对账问题联系：{order.contact.email} · {order.contact.phone}</div>
              )}
            </div>

            <form onSubmit={confirm} className="space-y-3 mt-4 border-t pt-4">
              <p className="text-[12px] text-muted-foreground">完成转账后填写以下信息提交凭证：</p>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">实际转账金额（元）*</label>
                <Input type="number" step="0.01" min="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder={yuan} required />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">转账时间</label>
                <Input type="datetime-local" value={transferAt} onChange={(e) => setTransferAt(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">备注（订单号、付款方账号后 4 位）*</label>
                <Textarea value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder={`如：订单 ${order.orderNo} · 卡号尾号 6789 · 付款方 张三 / 某公司`} required rows={2} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">转账凭证截图 *（jpg/png/webp/pdf，≤10MB）</label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  required
                />
                {proofFile && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    已选：{proofFile.name} · {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>
              )}

              <DialogFooter>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "提交中…" : "提交转账凭证"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "confirmed" && (
          <>
            <DialogHeader>
              <DialogTitle>已收到凭证 ✅</DialogTitle>
              <DialogDescription>订单 {order?.orderNo} 进入对账队列</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-[13px]">
              <p>我们将在 <strong>1 个工作日</strong>内核对到账信息，对账完成后通过邮件通知。</p>
              <p className="text-muted-foreground">如有紧急问题请联系：f1frp2015@gmail.com</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="w-full">关闭</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
