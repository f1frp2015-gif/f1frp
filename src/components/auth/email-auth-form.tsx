"use client";

// Email OTP sign-in/up for getfrp.com (en/overseas). Passwordless, mirrors
// PhoneAuthForm. English-only (renders on the en locale), so strings are inline.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safePath(value: string | null): string {
  if (!value) return "/dashboard";
  let candidate = value;
  try {
    if (/^https?:\/\//i.test(value)) {
      const u = new URL(value);
      candidate = `${u.pathname}${u.search}`;
    }
  } catch {
    return "/dashboard";
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/dashboard";
  return candidate;
}

export function EmailAuthForm({ mode }: { mode: "signIn" | "signUp" }) {
  const searchParams = useSearchParams();
  const redirectTo = safePath(searchParams.get("redirect_url"));

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong, please try again");
        return;
      }
      setStep("code");
      setCooldown(60);
      if (data?.devCode) setDevCode(String(data.devCode));
    } catch {
      setError("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!/^\d{6}$/.test(code)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong, please try again");
        return;
      }
      // Full navigation so the proxy/middleware reads the freshly-set cookie.
      window.location.assign(redirectTo);
    } catch {
      setError("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{mode === "signUp" ? "Create your account" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&rsquo;ll email you a 6-digit code — no password needed. A new account is created automatically.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={step === "code"}
            placeholder="you@company.com"
            onChange={(e) => setEmail(e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && step === "email") sendCode();
            }}
          />
        </div>

        {step === "code" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Verification code</label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                placeholder="6-digit code"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
              <Button type="button" variant="outline" disabled={cooldown > 0 || loading} onClick={sendCode}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Sent to {email}. Check spam if you don&rsquo;t see it.</p>
            {devCode && <p className="mt-1 text-xs text-amber-600">Dev code: {devCode}</p>}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {step === "email" ? (
          <Button type="button" className="w-full" disabled={loading} onClick={sendCode}>
            {loading ? "Sending…" : "Email me a code"}
          </Button>
        ) : (
          <div className="space-y-2">
            <Button type="button" className="w-full" disabled={loading || code.length !== 6} onClick={submit}>
              {loading ? "Signing in…" : "Continue"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
