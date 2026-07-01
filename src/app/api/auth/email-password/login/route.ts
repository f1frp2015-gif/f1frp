import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { issueSession } from "@/lib/auth/set-session";
import { verifyPassword } from "@/lib/auth/password";

// Email+password login for getfrp.com (en). Generic error on any failure so it
// never leaks whether an email is registered.
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    await issueSession(res, user.id);
    return res;
  } catch (e) {
    console.error("[email-password/login] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Service temporarily unavailable, please retry" }, { status: 500 });
  }
}
