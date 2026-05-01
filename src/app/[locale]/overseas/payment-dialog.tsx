"use client";

// /overseas 页 RFQ demo 按钮：zh 走通用 PaymentDialog（对公转账两步）；en 走 Stripe 单步。

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
import { PaymentDialog as DomesticPaymentDialog } from "@/components/payment/payment-dialog";

const RFQ_AMOUNT_CNY_CENTS = 30000;
const RFQ_AMOUNT_USD_CENTS = 3000;

export function PaymentDialog({ locale }: { locale: "zh" | "en" }) {
  if (locale === "en") return <StripeButton />;
  return (
    <DomesticPaymentDialog
      orderType="rfq"
      amountCents={RFQ_AMOUNT_CNY_CENTS}
      triggerLabel="试用付费询盘流程（¥300 demo）"
      triggerClassName={buttonVariants({ variant: "default" }) + " mt-6 w-full"}
      dialogTitle="付费询盘流程 — 国内通道"
      dialogDescription="¥300 demo 单 · 银行对公转账即时可用，支付宝/微信开通中。我们 1 个工作日内对账。"
    />
  );
}

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
