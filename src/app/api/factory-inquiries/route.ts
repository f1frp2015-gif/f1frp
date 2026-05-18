import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { factoryInquiries, users } from "@/lib/db/schema";

// POST /api/factory-inquiries — manual paste / web-form / API ingress for
// a new external buyer inquiry that the factory wants the AI to draft a
// reply for. Until email-IMAP integration ships (Phase 2), this is how
// pilot factories get inquiries into the dashboard:
//
//   • Operator forwards / pastes the inquiry email body from their inbox
//   • This route stores it under the authenticated factory user
//   • Dashboard renders it under /dashboard/factory-inquiries/[id]
//   • Factory triggers AI draft → reviews → marks sent
//
// Authn: Clerk. Authz: any signed-in user may create inquiries owned by
// themselves; admin moderation is out of scope for the V1 product.

export const runtime = "nodejs";

const CreateSchema = z.object({
  source: z
    .enum(["email_imap", "email_forward", "web_form", "manual_paste", "api"])
    .default("manual_paste"),
  buyerName: z.string().max(200).optional(),
  buyerEmail: z.string().email().max(200).optional().or(z.literal("")),
  buyerCountry: z.string().max(80).optional(),
  buyerCompany: z.string().max(200).optional(),
  originalSubject: z.string().max(300).optional(),
  originalText: z.string().min(10).max(20000),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        ),
      },
      { status: 400 },
    );
  }

  // Map Clerk user to internal users row. We need users.id (UUID) to scope
  // the inquiry. If the user hasn't been mirrored into the users table yet,
  // bail with a clear error — the dashboard layout already creates users
  // on first visit, so this should never happen in normal flow.
  const [me] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!me) {
    return NextResponse.json(
      { error: "User profile not initialized — visit /dashboard first" },
      { status: 409 },
    );
  }

  const payload = parsed.data;
  try {
    const [row] = await db
      .insert(factoryInquiries)
      .values({
        factoryUserId: me.id,
        source: payload.source,
        buyerName: payload.buyerName ?? null,
        buyerEmail:
          payload.buyerEmail && payload.buyerEmail.length > 0
            ? payload.buyerEmail
            : null,
        buyerCountry: payload.buyerCountry ?? null,
        buyerCompany: payload.buyerCompany ?? null,
        originalSubject: payload.originalSubject ?? null,
        originalText: payload.originalText,
        status: "new",
      })
      .returning({ id: factoryInquiries.id });

    console.log("[factory-inquiries] created", {
      userId: me.id,
      inquiryId: row.id,
      source: payload.source,
      bytes: payload.originalText.length,
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("[factory-inquiries] insert failed", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
