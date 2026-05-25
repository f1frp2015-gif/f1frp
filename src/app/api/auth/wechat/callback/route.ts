// 微信网页授权回跳 —— 校验 state → 换 openid → (userinfo) → Auth.js 建会话。
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchUserInfo } from "@/lib/auth/wechat-mp";
import { signIn } from "@/auth";

function publicOrigin(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "f1frp.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("wx_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${origin}/sign-in?error=wechat_state`);
  }
  const next = req.cookies.get("wx_oauth_next")?.value || "/dashboard";

  // 先在 try 内完成微信换号(可能失败 → 降级跳登录页)。
  let openid: string;
  let unionid: string | undefined;
  let nickname: string | undefined;
  let avatarUrl: string | undefined;
  try {
    const token = await exchangeCodeForToken(code);
    openid = token.openid;
    unionid = token.unionid;
    if (token.scope.includes("snsapi_userinfo")) {
      const info = await fetchUserInfo(token.accessToken, token.openid);
      nickname = info.nickname;
      avatarUrl = info.avatarUrl;
      unionid = info.unionid ?? unionid;
    }
  } catch (e) {
    console.error("[wechat/callback]", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${origin}/sign-in?error=wechat_failed`);
  }

  // signIn 在 try 之外调用:Credentials 登录会 upsert + 建会话并抛 NEXT_REDIRECT,
  // 必须让该重定向异常向上传播(不能被 catch 吞掉)。
  // ⚠ 首次真机联调确认:GET 路由内 signIn 能否正确 set-cookie(Auth.js v5)。
  return await signIn("wechat", {
    openid,
    unionid: unionid ?? "",
    nickname: nickname ?? "",
    avatarUrl: avatarUrl ?? "",
    redirectTo: next,
  });
}
