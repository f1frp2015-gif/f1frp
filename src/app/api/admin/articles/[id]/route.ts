import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";

export const runtime = "nodejs";

// Edit a draft (or any article) in place. Admin-gated.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const b = await req.json().catch(() => ({}));
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof b.title === "string" && b.title.trim()) set.title = b.title.trim().slice(0, 500);
  if (typeof b.excerpt === "string") set.excerpt = b.excerpt.slice(0, 600);
  if (typeof b.body === "string") set.body = b.body;
  if (typeof b.category === "string") set.category = b.category.slice(0, 50);
  if (typeof b.readTime === "string") set.readTime = b.readTime.slice(0, 20);
  if (typeof b.forZh === "boolean") set.forZh = b.forZh;
  if (typeof b.forEn === "boolean") set.forEn = b.forEn;
  if (typeof b.hot === "boolean") set.hot = b.hot;

  const [row] = await db
    .update(articles)
    .set(set)
    .where(eq(articles.id, id))
    .returning({ id: articles.id });
  if (!row) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Delete a draft/article. Admin-gated.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }
  await db.delete(articles).where(eq(articles.id, id));
  return NextResponse.json({ ok: true });
}
