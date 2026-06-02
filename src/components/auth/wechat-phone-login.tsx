"use client";

// 国内登录初稿(后期可改):微信内 → 微信一键登录;PC/外部浏览器 → 手机号验证码。
// 走 Auth.js:微信 = /api/auth/wechat/login 跳转;手机 = signIn("phone-otp")。
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const CN_MOBILE = /^1[3-9]\d{9}$/;

export function WechatPhoneLogin({ next = "/dashboard" }: { next?: string }) {
  const [inWeChat, setInWeChat] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 在 effect 里判断,避免 SSR/CSR 水合不一致
  useEffect(() => {
    setInWeChat(/MicroMessenger/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendCode() {
    setError("");
    if (!CN_MOBILE.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "发送失败,请稍后再试");
        return;
      }
      setCooldown(60);
    } catch {
      setError("网络错误,请重试");
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    setError("");
    if (!CN_MOBILE.test(phone) || code.length < 4) {
      setError("请填写手机号与验证码");
      return;
    }
    setSubmitting(true);
    const res = await signIn("phone-otp", {
      phone,
      code,
      redirect: false,
      callbackUrl: next,
    });
    setSubmitting(false);
    if (!res || res.error) {
      setError("验证码错误或已失效");
      return;
    }
    window.location.href = next;
  }

  const inputCls =
    "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold">登录 / 注册</h1>
        <p className="mt-1 text-sm text-muted-foreground">复材站 · 登录即自动注册</p>
      </div>

      {inWeChat && (
        <a
          href={`/api/auth/wechat/login?next=${encodeURIComponent(next)}`}
          className="block"
        >
          <Button className="w-full" size="lg">
            微信一键登录
          </Button>
        </a>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          手机号登录
        </div>
        <input
          className={inputCls}
          type="tel"
          inputMode="numeric"
          placeholder="手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}
          maxLength={11}
        />
        <div className="flex gap-2">
          <input
            className={inputCls}
            type="text"
            inputMode="numeric"
            placeholder="验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            maxLength={6}
          />
          <Button
            variant="outline"
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            className="shrink-0 whitespace-nowrap"
          >
            {cooldown > 0 ? `${cooldown}s` : "发送验证码"}
          </Button>
        </div>
        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? "登录中…" : "登录"}
        </Button>
      </div>

      {!inWeChat && (
        <p className="text-center text-xs text-muted-foreground">
          在微信内打开本页可用「微信一键登录」
        </p>
      )}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        登录即表示同意服务条款与隐私政策
      </p>
    </div>
  );
}
