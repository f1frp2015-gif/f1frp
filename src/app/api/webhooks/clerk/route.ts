import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

type ClerkEmail = { email_address: string; id: string };
type ClerkPhone = { phone_number: string; id: string };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  phone_numbers?: ClerkPhone[];
  primary_phone_number_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string | null;
};

type ClerkEvent =
  | { type: "user.created"; data: ClerkUserData }
  | { type: "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: { id: string; deleted?: boolean } };

function pickPrimary<T extends { id: string }>(
  list: T[] | undefined,
  primaryId: string | null | undefined
): T | undefined {
  if (!list || list.length === 0) return undefined;
  if (primaryId) {
    const found = list.find((x) => x.id === primaryId);
    if (found) return found;
  }
  return list[0];
}

function fullName(data: ClerkUserData): string | null {
  const parts = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return parts || data.username || null;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SIGNING_SECRET not configured" },
      { status: 500 }
    );
  }

  const hdrs = await headers();
  const svixId = hdrs.get("svix-id");
  const svixTimestamp = hdrs.get("svix-timestamp");
  const svixSignature = hdrs.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();

  let event: ClerkEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const d = event.data;
    const email = pickPrimary(d.email_addresses, d.primary_email_address_id)?.email_address ?? null;
    const phone = pickPrimary(d.phone_numbers, d.primary_phone_number_id)?.phone_number ?? null;
    const name = fullName(d);
    const avatarUrl = d.image_url ?? null;

    if (event.type === "user.created") {
      await db
        .insert(users)
        .values({
          clerkId: d.id,
          email,
          phone,
          name,
          avatarUrl,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { email, phone, name, avatarUrl, updatedAt: new Date() },
        });
    } else {
      await db
        .update(users)
        .set({ email, phone, name, avatarUrl, updatedAt: new Date() })
        .where(eq(users.clerkId, d.id));
    }
  } else if (event.type === "user.deleted") {
    if (event.data.id) {
      await db.delete(users).where(eq(users.clerkId, event.data.id));
    }
  }

  return NextResponse.json({ ok: true });
}
