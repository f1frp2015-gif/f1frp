import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";
import { gateByTier } from "@/lib/membership";

export async function POST(req: NextRequest) {
  const gate = await gateByTier("basic");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const body = await req.json();
  const { postId, toUserId, toEnterpriseId, subject, message, contactPhone, contactWechat } = body ?? {};

  if (!toUserId || !subject || !message) {
    return NextResponse.json(
      { error: "toUserId / subject / message 必填" },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(inquiries)
    .values({
      postId: postId ?? null,
      fromUserId: gate.user.id,
      toUserId,
      toEnterpriseId: toEnterpriseId ?? null,
      subject,
      message,
      contactPhone: contactPhone ?? null,
      contactWechat: contactWechat ?? null,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
