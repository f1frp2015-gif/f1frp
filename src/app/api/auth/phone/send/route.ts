// 手机 OTP 发码 —— POST { phone } → 签发并短信发送验证码。
// 校验码由前端走 Auth.js signIn("phone-otp", { phone, code }) 完成。
import { NextRequest, NextResponse } from "next/server";
import { issueOtp } from "@/lib/auth/otp";

const CN_MOBILE = /^1[3-9]\d{9}$/;

export async function POST(req: NextRequest) {
  let phone = "";
  try {
    const body = (await req.json()) as { phone?: unknown };
    phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  } catch {
    // ignore — 下面统一按格式错误处理
  }
  if (!CN_MOBILE.test(phone)) {
    return NextResponse.json(
      { ok: false, error: "手机号格式不正确" },
      { status: 400 },
    );
  }
  const r = await issueOtp(phone);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 429 });
  }
  return NextResponse.json({ ok: true });
}
