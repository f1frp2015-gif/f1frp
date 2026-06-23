// POST /api/qualifications
// 入参: { kind, ossKey, fileName?, contentType? }
// 出参: ProcessResult { documentId, status, confidence, tagCount, unmapped, note? }
//
// 把一份已上传到 OSS 的资质文档送入「AI 抽取 → 映射打标 → 落库」管道。需登录。
// fileUrl 由本站用 ossKey 签发(signedGetUrl),不接收外部 URL → 无 SSRF。
//
// 上传走既有 /api/uploads/doc(签名直传 OSS,返回 key);拿到 key 后调本接口入库。
//
// ⚠️ 授权红线(不可回退):
//   1) supplierListingId 一律由服务端按会话推导(企业 → 供应商),绝不读客户端入参,
//      否则任意登录用户可把伪造资质挂到任意供应商名下(IDOR)。
//   2) ossKey 必须落在「本人 + 本类目」前缀内,杜绝复用他人已直传的对象。

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { DOC_KINDS, docPrefix, type DocKind } from "@/lib/enterprise/doc-schema";
import { ossConfigured, signedGetUrl } from "@/lib/oss";
import { processQualificationDoc } from "@/lib/qualification/process-doc";

export const runtime = "nodejs";
export const maxDuration = 60;

// 与 /api/uploads/doc 的白名单保持一致(防止入库口径与签名口径脱节)。
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: Request) {
  const me = await getCurrentUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "需要登录" }, { status: 401 });

  if (!ossConfigured()) {
    return NextResponse.json({ error: "对象存储未配置" }, { status: 503 });
  }

  let body: {
    kind?: string;
    ossKey?: string;
    fileName?: string;
    contentType?: string;
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
  // 绑定到「本人在本类目下直传」的对象前缀(见 /api/uploads/doc 的 key 规则),
  // 防止跨用户复用他人已上传文件,也强制 kind 与上传时一致。
  const expectedPrefix = `${docPrefix(kind)}/${me.id}/`;
  if (!ossKey.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "invalid ossKey" }, { status: 400 });
  }

  // contentType 二次校验(签名时已校验,这里防止入库脏值/与白名单脱节)
  const contentType =
    typeof body.contentType === "string" ? body.contentType.trim() : "";
  if (contentType && !ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "仅支持 JPG/PNG/WebP/PDF" }, { status: 400 });
  }

  // 服务端推导供应商归属:企业 → supplier_listings(与上传页 page.tsx 同口径)。
  // 解析不到则置 null(允许「认领前先上传」,文档暂不归属任何供应商)。
  let supplierListingId: string | null = null;
  if (me.enterpriseId) {
    const [s] = await db
      .select({ id: supplierListings.id })
      .from(supplierListings)
      .where(eq(supplierListings.enterpriseId, me.enterpriseId))
      .limit(1);
    if (s) supplierListingId = s.id;
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");

  const result = await processQualificationDoc({
    kind,
    ossKey,
    fileUrl: signedGetUrl(ossKey),
    fileName: body.fileName ?? null,
    contentType: contentType || null,
    uploadedByUserId: me.id,
    supplierListingId,
    enterpriseId: me.enterpriseId ?? null,
    host,
  });

  return NextResponse.json(result);
}
