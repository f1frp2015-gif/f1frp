"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// UA(是否微信内置浏览器)在挂载后不会变 → 订阅为空操作,稳定引用避免重复订阅。
const noopSubscribe = () => () => {};

export function PhoneAuthForm({ mode }: { mode: "signIn" | "signUp" }) {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const redirectTo = safePath(searchParams.get("redirect_url"));
  const wechatStatus = searchParams.get("wechat");

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    wechatStatus === "error" ? t("wechatError") : null
  );
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  // 公众号网页授权只在微信内置浏览器有效。用 useSyncExternalStore 读 UA:服务端 /
  // 首帧快照为 false(显示"请在微信打开"提示,水合安全),客户端水合后据真实 UA
  // 翻转为可点的微信登录入口。
  const inWechat = useSyncExternalStore(
    noopSubscribe,
    () => /MicroMessenger/i.test(navigator.userAgent),
    () => false
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError(t("errPhone"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? t("errGeneric"));
        return;
      }
      setStep("code");
      setCooldown(60);
      if (data?.devCode) setDevCode(String(data.devCode));
    } catch {
      setError(t("errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!/^\d{6}$/.test(code)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? t("errGeneric"));
        return;
      }
      // 整页跳转,确保中间件读到刚写入的会话 cookie
      window.location.assign(redirectTo);
    } catch {
      setError(t("errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const wechatIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.7 7.2C5 7.2 2 9.7 2 12.8c0 1.8 1 3.4 2.6 4.4l-.6 2 2.3-1.2c.8.2 1.6.4 2.4.4h.6a4.6 4.6 0 0 1-.2-1.4c0-2.9 2.8-5.2 6.3-5.2h.6C15.4 8.9 12.3 7.2 8.7 7.2Zm-2.4 3a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Zm4.9 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />
      <path d="M22 16.1c0-2.5-2.4-4.5-5.4-4.5s-5.4 2-5.4 4.5 2.4 4.5 5.4 4.5c.6 0 1.2-.1 1.8-.3l1.8 1-.5-1.6c1.4-.8 2.3-2.1 2.3-3.6Zm-7-.8a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm3.6 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z" />
    </svg>
  );

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{mode === "signUp" ? t("signUpTitle") : t("signInTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("phoneLabel")}</label>
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            disabled={step === "code"}
            placeholder={t("phonePlaceholder")}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          />
        </div>

        {step === "code" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("codeLabel")}</label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                placeholder={t("codePlaceholder")}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
              <Button type="button" variant="outline" disabled={cooldown > 0 || loading} onClick={sendCode}>
                {cooldown > 0 ? t("resendIn", { sec: cooldown }) : t("sendCode")}
              </Button>
            </div>
            {devCode && (
              <p className="mt-1.5 text-xs text-amber-600">{t("devCodeHint", { code: devCode })}</p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <Button type="button" className="w-full" disabled={loading} onClick={sendCode}>
            {loading ? t("submitting") : t("sendCode")}
          </Button>
        ) : (
          <div className="space-y-2">
            <Button type="button" className="w-full" disabled={loading || code.length !== 6} onClick={submit}>
              {loading ? t("submitting") : t("submit")}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
            >
              {t("changePhone")}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orDivider")}
        <span className="h-px flex-1 bg-border" />
      </div>

      {wechatStatus === "unconfigured" ? (
        <Button type="button" variant="outline" className="w-full" disabled>
          {t("wechatComingSoon")}
        </Button>
      ) : inWechat ? (
        <a
          href={`/api/auth/wechat/start?redirect_url=${encodeURIComponent(redirectTo)}`}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-[#07c160] transition-colors hover:bg-muted"
        >
          {wechatIcon}
          {t("wechatLogin")}
        </a>
      ) : (
        // 非微信环境(桌面/普通手机浏览器):公众号网页授权点不动,降级为提示,
        // 引导用手机号登录或在微信中打开。
        <div className="space-y-1.5">
          <div className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
            {wechatIcon}
            {t("wechatLogin")}
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("wechatOpenInApp")}</p>
        </div>
      )}
    </div>
  );
}
