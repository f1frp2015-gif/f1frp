/**
 * 在 NextResponse 上设置/清除会话 cookie。
 * 用于 OTP 校验(JSON 响应)与微信回调(重定向响应)等需要写 Set-Cookie 的场景。
 */
import { type NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_SEC, signSession, sessionCookieOptions } from "./session";

export async function issueSession(res: NextResponse, uid: string): Promise<void> {
  const token = await signSession(uid, SESSION_TTL_SEC);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSession(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
}
