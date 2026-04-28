import { and, desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  reports,
  reportPurchases,
  type Report,
  type ReportPurchase,
} from "@/lib/db/schema";
import { effectiveTier, type MembershipTier } from "@/lib/membership";
import { quoteReportPrice, type ReportPriceQuote } from "@/lib/pricing";

export type ReportViewer = {
  signedIn: boolean;
  userId: string | null;
  clerkId: string | null;
  tier: MembershipTier;
};

const ANON_VIEWER: ReportViewer = {
  signedIn: false,
  userId: null,
  clerkId: null,
  tier: "free",
};

export async function resolveReportViewer(): Promise<ReportViewer> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return ANON_VIEWER;
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    if (!u) return { ...ANON_VIEWER, signedIn: true, clerkId };
    return {
      signedIn: true,
      userId: u.id,
      clerkId,
      tier: effectiveTier(u),
    };
  } catch {
    return ANON_VIEWER;
  }
}

export function quoteForViewer(report: Report, viewer: ReportViewer): ReportPriceQuote {
  return quoteReportPrice(report.priceCents, report.proDiscountBps, viewer.tier);
}

export async function findPaidPurchase(
  userId: string,
  reportId: string
): Promise<ReportPurchase | null> {
  const [row] = await db
    .select()
    .from(reportPurchases)
    .where(
      and(
        eq(reportPurchases.userId, userId),
        eq(reportPurchases.reportId, reportId),
        eq(reportPurchases.status, "paid")
      )
    )
    .orderBy(desc(reportPurchases.paidAt))
    .limit(1);
  return row ?? null;
}

export async function findPendingOrder(
  userId: string,
  reportId: string
): Promise<ReportPurchase | null> {
  const [row] = await db
    .select()
    .from(reportPurchases)
    .where(
      and(
        eq(reportPurchases.userId, userId),
        eq(reportPurchases.reportId, reportId),
        eq(reportPurchases.status, "pending")
      )
    )
    .orderBy(desc(reportPurchases.createdAt))
    .limit(1);
  return row ?? null;
}

export function newOrderId(): string {
  // 业务订单号：rpt-{yyyymmdd}-{rand} — 28 char 内，便于商户后台对账
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 10);
  return `rpt-${ymd}-${rand}`;
}

export async function findReportBySlugOrId(slugOrId: string): Promise<Report | null> {
  const [bySlug] = await db
    .select()
    .from(reports)
    .where(eq(reports.slug, slugOrId))
    .limit(1);
  if (bySlug) return bySlug;
  // UUID 长度 36，避免 pg 报错才尝试按 id 查
  if (slugOrId.length === 36) {
    const [byId] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, slugOrId))
      .limit(1);
    return byId ?? null;
  }
  return null;
}
