import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ossConfigured, signedGetUrl, signedPutUrl } from "@/lib/oss";
import { DOC_KINDS, docPrefix, type DocKind } from "@/lib/enterprise/doc-schema";

export const runtime = "nodejs";

// 企业注册阶段上传的 4 类证照/文档,统一走这里拿直传 OSS 的预签名 URL。
// (营业执照单独的 /api/uploads/business-license 仍保留,兼容现有企业表单。)
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  if (!ossConfigured()) {
    return NextResponse.json({ error: "对象存储未配置" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const fileName = String(body?.fileName ?? "").trim();
  const contentType = String(body?.contentType ?? "").trim();
  const kind = String(body?.kind ?? "") as DocKind;

  if (!DOC_KINDS.includes(kind)) {
    return NextResponse.json({ error: "未知的文件类型" }, { status: 400 });
  }
  if (!fileName || !ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "仅支持 JPG/PNG/WebP/PDF" }, { status: 400 });
  }

  const safeName = fileName.replace(/[^\w.\-]+/g, "_").slice(-80);
  const key = `${docPrefix(kind)}/${me.id}/${Date.now()}-${safeName}`;

  return NextResponse.json({
    uploadUrl: signedPutUrl(key, contentType),
    key,
    getUrl: signedGetUrl(key, 3600 * 24 * 365),
  });
}
