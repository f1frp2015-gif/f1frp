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

  // 公众号网页授权只在微信内置浏览器有效。桌面/普通手机浏览器打开 authorize 链接
  // 会被微信判为非法来源(白屏/报错)。这里提前拦截,回登录页提示改用手机号或在
  // 微信中打开,避免把用户丢进微信的错误页。
  const ua = req.headers.get("user-agent") ?? "";
  if (!/MicroMessenger/i.test(ua)) {
    return NextResponse.redirect(`${origin}/sign-in?wechat=desktop`);
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
