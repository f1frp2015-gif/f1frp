// 手机 OTP 签发/校验 —— DB 持久化(phone_otps 表),含限频与尝试上限。
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { phoneOtps } from "@/lib/db/schema";
import { sendSmsCode } from "./sms";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 分钟有效
const RESEND_WINDOW_MS = 60 * 1000; // 同号 60s 限一次
const MAX_ATTEMPTS = 5;

export async function issueOtp(
  phone: string,
): Promise<{ ok: boolean; error?: string }> {
  const recent = await db
    .select({ createdAt: phoneOtps.createdAt })
    .from(phoneOtps)
    .where(eq(phoneOtps.phone, phone))
    .orderBy(desc(phoneOtps.createdAt))
    .limit(1);
  if (
    recent[0] &&
    Date.now() - recent[0].createdAt.getTime() < RESEND_WINDOW_MS
  ) {
    return { ok: false, error: "请求过于频繁,请 60 秒后再试" };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.insert(phoneOtps).values({
    phone,
    code,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  const sent = await sendSmsCode(phone, code);
  if (!sent.ok) return { ok: false, error: sent.error ?? "短信发送失败" };
  return { ok: true };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(phoneOtps)
    .where(
      and(
        eq(phoneOtps.phone, phone),
        isNull(phoneOtps.consumedAt),
        gt(phoneOtps.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(phoneOtps.createdAt))
    .limit(1);
  const otp = rows[0];
  if (!otp) return false;
  if (otp.attempts >= MAX_ATTEMPTS) return false;
  if (otp.code !== code) {
    await db
      .update(phoneOtps)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(phoneOtps.id, otp.id));
    return false;
  }
  await db
    .update(phoneOtps)
    .set({ consumedAt: new Date() })
    .where(eq(phoneOtps.id, otp.id));
  return true;
}
