import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminUser(user: Pick<User, "role" | "email">): boolean {
  if (user.role === "admin") return true;
  if (!user.email) return false;
  return adminEmails().has(user.email.toLowerCase());
}

export type AdminGate =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; reason: string };

export async function gateAdmin(): Promise<AdminGate> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { ok: false, status: 401, reason: "请先登录" };
  }
  const [me] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!me) {
    return { ok: false, status: 401, reason: "用户资料同步中" };
  }
  if (!isAdminUser(me)) {
    return { ok: false, status: 403, reason: "无管理员权限" };
  }
  return { ok: true, user: me };
}
