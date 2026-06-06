import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { BUSINESS_LICENSE_PREFIX, ossConfigured, signedGetUrl, signedPutUrl } from "@/lib/oss";

export const runtime = "nodejs";

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

  if (!fileName || !ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "仅支持 JPG/PNG/WebP/PDF" }, { status: 400 });
  }

  const safeName = fileName.replace(/[^\w.\-]+/g, "_").slice(-80);
  const key = `${BUSINESS_LICENSE_PREFIX}/${me.id}/${Date.now()}-${safeName}`;

  return NextResponse.json({
    uploadUrl: signedPutUrl(key, contentType),
    key,
    getUrl: signedGetUrl(key, 3600 * 24 * 365),
  });
}
