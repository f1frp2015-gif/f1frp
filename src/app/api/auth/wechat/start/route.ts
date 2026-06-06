import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildAuthorizeUrl, wechatConfigured } from "@/lib/wechat";
import { publicOrigin, safeRedirectPath } from "@/lib/auth/public-origin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const redirectAfter = safeRedirectPath(req.nextUrl.searchParams.get("redirect_url"));

  if (!wechatConfigured()) {
    // 未配置:回登录页并提示「即将开放」
    return NextResponse.redirect(`${origin}/sign-in?wechat=unconfigured`);
  }

  const state = randomUUID();
  const callback = `${origin}/api/auth/wechat/callback`;
  const res = NextResponse.redirect(buildAuthorizeUrl(state, callback));
  // CSRF:把 state 与登录后回跳路径写入短期 cookie,回调时校验
  res.cookies.set("wx_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("wx_redirect", redirectAfter, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
