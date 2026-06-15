// 阿里云 OSS 客户端 + 签名 URL 工具。
// 国内 ECS 与 Vercel 海外侧都直接走 OSS（bucket 在国内 region，海外侧上传偶尔慢但可接受）。
// AccessKey 仅在 server 用，客户端通过 signed PUT URL 直传。

import OSS from "ali-oss";

let _client: OSS | null = null;

function client(): OSS {
  if (_client) return _client;
  const { ALIYUN_OSS_REGION, ALIYUN_OSS_BUCKET, ALIYUN_OSS_ACCESS_KEY, ALIYUN_OSS_ACCESS_SECRET } =
    process.env;
  if (!ALIYUN_OSS_REGION || !ALIYUN_OSS_BUCKET || !ALIYUN_OSS_ACCESS_KEY || !ALIYUN_OSS_ACCESS_SECRET) {
    throw new Error("OSS env not configured");
  }
  _client = new OSS({
    region: ALIYUN_OSS_REGION,
    bucket: ALIYUN_OSS_BUCKET,
    accessKeyId: ALIYUN_OSS_ACCESS_KEY,
    accessKeySecret: ALIYUN_OSS_ACCESS_SECRET,
    secure: true,
  });
  return _client;
}

export const PAYMENT_PROOF_PREFIX = "payment-proofs";
export const BUSINESS_LICENSE_PREFIX = "business-licenses";

export function ossConfigured(): boolean {
  return Boolean(
    process.env.ALIYUN_OSS_REGION &&
      process.env.ALIYUN_OSS_BUCKET &&
      process.env.ALIYUN_OSS_ACCESS_KEY &&
      process.env.ALIYUN_OSS_ACCESS_SECRET
  );
}

export function signedPutUrl(key: string, contentType: string, expiresInSec = 600): string {
  return client().signatureUrl(key, {
    method: "PUT",
    expires: expiresInSec,
    "Content-Type": contentType,
  });
}

export function signedGetUrl(key: string, expiresInSec = 3600): string {
  return client().signatureUrl(key, { method: "GET", expires: expiresInSec });
}

// AI 生成的导出文件(如 BOM Excel)前缀。
export const AI_EXPORT_PREFIX = "ai-exports";

// 服务端直传一个 Buffer 到 OSS(例如 AI 工具生成的 Excel),不经客户端。
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().put(key, body, { headers: { "Content-Type": contentType } });
}

// 签名下载 URL —— 带 Content-Disposition: attachment,让浏览器以指定文件名
// 下载而非内联打开;filename* 走 RFC 5987 兼容中文名。
export function signedDownloadUrl(
  key: string,
  filename: string,
  expiresInSec = 7 * 24 * 3600,
): string {
  const asciiName =
    filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "") || "download.xlsx";
  const disposition =
    `attachment; filename="${asciiName}"; ` +
    `filename*=UTF-8''${encodeURIComponent(filename)}`;
  return client().signatureUrl(key, {
    method: "GET",
    expires: expiresInSec,
    response: { "content-disposition": disposition },
  });
}
