// Feasibility matching — given a buyer SourcingSpec, find export-ready Chinese
// FRP factories that can make the product family, and compute per-candidate
// standards met/gap. DB-backed (like dispatch.ts); pure scoring in JS.
//
// Gate: verified = true AND export_ready = true. export_ready is the
// domestic-side screening flag (set by the backfill / f1frp ops) — this is the
// 国内筛选→海外消费 flywheel boundary: only screened factories surface to getfrp.

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { type SourcingSpec, type ProductCategory, supplierMeetsStandard } from "./spec";

export interface SupplierCandidate {
  id: string;
  name: string;
  nameEn: string | null;
  province: string | null;
  scaleTier: string | null;
  certifications: string[];
  standardsMet: string[];
  standardsGap: string[];
  moqKg: number | null;
  leadTimeDays: number | null;
}

export interface FeasibilityResult {
  canMake: boolean;
  productCategory: ProductCategory;
  candidateCount: number;
  candidates: SupplierCandidate[];
  standardsRequested: string[];
  standardsMetByAny: string[];
  standardsGapForAll: string[];
}

export async function matchSuppliers(spec: SourcingSpec): Promise<FeasibilityResult> {
  const cat = spec.productCategory;
  const requested = spec.standards ?? [];

  // jsonb `?` tests array-element/key existence; the column is guarded as NULL
  // returns false for `?`. Rank like dispatch.ts: paid brand priority, then scale.
  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;

  const rows = await db
    .select({
      id: supplierListings.id,
      name: supplierListings.name,
      nameEn: supplierListings.nameEn,
      province: supplierListings.province,
      scaleTier: supplierListings.scaleTier,
      certifications: supplierListings.certifications,
      standardsSupported: supplierListings.standardsSupported,
      moqKg: supplierListings.moqKg,
      leadTimeDays: supplierListings.leadTimeDays,
    })
    .from(supplierListings)
    .where(
      and(
        eq(supplierListings.verified, true),
        eq(supplierListings.exportReady, true),
        sql`(${supplierListings.capabilities} ? ${cat})`,
      ),
    )
    .orderBy(desc(supplierListings.brandPriority), desc(tierRank), desc(supplierListings.viewCount))
    .limit(5);

  const candidates: SupplierCandidate[] = rows.map((r) => {
    const supported = [...(r.standardsSupported ?? []), ...(r.certifications ?? [])];
    return {
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      province: r.province,
      scaleTier: r.scaleTier,
      certifications: r.certifications ?? [],
      standardsMet: requested.filter((s) => supplierMeetsStandard(s, supported)),
      standardsGap: requested.filter((s) => !supplierMeetsStandard(s, supported)),
      moqKg: r.moqKg,
      leadTimeDays: r.leadTimeDays,
    };
  });

  const top = candidates.slice(0, 3);
  const metByAny = requested.filter((s) => candidates.some((c) => c.standardsMet.includes(s)));
  const gapForAll = requested.filter((s) => !metByAny.includes(s));

  return {
    canMake: top.length > 0,
    productCategory: cat,
    candidateCount: candidates.length,
    candidates: top,
    standardsRequested: requested,
    standardsMetByAny: metByAny,
    standardsGapForAll: gapForAll,
  };
}
