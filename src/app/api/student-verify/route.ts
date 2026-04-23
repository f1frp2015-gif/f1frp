import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { isStudentEmail } from "@/lib/membership";

export const runtime = "nodejs";

// 1 year of student tier per verification cycle.
const STUDENT_TIER_DAYS = 365;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const verifiedStudentEmail = clerkUser.emailAddresses.find(
    (e) => e.verification?.status === "verified" && isStudentEmail(e.emailAddress)
  );

  if (!verifiedStudentEmail) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          "需要在账户里添加并验证 .edu.cn / .edu / .ac.cn / .edu.hk / .edu.tw 学校邮箱。请到 Clerk 用户设置 → 添加邮箱 → 完成验证。",
      },
      { status: 403 }
    );
  }

  const [u] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!u) return NextResponse.json({ ok: false, reason: "user-not-synced" }, { status: 401 });

  const expiresAt = new Date(Date.now() + STUDENT_TIER_DAYS * 86400 * 1000);
  await db
    .update(users)
    .set({
      studentVerified: true,
      studentEmail: verifiedStudentEmail.emailAddress,
      membershipTier: "basic",
      membershipExpiry: expiresAt,
      subscriptionStatus: "active",
      updatedAt: new Date(),
    })
    .where(eq(users.id, u.id));

  await db.insert(subscriptions).values({
    userId: u.id,
    plan: "student",
    tier: "basic",
    provider: "manual",
    amountCents: 0,
    currency: "CNY",
    status: "active",
    expiresAt,
    metadata: { studentEmail: verifiedStudentEmail.emailAddress },
  });

  return NextResponse.json({
    ok: true,
    tier: "basic",
    expiresAt: expiresAt.toISOString(),
    email: verifiedStudentEmail.emailAddress,
  });
}
