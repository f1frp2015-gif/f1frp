import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { exchangeCodeForToken, fetchUserInfo, wechatConfigured } from "@/lib/wechat";
import { publicOrigin, safeRedirectPath } from "@/lib/auth/public-origin";
import { issueSession } from "@/lib/auth/set-session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/sign-in?wechat=${encodeURIComponent(reason)}`);

  if (!wechatConfigured()) return fail("unconfigured");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("wx_state")?.value;
  const redirectAfter = safeRedirectPath(req.cookies.get("wx_redirect")?.value);

  if (!code || !state || !savedState || state !== savedState) {
    return fail("error");
  }

  let unionId: string | undefined;
  let openId: string;
  let nickname: string | undefined;
  let avatar: string | undefined;
  try {
    const token = await exchangeCodeForToken(code);
    openId = token.openid;
    unionId = token.unionid;
    const info = await fetchUserInfo(token.accessToken, token.openid);
    unionId = unionId ?? info.unionid;
    nickname = info.nickname;
    avatar = info.headimgurl;
  } catch {
    return fail("error");
  }

  // find-or-create + 签发会话整段包 try/catch:DB 异常(如生产库未跑
  // 2026-06-06-self-built-auth 迁移、缺 wechat_union_id 列)或会话签名失败
  // (AUTH_SESSION_SECRET 未配置)时,优雅退回登录页,而非抛未捕获异常变 500。
  try {
    // 优先 unionid(跨应用唯一),否则退回 openid
    let uid: string | undefined;
    if (unionId) {
      const [byUnion] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.wechatUnionId, unionId))
        .limit(1);
      uid = byUnion?.id;
    }
    if (!uid) {
      const [byOpen] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.wechatOpenId, openId))
        .limit(1);
      uid = byOpen?.id;
    }

    if (uid) {
      await db
        .update(users)
        .set({
          wechatOpenId: openId,
          wechatUnionId: unionId ?? null,
          name: nickname ?? undefined,
          avatarUrl: avatar ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, uid));
    } else {
      const [created] = await db
        .insert(users)
        .values({
          wechatOpenId: openId,
          wechatUnionId: unionId ?? null,
          name: nickname ?? null,
          avatarUrl: avatar ?? null,
          role: "individual",
        })
        .onConflictDoNothing()
        .returning({ id: users.id });
      uid = created?.id;
      if (!uid && unionId) {
        const [again] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.wechatUnionId, unionId))
          .limit(1);
        uid = again?.id;
      }
    }

    if (!uid) return fail("error");

    const res = NextResponse.redirect(`${origin}${redirectAfter}`);
    await issueSession(res, uid);
    res.cookies.delete("wx_state");
    res.cookies.delete("wx_redirect");
    return res;
  } catch (e) {
    console.error("[wechat/callback] post-auth failed:", e instanceof Error ? e.message : e);
    return fail("error");
  }
}
