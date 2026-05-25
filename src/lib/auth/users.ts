import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// 微信用户 upsert —— 国内 Auth.js 登录用。
// 优先按 unionId 认人(跨公众号/小程序/网站统一身份),退而按 openId。
// 国内微信用户 clerkId 为 null。返回本地 users.id(写入会话)。
export async function upsertWechatUser(p: {
  openid: string;
  unionid?: string;
  nickname?: string;
  avatarUrl?: string;
}): Promise<string> {
  const match = p.unionid
    ? or(eq(users.wechatUnionId, p.unionid), eq(users.wechatOpenId, p.openid))
    : eq(users.wechatOpenId, p.openid);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(match)
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({
        wechatOpenId: p.openid,
        ...(p.unionid ? { wechatUnionId: p.unionid } : {}),
        ...(p.nickname ? { name: p.nickname } : {}),
        ...(p.avatarUrl ? { avatarUrl: p.avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing[0].id));
    return existing[0].id;
  }

  const inserted = await db
    .insert(users)
    .values({
      wechatOpenId: p.openid,
      wechatUnionId: p.unionid ?? null,
      name: p.nickname ?? null,
      avatarUrl: p.avatarUrl ?? null,
    })
    .returning({ id: users.id });
  return inserted[0].id;
}
