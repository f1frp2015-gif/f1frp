// PATCH /api/admin/prices/[id] — 保存草稿(报价/综述/来源/标题/周次)。

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { type PriceQuote, priceReports } from "@/lib/db/schema";

function sanitizeQuotes(input: unknown): PriceQuote[] | null {
  if (!Array.isArray(input)) return null;
  const out: PriceQuote[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const q = raw as Record<string, unknown>;
    const name = String(q.name ?? "").trim();
    if (!name) continue;
    out.push({
      name,
      nameEn: q.nameEn ? String(q.nameEn) : undefined,
      category: String(q.category ?? "auxiliary"),
      price: Number(q.price) || 0,
      unit: String(q.unit ?? "元/吨"),
      change: Number(q.change) || 0,
      region: String(q.region ?? "全国"),
      source: q.source ? String(q.source) : undefined,
    });
  }
  return out;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const body = await req.json().catch(() => ({}));
  const patch: Partial<typeof priceReports.$inferInsert> = { updatedAt: new Date() };

  if (body.quotes !== undefined) {
    const q = sanitizeQuotes(body.quotes);
    if (!q) return NextResponse.json({ error: "quotes 格式错误" }, { status: 400 });
    patch.quotes = q;
  }
  if (typeof body.summary === "string") patch.summary = body.summary;
  if (typeof body.title === "string") patch.title = body.title;
  if (Array.isArray(body.sources)) patch.sources = body.sources.map(String);

  const [updated] = await db
    .update(priceReports)
    .set(patch)
    .where(eq(priceReports.id, id))
    .returning({ id: priceReports.id });
  if (!updated) {
    return NextResponse.json({ error: "行情不存在" }, { status: 404 });
  }

  return NextResponse.json({ data: { id: updated.id } });
}
