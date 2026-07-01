import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOtps, users } from "@/lib/db/schema";
import { hashCode, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { issueSession } from "@/lib/auth/set-session";

// Email OTP verify for getfrp.com (en). Mirrors /api/auth/otp/verify (phone):
// validate code → find-or-create user by email → issue the same session cookie.
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").trim();

  if (!EMAIL_RE.test(email) || email.length > 255 || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid email or code format" }, { status: 400 });
  }

  try {
    // Latest unconsumed, unexpired code for this email.
    const [otp] = await db
      .select()
      .from(emailOtps)
      .where(
        and(eq(emailOtps.email, email), isNull(emailOtps.consumedAt), gt(emailOtps.expiresAt, new Date())),
      )
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    if (!otp) {
      return NextResponse.json({ error: "Code is invalid or expired — request a new one" }, { status: 400 });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts — request a new code" }, { status: 429 });
    }
    if (hashCode(code, email) !== otp.codeHash) {
      await db.update(emailOtps).set({ attempts: otp.attempts + 1 }).where(eq(emailOtps.id, otp.id));
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    // Passed → mark consumed.
    await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, otp.id));

    // find-or-create by email (partial unique index + onConflictDoNothing races).
    let uid: string | undefined;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    uid = existing?.id;
    if (!uid) {
      const [created] = await db
        .insert(users)
        .values({ email, role: "individual" })
        .onConflictDoNothing()
        .returning({ id: users.id });
      uid = created?.id;
      if (!uid) {
        const [again] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        uid = again?.id;
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Sign-in failed, please retry" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    await issueSession(res, uid);
    return res;
  } catch (e) {
    console.error("[email-otp/verify] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Service temporarily unavailable, please retry" }, { status: 500 });
  }
}
