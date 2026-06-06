import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { phoneOtps, users } from "@/lib/db/schema";
import { hashCode, isValidCnPhone, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { issueSession } from "@/lib/auth/set-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? "").trim();
  const code = String(body?.code ?? "").trim();

  if (!isValidCnPhone(phone) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "手机号或验证码格式不正确" }, { status: 400 });
  }

  // 取最新一条未消费、未过期的验证码
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

  // 校验通过 → 标记消费
  await db.update(phoneOtps).set({ consumedAt: new Date() }).where(eq(phoneOtps.id, otp.id));

  // 按手机号 find-or-create(唯一部分索引 + onConflictDoNothing 防并发)
  let uid: string | undefined;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  uid = existing?.id;
  if (!uid) {
    const [created] = await db
      .insert(users)
      .values({ phone, role: "individual" })
      .onConflictDoNothing()
      .returning({ id: users.id });
    uid = created?.id;
    if (!uid) {
      const [again] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);
      uid = again?.id;
    }
  }

  if (!uid) {
    return NextResponse.json({ error: "登录失败,请重试" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  await issueSession(res, uid);
  return res;
}
