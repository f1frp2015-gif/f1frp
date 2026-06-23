import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AVATAR_PREFIX, ossConfigured, signedGetUrl, signedPutUrl } from "@/lib/oss";

export const runtime = "nodejs";

// 头像只收图片(不含 PDF),走签名直传 OSS。key 锁在 avatars/<userId>/ 前缀下。
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

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
    return NextResponse.json({ error: "仅支持 JPG/PNG/WebP 图片" }, { status: 400 });
  }

  const safeName = fileName.replace(/[^\w.\-]+/g, "_").slice(-80) || "avatar";
  const key = `${AVATAR_PREFIX}/${me.id}/${Date.now()}-${safeName}`;

  return NextResponse.json({
    uploadUrl: signedPutUrl(key, contentType),
    key,
    getUrl: signedGetUrl(key, 3600 * 24 * 365),
  });
}
