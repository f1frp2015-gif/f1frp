import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { downloads, downloadLogs, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
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

  const { userId: clerkId } = await auth();

  if (asset.requiredTier !== "free") {
    if (!clerkId) {
      return NextResponse.redirect(
        new URL(`/sign-in?redirect_url=/api/downloads/${id}`, _req.url)
      );
    }
    const [me] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    if (!me) {
      return NextResponse.json(
        { error: "用户资料未同步，请稍候重试" },
        { status: 401 }
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
  if (clerkId) {
    const [me] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    if (me) {
      userDbId = me.id;
      userTier = effectiveTier(me);
    }
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
