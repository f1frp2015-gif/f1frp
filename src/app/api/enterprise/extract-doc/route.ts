// POST /api/enterprise/extract-doc
// 入参: { kind: "license"|"product"|"test"|"cert", fileUrl: <OSS url> }
// 出参: ExtractDocOutcome { kind, confidence, data, ok, note? }
//
// AI 结构化阅读企业上传的证照/产品/检测/认证文档,返回结构化字段供注册表单预填
// (人工复核后再提交)。需登录。fileUrl 限定为本站 OSS,防 SSRF。

import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/auth/current-user";
import { extractDoc } from "@/lib/enterprise/extract-doc";
import { DOC_KINDS, type DocKind } from "@/lib/enterprise/doc-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only allow fetching from our OSS bucket — extractDoc fetches this URL
// server-side, so an arbitrary URL would be an SSRF vector.
function isAllowedFileUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname.endsWith("aliyuncs.com");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const uid = await getSessionUid().catch(() => null);
  if (!uid) return NextResponse.json({ error: "需要登录" }, { status: 401 });

  let body: { kind?: string; fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const kind = body.kind as DocKind;
  if (!DOC_KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  if (!body.fileUrl || typeof body.fileUrl !== "string" || !isAllowedFileUrl(body.fileUrl)) {
    return NextResponse.json({ error: "invalid fileUrl" }, { status: 400 });
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const result = await extractDoc(kind, body.fileUrl, host);
  return NextResponse.json(result);
}
