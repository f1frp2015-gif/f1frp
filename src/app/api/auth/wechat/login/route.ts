// 微信公众号网页授权 —— 入口:跳转到微信授权页。
// 用户在微信内访问 /api/auth/wechat/login?next=/dashboard → 微信授权 → 回跳 callback。
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl } from "@/lib/auth/wechat-mp";

function publicOrigin(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "f1frp.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const state = randomBytes(16).toString("hex");
  const url = buildAuthorizeUrl({
    redirectUri: `${origin}/api/auth/wechat/callback`,
    state,
    scope: "snsapi_userinfo",
  });

  const res = NextResponse.redirect(url);
  const opts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  res.cookies.set("wx_oauth_state", state, opts);
  const next = req.nextUrl.searchParams.get("next");
  if (next && next.startsWith("/")) res.cookies.set("wx_oauth_next", next, opts);
  return res;
}
