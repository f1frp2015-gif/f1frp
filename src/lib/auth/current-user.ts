/**
 * 服务端(Node 路由 / RSC)读取当前登录用户。
 * 会话 cookie 里只存 users.id,这里据此查整行 —— 替代原先的 Clerk auth()+clerkId 查表。
 */
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "./session";

export async function getSessionUid(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  return payload?.uid ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const uid = await getSessionUid();
  if (!uid) return null;
  const [row] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  return row ?? null;
}

/** 页面/路由中要求必须登录 —— 返回用户或 null(调用方决定如何重定向/响应)。 */
export async function requireUser(): Promise<User | null> {
  return getCurrentUser();
}
