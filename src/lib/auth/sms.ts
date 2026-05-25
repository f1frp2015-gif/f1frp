// 阿里云短信 SendSms —— 国内手机 OTP 发码。
// 手写 RPC v1 签名(HMAC-SHA1),零依赖。⚠ 首次需用真实 AccessKey/签名/模板联调,
// 核对签名与模板参数名(默认模板变量为 ${code})。
// env:ALI_SMS_ACCESS_KEY_ID / ALI_SMS_ACCESS_KEY_SECRET / ALI_SMS_SIGN_NAME / ALI_SMS_TEMPLATE_CODE
import { createHmac, randomUUID } from "node:crypto";

// RFC3986 percent-encode(阿里云要求:* → %2A,~ 保留,空格 → %20)
function pe(s: string): string {
  return encodeURIComponent(s)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.ALI_SMS_ACCESS_KEY_ID &&
      process.env.ALI_SMS_ACCESS_KEY_SECRET &&
      process.env.ALI_SMS_SIGN_NAME &&
      process.env.ALI_SMS_TEMPLATE_CODE,
  );
}

export async function sendSmsCode(
  phone: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const keyId = process.env.ALI_SMS_ACCESS_KEY_ID;
  const keySecret = process.env.ALI_SMS_ACCESS_KEY_SECRET;
  const signName = process.env.ALI_SMS_SIGN_NAME;
  const templateCode = process.env.ALI_SMS_TEMPLATE_CODE;
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
