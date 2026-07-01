import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { issueSession } from "@/lib/auth/set-session";
import { hashPassword, isValidPassword } from "@/lib/auth/password";

// Direct email+password registration for getfrp.com (en). No email verification
// (see decision: low-friction lead capture); password is the login factor.
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!EMAIL_RE.test(email) || email.length > 255) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists — sign in instead" },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(password);
    let uid: string | undefined = existing?.id;

    if (uid) {
      // email exists without a password (e.g. legacy / OTP-created) → set it.
      await db.update(users).set({ passwordHash }).where(eq(users.id, uid));
    } else {
      const [created] = await db
        .insert(users)
        .values({ email, passwordHash, role: "individual" })
        .onConflictDoNothing()
        .returning({ id: users.id });
      uid = created?.id;
      if (!uid) {
        const [again] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        uid = again?.id;
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Sign-up failed, please retry" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    await issueSession(res, uid);
    return res;
  } catch (e) {
    console.error("[email-password/register] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Service temporarily unavailable, please retry" }, { status: 500 });
  }
}
