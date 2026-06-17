// GET /api/cron/price-digest — 每周一(部署侧 cron)生成「本周行情草稿」。
// 现阶段:克隆最新一期作为脚手架(change 归零),落 draft 待人工/AI 更新真实数据后终审发布。
// 下一步:接「权威来源抓取 + AI 整合」技能填充草稿(generatedBy=skill:price-digest)。
// 幂等:本周已有报告则跳过。

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { type PriceQuote, priceReports } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}

function thisMonday(): string {
  const d = new Date();
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const weekOf = thisMonday();
  const [existing] = await db
    .select({ id: priceReports.id })
    .from(priceReports)
    .where(eq(priceReports.weekOf, weekOf))
    .limit(1);
  if (existing) {
    return NextResponse.json({ ok: true, skipped: "weekly report exists", weekOf });
  }

  const [latest] = await db
    .select()
    .from(priceReports)
    .orderBy(desc(priceReports.createdAt))
    .limit(1);
  const quotes: PriceQuote[] = (latest?.quotes ?? []).map((q) => ({
    ...q,
    change: 0,
  }));

  const [created] = await db
    .insert(priceReports)
    .values({
      weekOf,
      title: latest?.title ?? "复材原材料价格行情",
      summary: "",
      quotes,
      sources: latest?.sources ?? [],
      status: "draft",
      generatedBy: "cron:weekly-draft",
    })
    .returning({ id: priceReports.id });

  return NextResponse.json({ ok: true, created: created.id, weekOf, quotes: quotes.length });
}
