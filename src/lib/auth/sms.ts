// 阿里云短信 SendSms —— 国内手机 OTP 发码。手写 RPC v1 签名(HMAC-SHA1),零依赖。
// 复用 ECS 现有变量名 ALIYUN_SMS_*(AccessKey/签名已配)。验证码模板单独取:
//   ALIYUN_SMS_OTP_TEMPLATE_CODE 优先,缺则回落 ALIYUN_SMS_TEMPLATE_CODE。
//   ⚠ 该模板的变量名须为 ${code}(发送的 TemplateParam = {"code":"123456"})。
import { createHmac, randomUUID } from "node:crypto";

// RFC3986 percent-encode(阿里云:* → %2A,~ 保留,空格 → %20)
function pe(s: string): string {
  return encodeURIComponent(s)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function otpTemplateCode(): string | undefined {
  return (
    process.env.ALIYUN_SMS_OTP_TEMPLATE_CODE ||
    process.env.ALIYUN_SMS_TEMPLATE_CODE
  );
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.ALIYUN_SMS_ACCESS_KEY &&
      process.env.ALIYUN_SMS_ACCESS_SECRET &&
      process.env.ALIYUN_SMS_SIGN_NAME &&
      otpTemplateCode(),
  );
}

export async function sendSmsCode(
  phone: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const keyId = process.env.ALIYUN_SMS_ACCESS_KEY;
  const keySecret = process.env.ALIYUN_SMS_ACCESS_SECRET;
  const signName = process.env.ALIYUN_SMS_SIGN_NAME;
  const templateCode = otpTemplateCode();
  if (!keyId || !keySecret || !signName || !templateCode) {
    return { ok: false, error: "SMS not configured" };
  }

  const params: Record<string, string> = {
    AccessKeyId: keyId,
    Action: "SendSms",
    Format: "JSON",
    PhoneNumbers: phone,
    RegionId: "cn-hangzhou",
    SignName: signName,
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomUUID(),
    SignatureVersion: "1.0",
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: "2017-05-25",
  };

  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${pe(k)}=${pe(params[k])}`)
    .join("&");
  const stringToSign = `POST&${pe("/")}&${pe(canonical)}`;
  const signature = createHmac("sha1", `${keySecret}&`)
    .update(stringToSign)
    .digest("base64");
  const body = `Signature=${pe(signature)}&${canonical}`;

  try {
    const res = await fetch("https://dysmsapi.aliyuncs.com/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { Code?: string; Message?: string };
    if (data.Code !== "OK") {
      return { ok: false, error: `${data.Code ?? "?"}: ${data.Message ?? ""}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
