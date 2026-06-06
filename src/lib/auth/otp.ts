/**
 * 手机验证码工具 —— 仅在 Node 路由(runtime="nodejs")中调用,可用 node:crypto。
 */
import { createHash, randomInt } from "node:crypto";

export const CN_PHONE_RE = /^1[3-9]\d{9}$/;

export function isValidCnPhone(phone: string): boolean {
  return CN_PHONE_RE.test(phone);
}

export function generateCode(): string {
  // 6 位数字,首位允许为 0
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** sha256(code + phone + AUTH_SESSION_SECRET) — 与库里 codeHash 比对,不落明文。 */
export function hashCode(code: string, phone: string): string {
  const salt = process.env.AUTH_SESSION_SECRET || "dev-only-insecure-session-secret-change-me";
  return createHash("sha256").update(`${code}:${phone}:${salt}`).digest("hex");
}

export const OTP_TTL_SEC = 5 * 60; // 5 分钟
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SEC = 60;
export const OTP_DAILY_CAP = 10;
