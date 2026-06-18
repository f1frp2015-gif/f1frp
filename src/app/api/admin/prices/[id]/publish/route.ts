// POST /api/admin/prices/[id]/publish — 终审发布 / 取消发布。
// body { publish: boolean }。发布即成为首页+公开行情页展示的「最新一期」。

import { NextResponse, after } from "next/server";
import { eq } from "drizzle-orm";

import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { priceReports } from "@/lib/db/schema";
import { fanOutSearchPush } from "@/lib/ingest/search-push";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const body = await req.json().catch(() => ({}));
  const publish = body?.publish !== false; // 默认发布

  const [updated] = await db
    .update(priceReports)
    .set({
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : null,
      reviewerId: publish ? gate.user.id : null,
      updatedAt: new Date(),
    })
    .where(eq(priceReports.id, id))
    .returning({ id: priceReports.id });
  if (!updated) {
    return NextResponse.json({ error: "行情不存在" }, { status: 404 });
  }

  // 终审发布即推送行情页 /trade 与首页(均展示「最新一期」)到
  // 百度/搜狗/360/IndexNow。响应后异步执行,失败静默。
  if (publish) {
    after(async () => {
      try {
        await fanOutSearchPush([
          "https://f1frp.com/trade",
          "https://f1frp.com/",
        ]);
      } catch {
        // best-effort; 各引擎在 search-push 内部已各自吞错
      }
    });
  }

  return NextResponse.json({
    data: { id: updated.id, status: publish ? "published" : "draft" },
  });
}
