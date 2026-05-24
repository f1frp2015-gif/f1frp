/**
 * Anonymous usage limits — cookie-based.
 *
 * 当前阶段全免费,但匿名 AI 调用超过 3 条后引导注册(降低骚扰、留下沉淀)。
 * 已登录用户(Clerk userId 存在)完全跳过这层。
 *
 * 实现:HttpOnly cookie 累加器,7 天过期。清 cookie 即可重置 — 我们不追究,
 * 这一层是"软引导"不是"硬墙"。
 */

const COOKIE_NAME = "f1frp_anon_chat";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const ANON_CHAT_LIMIT = 3;

export type AnonGateResult =
  | { ok: true; used: number; remaining: number; cookieHeader: string }
  | { ok: false; used: number; limit: number };

function readCookieMap(req: Request): Record<string, string> {
  const raw = req.headers.get("cookie") ?? "";
  const out: Record<string, string> = {};
  for (const part of raw.split(/;\s*/)) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    out[part.slice(0, eq)] = decodeURIComponent(part.slice(eq + 1));
  }
  return out;
}

function buildSetCookie(value: string): string {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ].join("; ");
}

/**
 * Try to consume one anonymous chat credit. Returns:
 *   - { ok: true, cookieHeader } if there are still credits (caller must include
 *     the Set-Cookie header on the response).
 *   - { ok: false } if the limit was already reached.
 *
 * Cookie format: just an integer (count of consumed calls).
 */
export function consumeAnonChatCredit(req: Request): AnonGateResult {
  const cookies = readCookieMap(req);
  const used = Math.max(0, parseInt(cookies[COOKIE_NAME] ?? "0", 10) || 0);

  if (used >= ANON_CHAT_LIMIT) {
    return { ok: false, used, limit: ANON_CHAT_LIMIT };
  }

  const next = used + 1;
  return {
    ok: true,
    used: next,
    remaining: ANON_CHAT_LIMIT - next,
    cookieHeader: buildSetCookie(String(next)),
  };
}

/**
 * 标准的"超额"响应体 — UI 端识别这个 shape 之后弹出登录引导。
 * 服务端用 401 状态码 + 这个 body 表达"请登录"语义。
 */
export const ANON_LIMIT_RESPONSE_BODY = {
  error: "AUTH_REQUIRED",
  reason: "anon_chat_limit",
  limit: ANON_CHAT_LIMIT,
  signUpUrl: "/sign-up",
  signInUrl: "/sign-in",
  messageZh: `匿名免费咨询已用完(${ANON_CHAT_LIMIT} 条/次)。注册账号即可继续无限使用。`,
  messageEn: `Free anonymous queries used up (${ANON_CHAT_LIMIT} per session). Sign up to keep going — unlimited and free.`,
} as const;
