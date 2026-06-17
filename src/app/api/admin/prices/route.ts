// POST /api/admin/prices — 新建一期草稿(克隆最新一期的报价作为起点,weekOf=下周一)。
// 真实数据由人工/AI 在草稿上更新后终审发布。

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { type PriceQuote, priceReports } from "@/lib/db/schema";

function nextMonday(): string {
  const d = new Date();
  const delta = ((8 - d.getDay()) % 7) || 7; // 距下一个周一的天数(今天周一则取下周一)
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const [latest] = await db
    .select()
    .from(priceReports)
    .orderBy(desc(priceReports.createdAt))
    .limit(1);

  const quotes: PriceQuote[] = (latest?.quotes ?? []).map((q) => ({ ...q }));

  const [created] = await db
    .insert(priceReports)
    .values({
      weekOf: nextMonday(),
      title: latest?.title ?? "复材原材料价格行情",
      summary: "",
      quotes,
      sources: latest?.sources ?? [],
      status: "draft",
      generatedBy: "clone",
    })
    .returning({ id: priceReports.id });

  return NextResponse.json({ data: { id: created.id } });
}
