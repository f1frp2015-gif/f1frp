"use client";

// RFQ checkout button for /overseas page.
// Demo / try-the-flow widget — collects buyer email + opens Stripe Checkout.
// In production this same endpoint can be called from the post-RFQ-submit
// success state (after /api/v1/rfq) once the buyer wants to unlock priority routing.

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

interface Props {
  locale: "zh" | "en";
}

export function RfqCheckoutButton({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEn = locale === "en";
  // Buyer pays — overseas Stripe usually USD. Demo at $30.
  const amountCents = 3000;
  const currency = "usd";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError(isEn ? "Please enter a valid email" : "请输入有效邮箱");
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
          amountCents,
          currency,
          productName: isEn ? "f1frp Demo RFQ" : "f1frp 试用付费询盘",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string;
        reason?: string;
        message?: string;
      };

      if (data.ok && data.url) {
        window.location.assign(data.url);
        return;
      }

      // 503 stripe-not-configured — billing row created, just no Stripe yet
      if (data.reason === "stripe-not-configured") {
        setError(
          isEn
            ? "Payments are not yet enabled in this environment. Your interest has been recorded."
            : "本环境暂未开通收款（Stripe 待配置）。已记录你的体验意向。",
        );
        return;
      }
      setError(data.reason ?? data.message ?? (isEn ? "Checkout failed" : "下单失败"));
    } catch {
      setError(isEn ? "Network error" : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "default" }) + " mt-6 w-full"}>
        {isEn ? "Try the RFQ payment ($30 demo)" : "试用付费询盘流程（¥ 30 demo）"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEn ? "Pay-per-RFQ demo checkout" : "付费询盘流程 — 体验"}
          </DialogTitle>
          <DialogDescription>
            {isEn
              ? "Walk through the actual Stripe Checkout we use for paid RFQs. Charged $30 USD on this demo session — refundable on request."
              : "走一遍我们真实的 Stripe 付费询盘流程。Demo 会扣款 $30 USD，可申请全额退款。仅供体验海外买家视角。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-[12px] font-medium text-muted-foreground" htmlFor="rfq-email">
              {isEn ? "Email" : "邮箱"}
            </label>
            <Input
              id="rfq-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isEn ? "you@company.com" : "you@company.com"}
              required
              disabled={submitting}
            />
          </div>
          {error && (
            <p className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting
                ? isEn ? "Redirecting…" : "正在跳转…"
                : isEn ? "Pay $30 → Stripe" : "支付 $30 → Stripe"}
            </Button>
          </DialogFooter>
        </form>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {isEn
            ? "Test mode • amounts not live until Stripe live keys configured • see /api/rfq/checkout"
            : "测试模式 · Stripe live key 配齐前不实际扣款 · 接口 /api/rfq/checkout"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
