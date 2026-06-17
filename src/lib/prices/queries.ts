// 价格行情读取助手:首页 + 公开行情页用「最新 published 一期」。
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { type PriceQuote, priceReports } from "@/lib/db/schema";

export type { PriceQuote };

export type PriceReport = typeof priceReports.$inferSelect;

/** 最新已发布的一期行情(无则 null,调用方回退到静态基线)。 */
export async function getLatestPublishedReport(): Promise<PriceReport | null> {
  const [r] = await db
    .select()
    .from(priceReports)
    .where(eq(priceReports.status, "published"))
    .orderBy(desc(priceReports.publishedAt))
    .limit(1);
  return r ?? null;
}
