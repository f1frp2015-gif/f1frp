/**
 * 自建会话 cookie — 用 Web Crypto HMAC-SHA256 签名,可同时在
 * Edge/Node proxy(中间件)与 Node 路由处理器中验证。
 * 故意只用 crypto.subtle + TextEncoder + btoa/atob,不依赖 node:crypto / Buffer。
 *
 * token 格式: base64url(JSON(payload)) + "." + base64url(HMAC)
 * payload: { uid, iat, exp }  (秒级时间戳)
 */

export const SESSION_COOKIE = "f1frp_session";
const DEFAULT_TTL_SEC = 60 * 60 * 24 * 30; // 30 天

export type SessionPayload = {
  uid: string;
  iat: number;
  exp: number;
};

function secret(): string {
  const s = process.env.AUTH_SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SESSION_SECRET 未配置(生产环境必须设置 ≥16 字节随机串)");
    }
    // 开发兜底:固定弱密钥,仅用于本地联调。
    return "dev-only-insecure-session-secret-change-me";
  }
  return s;
}

const encoder = new TextEncoder();

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromString(str: string): string {
  return b64urlFromBytes(encoder.encode(str));
}

function bytesFromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function stringFromB64url(s: string): string {
  return new TextDecoder().decode(bytesFromB64url(s));
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(uid: string, ttlSec = DEFAULT_TTL_SEC): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, iat: now, exp: now + ttlSec };
  const data = b64urlFromString(JSON.stringify(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let sigBytes: Uint8Array;
  try {
    sigBytes = bytesFromB64url(sig);
  } catch {
    return null;
  }
  const key = await hmacKey();
  // crypto.subtle.verify 内部为常量时间比较
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as unknown as BufferSource,
    encoder.encode(data)
  );
  if (!ok) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(stringFromB64url(data)) as SessionPayload;
  } catch {
    return null;
  }
  if (!payload?.uid || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function sessionCookieOptions(maxAgeSec = DEFAULT_TTL_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export const SESSION_TTL_SEC = DEFAULT_TTL_SEC;
