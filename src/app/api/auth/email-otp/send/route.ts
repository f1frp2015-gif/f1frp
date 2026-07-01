import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOtps } from "@/lib/db/schema";
import {
  generateCode,
  hashCode,
  OTP_DAILY_CAP,
  OTP_RESEND_COOLDOWN_SEC,
  OTP_TTL_SEC,
} from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/notify";

// Email OTP for getfrp.com (en/overseas). Mirrors /api/auth/otp/send (phone),
// swapping Aliyun SMS for Resend email. Same rate-limits, hashed codes.
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normEmail = (v: unknown) => String(v ?? "").trim().toLowerCase();
const isValidEmail = (e: string) => e.length <= 255 && EMAIL_RE.test(e);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body?.email);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  try {
    const now = Date.now();

    // Rate-limit 1: one code per 60s per email.
    const cooldownSince = new Date(now - OTP_RESEND_COOLDOWN_SEC * 1000);
    const [recent] = await db
      .select({ id: emailOtps.id })
      .from(emailOtps)
      .where(and(eq(emailOtps.email, email), gte(emailOtps.createdAt, cooldownSince)))
      .limit(1);
    if (recent) {
      return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    }

    // Rate-limit 2: at most OTP_DAILY_CAP per email per 24h.
    const daySince = new Date(now - 24 * 60 * 60 * 1000);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailOtps)
      .where(and(eq(emailOtps.email, email), gte(emailOtps.createdAt, daySince)));
    if (count >= OTP_DAILY_CAP) {
      return NextResponse.json({ error: "Daily code limit reached — try again tomorrow" }, { status: 429 });
    }

    const code = generateCode();
    await db.insert(emailOtps).values({
      email,
      codeHash: hashCode(code, email),
      expiresAt: new Date(now + OTP_TTL_SEC * 1000),
    });

    if (process.env.RESEND_API_KEY) {
      const sent = await sendEmail({
        to: email,
        subject: `${code} is your F1 Composite sign-in code`,
        html: otpEmailHtml(code),
        cc: [], // never CC ops on an auth code
      });
      if (!sent) {
        return NextResponse.json({ error: "Could not send the email, please try again" }, { status: 502 });
      }
      return NextResponse.json({ ok: true });
    }

    // Email not configured: dev returns the code for local testing; prod refuses.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, devCode: code });
    }
    return NextResponse.json({ error: "Email service is not configured" }, { status: 503 });
  } catch (e) {
    console.error("[email-otp/send] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Service temporarily unavailable, please retry" }, { status: 500 });
  }
}

function otpEmailHtml(code: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:auto;padding:32px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">Your sign-in code</h2>
  <p style="color:#555;margin:0 0 20px">Enter this code to sign in to F1 Composite. It expires in 5 minutes.</p>
  <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f5f5f5;border-radius:8px;padding:16px 0;text-align:center">${code}</div>
  <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
</body></html>`;
}
