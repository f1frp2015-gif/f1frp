// POST /api/qualifications
// 入参: { kind, ossKey, fileName?, contentType?, supplierListingId? }
// 出参: ProcessResult { documentId, status, confidence, tagCount, unmapped, note? }
//
// 把一份已上传到 OSS 的资质文档送入「AI 抽取 → 映射打标 → 落库」管道。需登录。
// fileUrl 由本站用 ossKey 签发(signedGetUrl),不接收外部 URL → 无 SSRF。
//
// 上传走既有 /api/uploads/doc(签名直传 OSS,返回 key);拿到 key 后调本接口入库。

import { NextResponse } from "next/server";

import { getSessionUid } from "@/lib/auth/current-user";
import { DOC_KINDS, type DocKind } from "@/lib/enterprise/doc-schema";
import { signedGetUrl } from "@/lib/oss";
import { processQualificationDoc } from "@/lib/qualification/process-doc";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const uid = await getSessionUid().catch(() => null);
  if (!uid) return NextResponse.json({ error: "需要登录" }, { status: 401 });

  let body: {
    kind?: string;
    ossKey?: string;
    fileName?: string;
    contentType?: string;
    supplierListingId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const kind = body.kind as DocKind;
  if (!DOC_KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  const ossKey = typeof body.ossKey === "string" ? body.ossKey.trim() : "";
  // 只接受本站 OSS 内的相对 key(无协议/无 //),签名后由 server 拉取
  if (!ossKey || /^https?:|\/\//i.test(ossKey)) {
    return NextResponse.json({ error: "invalid ossKey" }, { status: 400 });
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");

  const result = await processQualificationDoc({
    kind,
    ossKey,
    fileUrl: signedGetUrl(ossKey),
    fileName: body.fileName ?? null,
    contentType: body.contentType ?? null,
    uploadedByUserId: uid,
    supplierListingId: body.supplierListingId ?? null,
    host,
  });

  return NextResponse.json(result);
}
