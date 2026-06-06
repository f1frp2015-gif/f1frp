/**
 * 阿里云短信(Dysmsapi SendSms)—— 手写 RPC v1 签名(HMAC-SHA1),不引官方 SDK。
 * 仅在 Node 路由(runtime="nodejs")中调用。
 *
 * 需要的环境变量(与 OSS 的 key 分开,短信与存储凭证实际不同):
 *   ALIYUN_SMS_ACCESS_KEY
 *   ALIYUN_SMS_ACCESS_SECRET
 *   ALIYUN_SMS_SIGN_NAME      短信签名,如「复材在线」
 *   ALIYUN_SMS_TEMPLATE_CODE  模板 CODE,如 SMS_123456789,模板含 ${code}
 *   ALIYUN_SMS_REGION         可选,默认 cn-hangzhou
 */
import { createHmac, randomUUID } from "node:crypto";

const ENDPOINT = "https://dysmsapi.aliyuncs.com/";

export function smsConfigured(): boolean {
  return Boolean(
    process.env.ALIYUN_SMS_ACCESS_KEY &&
      process.env.ALIYUN_SMS_ACCESS_SECRET &&
      process.env.ALIYUN_SMS_SIGN_NAME &&
      process.env.ALIYUN_SMS_TEMPLATE_CODE
  );
}

// 阿里云 RPC 规定的百分号编码(在 encodeURIComponent 基础上微调)
function percentEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function sign(params: Record<string, string>, accessSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const canonical = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");
  const stringToSign = `POST&${percentEncode("/")}&${percentEncode(canonical)}`;
  return createHmac("sha1", `${accessSecret}&`).update(stringToSign).digest("base64");
}

export async function sendOtpSms(
  phone: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!smsConfigured()) return { ok: false, error: "短信服务未配置" };

  const accessKey = process.env.ALIYUN_SMS_ACCESS_KEY!;
  const accessSecret = process.env.ALIYUN_SMS_ACCESS_SECRET!;

  const params: Record<string, string> = {
    AccessKeyId: accessKey,
    Action: "SendSms",
    Format: "JSON",
    RegionId: process.env.ALIYUN_SMS_REGION || "cn-hangzhou",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomUUID(),
    SignatureVersion: "1.0",
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: "2017-05-25",
    PhoneNumbers: phone,
    SignName: process.env.ALIYUN_SMS_SIGN_NAME!,
    TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!,
    TemplateParam: JSON.stringify({ code }),
  };
  params.Signature = sign(params, accessSecret);

  const body = Object.keys(params)
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  try {
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await resp.json().catch(() => ({}))) as { Code?: string; Message?: string };
    if (resp.ok && data.Code === "OK") return { ok: true };
    return { ok: false, error: data.Message || data.Code || `短信发送失败(${resp.status})` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "短信发送异常" };
  }
}
