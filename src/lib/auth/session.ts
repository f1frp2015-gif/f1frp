// 统一身份解析 —— 按部署 profile 分流,屏蔽两套认证差异:
//   domestic (f1frp.com / ECS)   → Auth.js 会话
//   global   (getfrp.com / Vercel) → Clerk
// 上层调用点用 getCurrentUser()/getCurrentUserId() 取本地 users 行/ id,
// 不再直接依赖 Clerk 的 auth()。(call-site 迁移在阶段④进行。)
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { aiProfile } from "@/lib/ai/provider";
import { auth as authJs } from "@/auth";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export async function getCurrentUser(): Promise<User | null> {
  if (aiProfile === "domestic") {
    const session = await authJs();
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid) return null;
    const rows = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    return rows[0] ?? null;
  }
  const { userId: clerkId } = await clerkAuth();
  if (!clerkId) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}
