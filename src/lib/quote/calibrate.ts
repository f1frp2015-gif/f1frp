// Data-aware quote calibration — closes part of the flywheel for the quote
// estimator (Citrine "retrieval → prediction with confidence"). The
// deterministic engine in pricing.ts stays authoritative for the price; this
// layer reads accumulated quote_logs to:
//   1) calibrate the ±band by how much comparable history we have, and
//   2) flag when a new estimate is a statistical OUTLIER vs past quotes.
//
// Comparison is on CNY/kg (size-normalized) for the same geometry type + fiber,
// so it's stable across profile sizes. Non-blocking: any DB hiccup → caller
// falls back to the engine's default band.

import { sql, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { quoteLogs } from "@/lib/db/schema";
import type { QuoteInput, QuoteResult } from "@/lib/quote/types";

const DEFAULT_BAND = 0.15;

export type QuoteCalibration = {
  samples: number;
  basis: "cny_per_kg";
  current_cny_per_kg: number;
  history: { median: number; p25: number; p75: number; min: number; max: number } | null;
  position: "inside" | "below" | "above" | "unknown";
  outlier: boolean;
  confidence: "low" | "medium" | "high";
  suggested_band: number;
  note_zh: string;
  note_en: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[idx];
}

function midPerKg(output: Record<string, unknown>): number | null {
  const low = output?.unit_price_low_cny;
  const high = output?.unit_price_high_cny;
  const w = output?.weight_kg_per_m;
  if (typeof low !== "number" || typeof high !== "number" || typeof w !== "number" || w <= 0) {
    return null;
  }
  return (low + high) / 2 / w;
}

export async function calibrateQuote(
  input: QuoteInput,
  result: QuoteResult,
): Promise<QuoteCalibration> {
  const currentPerKg =
    result.weight_kg_per_m > 0
      ? round2((result.unit_price_low_cny + result.unit_price_high_cny) / 2 / result.weight_kg_per_m)
      : 0;

  const base: QuoteCalibration = {
    samples: 0,
    basis: "cny_per_kg",
    current_cny_per_kg: currentPerKg,
    history: null,
    position: "unknown",
    outlier: false,
    confidence: "low",
    suggested_band: DEFAULT_BAND,
    note_zh: "历史样本不足，沿用默认 ±15% 区间。",
    note_en: "Insufficient history; keeping the default ±15% band.",
  };

  if (currentPerKg <= 0) return base;

  // Same geometry type + fiber → comparable CNY/kg cohort. Item 4: drop noisy
  // low-confidence NL extracts (form quotes have null confidence → trusted).
  const geomType = input.geometry.type;
  const rows = await db
    .select({ output: quoteLogs.output, conversion: quoteLogs.conversion })
    .from(quoteLogs)
    .where(
      and(
        sql`${quoteLogs.input}->'geometry'->>'type' = ${geomType}`,
        sql`${quoteLogs.input}->>'fiber' = ${input.fiber}`,
        sql`(${quoteLogs.extractConfidence} IS NULL OR ${quoteLogs.extractConfidence} >= 50)`,
      ),
    )
    .orderBy(desc(quoteLogs.createdAt))
    .limit(800);

  // Item 4: conversion-weighted distribution — quotes that became real RFQs are
  // validated price points (×3); phone-provided ×2; anonymous ×1. This pulls
  // the percentiles toward prices buyers actually acted on. `samples` stays the
  // DISTINCT quote count so the confidence thresholds aren't inflated.
  const weightFor = (c: string): number =>
    c === "rfq_created" ? 3 : c === "phone_provided" ? 2 : 1;
  const perKg: number[] = [];
  let samples = 0;
  for (const r of rows) {
    const v = midPerKg(r.output as Record<string, unknown>);
    if (v == null || !Number.isFinite(v) || v <= 0) continue;
    samples++;
    for (let i = 0; i < weightFor(r.conversion); i++) perKg.push(v);
  }
  perKg.sort((a, b) => a - b);

  if (samples < 5) return { ...base, samples };

  const median = round2(percentile(perKg, 0.5));
  const p25 = round2(percentile(perKg, 0.25));
  const p75 = round2(percentile(perKg, 0.75));
  const min = round2(perKg[0]);
  const max = round2(perKg[samples - 1]);
  const iqr = p75 - p25;

  const position: QuoteCalibration["position"] =
    currentPerKg < p25 ? "below" : currentPerKg > p75 ? "above" : "inside";
  const outlier =
    currentPerKg < p25 - 1.5 * iqr || currentPerKg > p75 + 1.5 * iqr;
  const confidence: QuoteCalibration["confidence"] = samples >= 20 ? "high" : "medium";

  let suggested_band = DEFAULT_BAND;
  if (outlier) suggested_band = 0.2;
  else if (confidence === "high") suggested_band = position === "inside" ? 0.1 : 0.12;
  else suggested_band = 0.15;

  const posZh = position === "inside" ? "落在历史中位区间内" : position === "below" ? "低于历史中位区间" : "高于历史中位区间";
  const posEn = position === "inside" ? "within the historical mid-range" : position === "below" ? "below the historical mid-range" : "above the historical mid-range";

  return {
    samples,
    basis: "cny_per_kg",
    current_cny_per_kg: currentPerKg,
    history: { median, p25, p75, min, max },
    position,
    outlier,
    confidence,
    suggested_band,
    note_zh: outlier
      ? `本次单价 ${currentPerKg} 元/kg 偏离 ${samples} 单历史分布（中位 ${median}，常见 ${p25}–${p75}），建议人工复核。`
      : `对照 ${samples} 单同类历史：本次 ${currentPerKg} 元/kg ${posZh}（中位 ${median}，常见 ${p25}–${p75}），置信度${confidence === "high" ? "较高" : "中等"}。`,
    note_en: outlier
      ? `This quote ${currentPerKg} CNY/kg is an outlier vs ${samples} past quotes (median ${median}, typical ${p25}–${p75}); manual review advised.`
      : `Against ${samples} comparable past quotes: ${currentPerKg} CNY/kg is ${posEn} (median ${median}, typical ${p25}–${p75}); ${confidence} confidence.`,
  };
}

// Re-derive the price interval from the (symmetric) midpoint using a calibrated
// band, leaving the engine's midpoint untouched.
export function applyBand(result: QuoteResult, band: number): QuoteResult {
  const mid = (result.unit_price_low_cny + result.unit_price_high_cny) / 2;
  const low = round2(mid * (1 - band));
  const high = round2(mid * (1 + band));
  return {
    ...result,
    unit_price_low_cny: low,
    unit_price_high_cny: high,
    total_low_cny: round2(low * result.total_meters),
    total_high_cny: round2(high * result.total_meters),
    band,
  };
}
