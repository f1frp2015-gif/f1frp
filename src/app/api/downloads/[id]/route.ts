import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { downloads, downloadLogs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { effectiveTier, meetsTier, tierLabel } from "@/lib/membership";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [asset] = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
  if (!asset) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

  // 认证按 profile 分流(domestic→Auth.js、global→Clerk),见 lib/auth/session.ts。
  const me = await getCurrentUser();

  if (asset.requiredTier !== "free") {
    if (!me) {
      return NextResponse.redirect(
        new URL(`/sign-in?redirect_url=/api/downloads/${id}`, _req.url)
      );
    }
    const tier = effectiveTier(me);
    if (!meetsTier(tier, asset.requiredTier)) {
      return NextResponse.json(
        {
          error: `该资源需要 ${tierLabel(asset.requiredTier)} 及以上会员`,
          currentTier: tier,
          upgradeUrl: "/sign-up",
        },
        { status: 403 }
      );
    }
  }

  let userDbId: string | null = null;
  let userTier: "free" | "basic" | "pro" | "enterprise" | null = null;
  if (me) {
    userDbId = me.id;
    userTier = effectiveTier(me);
  }

  await Promise.all([
    db
      .update(downloads)
      .set({ downloadCount: sql`${downloads.downloadCount} + 1` })
      .where(eq(downloads.id, id)),
    db.insert(downloadLogs).values({
      downloadId: id,
      userId: userDbId,
      userTier,
    }),
  ]);

  return NextResponse.redirect(asset.fileUrl, { status: 302 });
}
