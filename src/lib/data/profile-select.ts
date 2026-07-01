// Reverse profile selection — "given span + load + deflection limit, which of
// OUR catalog profiles passes?" — the piece the existing /tech/calculator and
// profile_mechanics tool lack (they CHECK a section you type; this RECOMMENDS a
// section from the catalog). Maps to the white-space competitors don't cover
// (only Treadwell TreadSpec does load→profile selection) and grounds the answer
// on f1's catalog (Fictiv pattern: only recommend what we can supply).
//
// Pure function over the shared engine — analyzeBeam is the single source of
// truth, so selection and the on-site calculator never disagree.

import { analyzeBeam, PROFILE_MATERIALS, type MaterialKey, type ShapeId } from "./profile-mechanics";
import { SEED_PROFILE_CATALOG, type CatalogProfile } from "./profile-catalog";

export type SelectInput = {
  matKey: MaterialKey;
  loadType: string; // udl | point-mid | cantilever-point | cantilever-udl
  span: number; // mm
  load: number; // kN/m (distributed) or kN (point)
  deflLimit: number; // span/N denominator
  shapes?: ShapeId[]; // optional shape filter
  topN?: number;
  catalog?: CatalogProfile[];
};

export type SelectCandidate = {
  id: string;
  label: string;
  shape: ShapeId;
  weight_kg_per_m: number;
  /** "published" = F1 vendor 米重; "computed" = engine estimate from geometry. */
  weightSource: "published" | "computed";
  Ix_cm4: number;
  sigma_max_MPa: number;
  stress_util_pct: number;
  deflection_mm: number;
  deflection_ratio: string; // L/x
  passes: boolean;
};

export type SelectResult = {
  passing: SelectCandidate[]; // sorted lightest-first
  lightest: SelectCandidate | null;
  considered: number;
  passingCount: number;
};

const round = (n: number, d = 1) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

export function selectProfile(inp: SelectInput): SelectResult {
  const catalog = inp.catalog ?? SEED_PROFILE_CATALOG;
  const pool = inp.shapes && inp.shapes.length ? catalog.filter((p) => inp.shapes!.includes(p.shape)) : catalog;

  const candidates: SelectCandidate[] = pool.map((p) => {
    const r = analyzeBeam({
      matKey: inp.matKey,
      shape: p.shape,
      h: p.h,
      b: p.b,
      tw: p.tw,
      tf: p.tf,
      loadType: inp.loadType,
      span: inp.span,
      load: inp.load,
      deflLimit: inp.deflLimit,
    });
    // Prefer the vendor-published 米重 when the catalog carries it; the engine
    // weight (r.weightPerM) is only a geometry estimate and can differ from the
    // real pultruded section's mass. Ranking then reflects real published mass.
    const publishedWeight = p.weightPerM;
    return {
      id: p.id,
      label: p.label,
      shape: p.shape,
      weight_kg_per_m: publishedWeight ?? round(r.weightPerM, 2),
      weightSource: publishedWeight != null ? "published" : "computed",
      Ix_cm4: round(r.Ix / 1e4, 1),
      sigma_max_MPa: round(r.sigma_max, 1),
      stress_util_pct: round((r.sigma_max / r.material.sigma) * 100, 0),
      deflection_mm: round(r.defl, 1),
      deflection_ratio: `L/${round(r.deflRatio, 0)}`,
      passes: r.stressOk && r.deflOk,
    };
  });

  const passing = candidates
    .filter((c) => c.passes)
    .sort((a, b) => a.weight_kg_per_m - b.weight_kg_per_m);

  const topN = inp.topN ?? 5;
  return {
    passing: passing.slice(0, topN),
    lightest: passing[0] ?? null,
    considered: pool.length,
    passingCount: passing.length,
  };
}

// Convenience for summaries: material label by key.
export function materialLabel(key: MaterialKey): string {
  return PROFILE_MATERIALS[key]?.label ?? key;
}
