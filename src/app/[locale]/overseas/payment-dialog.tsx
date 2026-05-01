"use client";

// 国内 (zh) 走银行转账/支付宝/微信两步流程：
//   step 1 init → 后端建单 + 返回收款方式信息
//   step 2 confirm → 用户填转账详情 → 等人工对账
// 海外 (en) 走 Stripe Checkout 单步流程

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

type Locale = "zh" | "en";
type Method = "bank_transfer" | "alipay" | "wechat";

interface Props {
  locale: Locale;
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

const RFQ_AMOUNT_CNY_CENTS = 30000;   // ¥300
const RFQ_AMOUNT_USD_CENTS = 3000;    // $30

export function PaymentDialog({ locale }: Props) {
  const isEn = locale === "en";
  if (isEn) return <StripeButton />;
  return <DomesticButton />;
}

// ─────────────────────────────────────────────────────────────────────
// 国内：银行转账两步流程
// ─────────────────────────────────────────────────────────────────────

function DomesticButton() {
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

  // confirm 步骤的表单
  const [transferAmount, setTransferAmount] = useState(""); // 元
  const [transferAt, setTransferAt] = useState("");
  const [transferNote, setTransferNote] = useState("");

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
    setError(null);
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
          orderType: "rfq",
          paymentMethod: method,
          payerName: name,
          payerEmail: email,
          payerPhone: phone || null,
          payerCompany: company || null,
          amountCents: RFQ_AMOUNT_CNY_CENTS,
          currency: "CNY",
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/bank-transfer/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo: order.orderNo,
          payerTransferAmountCents: Math.round(amt * 100),
          payerTransferAt: transferAt ? new Date(transferAt).toISOString() : null,
          payerTransferNote: transferNote,
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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger className={buttonVariants({ variant: "default" }) + " mt-6 w-full"}>
        试用付费询盘流程（¥300 demo）
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>付费询盘流程 — 国内通道</DialogTitle>
              <DialogDescription>
                ¥300 demo 单 · 银行对公转账即时可用，支付宝/微信开通中。
                我们 1 个工作日内对账。
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
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="hidden"
                    />
                    {m === "bank_transfer" ? "对公银行转账"
                      : m === "alipay" ? "支付宝（开通中）"
                      : "微信（开通中）"}
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
              <div className="text-[12px]"><span className="text-muted-foreground">应付：</span><span className="font-medium tabular-nums">¥ {((order.amountCents ?? 0) / 100).toFixed(2)}</span></div>
              {order.contact && (
                <div className="pt-1 text-[11px] text-muted-foreground">
                  对账问题联系：{order.contact.email} · {order.contact.phone}
                </div>
              )}
            </div>

            <form onSubmit={confirm} className="space-y-3 mt-4 border-t pt-4">
              <p className="text-[12px] text-muted-foreground">完成转账后填写以下信息提交凭证：</p>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">实际转账金额（元）*</label>
                <Input type="number" step="0.01" min="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="300.00" required />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">转账时间</label>
                <Input type="datetime-local" value={transferAt} onChange={(e) => setTransferAt(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">备注（订单号、付款方账号后 4 位）*</label>
                <Textarea value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder={`如：订单 ${order.orderNo} · 卡号尾号 6789 · 付款方 张三 / 某公司`} required rows={2} />
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
              <p className="text-muted-foreground">如有紧急问题请联系：doris.li@f1composite.com / 138 8333 8993</p>
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

// ─────────────────────────────────────────────────────────────────────
// 海外：Stripe Checkout 单步流程
// ─────────────────────────────────────────────────────────────────────

function StripeButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setSubmitting(true);
    setError(null);
    const rfqId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const res = await fetch("/api/rfq/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId,
          payerEmail: email,
          payerType: "buyer",
          amountCents: RFQ_AMOUNT_USD_CENTS,
          currency: "usd",
          productName: "f1frp Demo RFQ",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; reason?: string };
      if (data.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.reason === "stripe-not-configured") {
        setError("Payments not yet enabled. Your interest has been recorded.");
        return;
      }
      setError(data.reason ?? "Checkout failed");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "default" }) + " mt-6 w-full"}>
        Try the RFQ payment ($30 demo)
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay-per-RFQ demo checkout</DialogTitle>
          <DialogDescription>
            Walk through the actual Stripe Checkout we use for paid RFQs. $30 USD on this demo session — refundable on request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required disabled={submitting} />
          {error && (
            <p className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Redirecting…" : "Pay $30 → Stripe"}
            </Button>
          </DialogFooter>
        </form>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Test mode • amounts not live until Stripe live keys configured
        </p>
      </DialogContent>
    </Dialog>
  );
}
