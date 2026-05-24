"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * 通用"匿名额度用尽,引导注册"提示条。
 * 接收 useChat 的 error / status 状态,自动判断显示。
 *
 * 服务端命中匿名 3 条上限时返回 401 + body{error:"AUTH_REQUIRED"} —
 * @ai-sdk/react 的 useChat 会把 401 body 序列化进 error.message。
 * 我们做关键字匹配最稳。
 */
export function AuthRequiredNotice({
  error,
  className = "",
}: {
  error?: Error | unknown;
  className?: string;
}) {
  const locale = useLocale();
  const isEn = locale === "en";

  if (!error) return null;
  const msg = error instanceof Error ? error.message : String(error);
  // 命中匿名上限。失败包含 "AUTH_REQUIRED" 或 "401" 都算 — 401 兜底覆盖
  // useChat 内部把 body 吞掉只留 status 的边角场景。
  const isAuthLimit =
    msg.includes("AUTH_REQUIRED") ||
    msg.includes("anon_chat_limit") ||
    msg.includes("401");
  if (!isAuthLimit) {
    // 通用错误 — 也轻量提示一下,避免用户以为系统坏了
    return (
      <div
        className={`rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground ${className}`}
      >
        {isEn
          ? `Something went wrong. Try again, or sign in for a more reliable session.`
          : `刚刚连接出错。可以重试,或登录后获得更稳定的会话。`}
      </div>
    );
  }

  return (
    <div
      className={`rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/40 ${className}`}
    >
      <p className="font-medium text-amber-900 dark:text-amber-200">
        {isEn
          ? "Free anonymous queries used up."
          : "匿名免费咨询已用完。"}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-amber-900/85 dark:text-amber-200/80">
        {isEn
          ? "Sign up to keep going — unlimited and completely free at this stage. Your chat history will be saved."
          : "注册账号即可继续使用,当前阶段完全免费,聊天记录也会保留。"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/sign-up"
          className="inline-flex items-center rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
        >
          {isEn ? "Sign up free" : "免费注册"}
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex items-center rounded-md border border-amber-400/80 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          {isEn ? "I have an account" : "已有账号"}
        </Link>
      </div>
    </div>
  );
}
