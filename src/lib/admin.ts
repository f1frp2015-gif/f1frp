import { type User } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

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
  // 认证按 profile 分流(domestic→Auth.js、global→Clerk),见 lib/auth/session.ts。
  const me = await getCurrentUser();
  if (!me) {
    return { ok: false, status: 401, reason: "请先登录" };
  }
  if (!isAdminUser(me)) {
    return { ok: false, status: 403, reason: "无管理员权限" };
  }
  return { ok: true, user: me };
}
