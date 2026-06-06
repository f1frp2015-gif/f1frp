import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import { getSessionUid } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SOURCES = [
  "material",
  "formula",
  "standard",
  "paper",
  "patent",
  "supplier",
  "article",
] as const;

type SourceType = (typeof VALID_SOURCES)[number];

async function requireUserId() {
  return getSessionUid();
}

export async function POST(req: Request) {
  const uid = await requireUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    sourceType?: string;
    sourceId?: string;
    title?: string;
    url?: string;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.sourceType || !VALID_SOURCES.includes(body.sourceType as SourceType)) {
    return NextResponse.json({ error: "invalid sourceType" }, { status: 400 });
  }
  if (!body.sourceId || !body.title) {
    return NextResponse.json({ error: "missing sourceId or title" }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(savedItems)
      .values({
        userId: uid,
        sourceType: body.sourceType as SourceType,
        sourceId: body.sourceId,
        title: body.title.slice(0, 500),
        url: body.url?.slice(0, 1000),
        note: body.note?.slice(0, 2000),
      })
      .onConflictDoNothing()
      .returning({ id: savedItems.id });
    return NextResponse.json({ ok: true, id: row?.id ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "insert failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const uid = await requireUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sourceType = url.searchParams.get("sourceType");
  const sourceId = url.searchParams.get("sourceId");
  if (!sourceType || !sourceId) {
    return NextResponse.json({ error: "missing sourceType or sourceId" }, { status: 400 });
  }
  try {
    await db
      .delete(savedItems)
      .where(
        and(
          eq(savedItems.userId, uid),
          eq(savedItems.sourceType, sourceType as SourceType),
          eq(savedItems.sourceId, sourceId)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "delete failed" },
      { status: 500 }
    );
  }
}
