import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { enterprises } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await gateAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const [ent] = await db.select().from(enterprises).where(eq(enterprises.id, id)).limit(1);
  if (!ent) {
    return NextResponse.json({ error: "企业不存在" }, { status: 404 });
  }
  if (ent.status !== "pending") {
    return NextResponse.json(
      { error: `当前状态 ${ent.status}，无法重复审核` },
      { status: 409 }
    );
  }

  await db
    .update(enterprises)
    .set({ status: "verified", updatedAt: new Date() })
    .where(eq(enterprises.id, id));

  return NextResponse.json({ data: { id, status: "verified" } });
}
