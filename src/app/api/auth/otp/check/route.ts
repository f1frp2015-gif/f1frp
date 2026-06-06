import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { phoneOtps } from "@/lib/db/schema";
import { hashCode, isValidCnPhone, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";

export const runtime = "nodejs";

/**
 * 仅校验某手机号的验证码是否正确(并消费),不创建用户、不签发会话。
 * 用于「企业入驻表单里验证联系电话归属」—— 联系电话可能与登录手机号不同,
 * 因此绝不能复用 /verify(那会切换登录账号)。
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? "").trim();
  const code = String(body?.code ?? "").trim();

  if (!isValidCnPhone(phone) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "手机号或验证码格式不正确" }, { status: 400 });
  }

  try {
    const [otp] = await db
      .select()
      .from(phoneOtps)
      .where(
        and(eq(phoneOtps.phone, phone), isNull(phoneOtps.consumedAt), gt(phoneOtps.expiresAt, new Date()))
      )
      .orderBy(desc(phoneOtps.createdAt))
      .limit(1);

    if (!otp) {
      return NextResponse.json({ error: "验证码无效或已过期,请重新获取" }, { status: 400 });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: "尝试次数过多,请重新获取验证码" }, { status: 429 });
    }
    if (hashCode(code, phone) !== otp.codeHash) {
      await db
        .update(phoneOtps)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(phoneOtps.id, otp.id));
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    await db.update(phoneOtps).set({ consumedAt: new Date() }).where(eq(phoneOtps.id, otp.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[otp/check] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "服务暂时不可用,请稍后重试" }, { status: 500 });
  }
}
