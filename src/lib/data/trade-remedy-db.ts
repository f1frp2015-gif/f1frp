// D3/v2 · 贸易救济"可更新版"读取层 —— 从 DB 读已发布(published)措施。
//
// 刻意与纯模块 `trade-remedy.ts`(静态种子 + 纯查询)分开:landed.ts / run-evals 只 import 纯模块,
// 不触 DB。本文件只被 async 的工具层 import。失败/空 → 返回 []，调用方回退静态种子(永不断供)。

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tradeRemedyMeasures } from "@/lib/db/schema";
import type { ProductCategory } from "@/lib/sourcing/spec";
import type { TariffRegion } from "@/lib/data/tariff";
import type { TradeRemedyMeasure, RemedyKind, RemedyStatus } from "@/lib/data/trade-remedy";

export async function loadPublishedRemedies(): Promise<TradeRemedyMeasure[]> {
  try {
    const rows = await db
      .select()
      .from(tradeRemedyMeasures)
      .where(eq(tradeRemedyMeasures.reviewStatus, "published"));
    return rows.map((r) => ({
      id: r.measureId,
      destination: r.destination as TariffRegion,
      origin: r.origin,
      productScope: r.productScope,
      scopeEn: r.scopeEn ?? "",
      hsCodes: r.hsCodes ?? [],
      appliesTo: (r.appliesTo ?? []) as ProductCategory[],
      kind: r.kind as RemedyKind,
      rateMaxPct: (r.rateMaxBp ?? 0) / 100,
      basis: r.basis ?? "",
      status: r.measureStatus as RemedyStatus,
      effectiveFrom: r.effectiveFrom ?? undefined,
      expiresOn: r.expiresOn ?? undefined,
      sunsetReview: r.sunsetReview ?? undefined,
      source: r.source ?? { name: "db", retrievedOn: "" },
      caveat: r.caveat ?? "",
    }));
  } catch (e) {
    console.warn(
      "[trade-remedy-db] loadPublishedRemedies failed → static seed fallback:",
      e instanceof Error ? e.message : e,
    );
    return [];
  }
}
