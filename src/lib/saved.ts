import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth/session";

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
 * state in one call. 认证按 profile 分流(domestic→Auth.js、global→Clerk),
 * 见 lib/auth/session.ts。
 */
export async function resolveViewer(): Promise<{
  signedIn: boolean;
  userId: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    return { signedIn: Boolean(userId), userId };
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
