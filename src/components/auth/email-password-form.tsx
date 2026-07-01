"use client";

// Direct email+password sign-up/in for getfrp.com (en/overseas). No email
// verification (low-friction lead capture); password is the login factor.
// English-only (renders on the en locale), so strings are inline.
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
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

export function EmailPasswordForm({ mode }: { mode: "signIn" | "signUp" }) {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect_url");
  const redirectTo = safePath(redirectParam);
  const isSignUp = mode === "signUp";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (isSignUp && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(isSignUp ? "/api/auth/email-password/register" : "/api/auth/email-password/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

  const switchHref = (isSignUp ? "/sign-in" : "/sign-up") + (redirectParam ? `?redirect_url=${encodeURIComponent(redirectParam)}` : "");

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{isSignUp ? "Create your account" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignUp ? "Register with your email — no verification needed." : "Welcome back."}
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
            placeholder="you@company.com"
            onChange={(e) => setEmail(e.target.value.trim())}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <Input
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Button type="button" className="w-full" disabled={loading} onClick={submit}>
          {loading ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "Need an account? "}
        <Link href={switchHref as "/sign-in"} className="font-medium text-foreground hover:underline">
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
