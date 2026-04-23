import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, savedItems } from "@/lib/db/schema";

export type SavedSourceType =
  | "material"
  | "formula"
  | "standard"
  | "paper"
  | "patent"
  | "supplier"
  | "article";

/**
 * Resolve the currently authenticated engineer's DB `users.id` and signed-in
 * state in one call. Used by detail pages to render the SaveButton in the
 * correct initial state without an extra round-trip.
 */
export async function resolveViewer(): Promise<{
  signedIn: boolean;
  userId: string | null;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { signedIn: false, userId: null };
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    return { signedIn: true, userId: u?.id ?? null };
  } catch {
    return { signedIn: false, userId: null };
  }
}

/** Is this source already saved by the given user? */
export async function isSaved(
  userId: string,
  sourceType: SavedSourceType,
  sourceId: string
): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: savedItems.id })
      .from(savedItems)
      .where(
        and(
          eq(savedItems.userId, userId),
          eq(savedItems.sourceType, sourceType),
          eq(savedItems.sourceId, sourceId)
        )
      )
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}
