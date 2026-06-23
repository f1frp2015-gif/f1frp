// PATCH /api/auth/profile — 注册用户自助修改昵称 / 头像。需登录。
// 仅允许改 name + avatarUrl;avatarUrl 必须是本站 OSS(*.aliyuncs.com)的 https 地址,
// 防止把任意外链写进 avatarUrl 后被当作 <img src> 注入。

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

function isAllowedAvatarUrl(url: string): boolean {
  if (!url) return true; // 允许清空头像
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".aliyuncs.com");
  } catch {
    return false;
  }
}

export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let body: { name?: unknown; avatarUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const updates: {
    name?: string;
    avatarUrl?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 1) {
      return NextResponse.json({ error: "请输入昵称" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "昵称最多 100 个字符" }, { status: 400 });
    }
    updates.name = name;
  }

  if (body.avatarUrl !== undefined) {
    const avatarUrl =
      body.avatarUrl === null ? "" : String(body.avatarUrl).trim();
    if (!isAllowedAvatarUrl(avatarUrl)) {
      return NextResponse.json({ error: "头像地址无效" }, { status: 400 });
    }
    updates.avatarUrl = avatarUrl || null;
  }

  if (updates.name === undefined && updates.avatarUrl === undefined) {
    return NextResponse.json({ error: "无可更新字段" }, { status: 400 });
  }

  const [row] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, me.id))
    .returning({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    });

  return NextResponse.json({ user: row });
}
