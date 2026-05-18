"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

// Lightweight email-capture for the weekly FRP sourcing brief. Posts to
// /api/newsletter; if that route is unwired (env var missing), the API
// returns 200 + logs to server console so the UX stays clean until Resend /
// Mailchimp / Buttondown is plugged in.
//
// English B2B audiences convert markedly better via email than via
// in-product chat — newsletter signup near the bottom of every long-form
// page is the single highest-ROI capture surface for this audience.

interface Props {
  variant?: "card" | "inline";
  topic?: string;
  className?: string;
}

export function NewsletterSignup({
  variant = "card",
  topic,
  className,
}: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "submitting") return;
    setState("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), topic, source: "web" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("ok");
      setEmail("");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed");
    }
  }

  if (variant === "inline") {
    return (
      <form
        onSubmit={onSubmit}
        className={`flex flex-col gap-2 sm:flex-row ${className ?? ""}`}
      >
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "submitting" || state === "ok"}
          className="min-w-0 flex-1 rounded-md border border-border/70 bg-background px-3 py-2 text-[14px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === "submitting" || state === "ok" || !email.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {state === "ok" ? (
            <>
              <CheckCircle2 size={14} /> Subscribed
            </>
          ) : (
            <>
              Subscribe <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <section
      className={`rounded-xl border border-border/70 bg-muted/20 p-6 sm:p-8 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <Mail
          size={20}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-foreground"
        />
        <div className="flex-1">
          <h3 className="text-base font-semibold tracking-tight">
            Weekly FRP sourcing brief
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            One short email each Wednesday: new verified Chinese FRP suppliers,
            mid-market FOB price moves, GB / ASTM / EN standards updates, CBAM
            and trade-rule changes. Unsubscribe any time, no sharing.
          </p>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === "submitting" || state === "ok"}
              className="min-w-0 flex-1 rounded-md border border-border/70 bg-background px-3 py-2 text-[14px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={
                state === "submitting" || state === "ok" || !email.trim()
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {state === "ok" ? (
                <>
                  <CheckCircle2 size={14} /> Subscribed
                </>
              ) : state === "submitting" ? (
                "Subscribing…"
              ) : (
                <>
                  Subscribe <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
          {state === "ok" && (
            <p className="mt-3 text-[12px] text-muted-foreground">
              Thanks — first issue lands next Wednesday morning your time.
            </p>
          )}
          {state === "error" && (
            <p className="mt-3 text-[12px] text-destructive">
              Something broke ({errorMsg}). Email us at the address on the
              contact page and we&apos;ll add you manually.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
