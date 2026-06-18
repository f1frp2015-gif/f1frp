import { NextResponse, after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { fanOutSearchPush } from "@/lib/ingest/search-push";

export const runtime = "nodejs";

// Publish a draft (publishedAt = now) or unpublish back to draft
// (publishedAt = null). Admin-gated. Body: { unpublish?: boolean }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const b = await req.json().catch(() => ({}));
  const unpublish = !!b?.unpublish;

  const [row] = await db
    .update(articles)
    .set({
      publishedAt: unpublish ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning({ id: articles.id, slug: articles.slug });
  if (!row) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  // 发布即推送到 百度/搜狗/360/IndexNow,新稿当天即可被收录与 AI 引用,
  // 不必等每日 ingest cron。取消发布不推送。响应后异步执行,失败静默。
  if (!unpublish && row.slug) {
    after(async () => {
      try {
        await fanOutSearchPush([`https://f1frp.com/articles/${row.slug}`]);
      } catch {
        // best-effort; 各引擎在 search-push 内部已各自吞错
      }
    });
  }

  return NextResponse.json({
    ok: true,
    status: unpublish ? "draft" : "published",
    slug: row.slug,
  });
}
