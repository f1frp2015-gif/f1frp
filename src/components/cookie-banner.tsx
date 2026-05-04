"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

const COOKIE_KEY = "cookie-consent-v1";

type Consent = "accepted" | "declined";

function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`),
  );
  if (!m) return null;
  const v = decodeURIComponent(m[1]);
  return v === "accepted" || v === "declined" ? v : null;
}

function writeConsent(value: Consent) {
  // 1-year persistent cookie; SameSite=Lax avoids breaking auth callbacks.
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_KEY}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const locale = useLocale();
  const en = locale === "en";
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setShown(true);
  }, []);

  if (!shown) return null;

  function dismiss(value: Consent) {
    writeConsent(value);
    setShown(false);
    // Soft-broadcast so analytics scripts can react in the same session.
    window.dispatchEvent(
      new CustomEvent("cookie-consent", { detail: value }),
    );
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={en ? "Cookie consent" : "Cookie 设置"}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
          {en ? (
            <>
              We use essential cookies to keep this site running, plus
              optional analytics (Vercel Web Analytics, Google) to understand
              how visitors use it. See our{" "}
              <Link href={"/privacy" as never} className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </>
          ) : (
            <>
              本站使用必要 Cookie 维持基本功能，并可选启用 Vercel Web Analytics
              与 Google 分析以了解访问情况。详见
              <Link href={"/privacy" as never} className="underline hover:text-foreground">
                隐私政策
              </Link>
              。
            </>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => dismiss("declined")}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            {en ? "Decline optional" : "仅必要"}
          </button>
          <button
            type="button"
            onClick={() => dismiss("accepted")}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-colors hover:bg-foreground/90"
          >
            {en ? "Accept all" : "接受全部"}
          </button>
        </div>
      </div>
    </div>
  );
}
