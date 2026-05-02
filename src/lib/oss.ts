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
