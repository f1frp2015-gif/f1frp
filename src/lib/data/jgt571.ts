// JG/T 571-2019《玻纤增强聚氨酯节能门窗》附录 C（资料性附录）整窗传热配置表
// 表 C.1 整窗传热配置（框玻比为 30:70）
//
// Authoritative source-of-truth for the FRP (GFRP-PU) window U-value
// calculator AND the AI `window_u_value` tool. Values are transcribed
// verbatim from the published industry standard JG/T 571-2019, Appendix C,
// Table C.1. Where the table lists two values "x/y", the first is air-filled
// (A) and the second argon-filled (Ar). Single values apply to the gas named
// in the glass spec.
//
//   Uf  = 框传热系数 (frame U-value), fixed per series.
//   Ug  = 玻璃传热系数 (glass U-value), {air, ar}.
//   Uw  = 整窗传热系数 (whole-window U-value) at 框玻比 30:70, casement,
//         profile cavity filled with qualifying foam (注3 baseline), {air, ar}.
//
// Adjustment notes (表 C.1 注):
//   注1  线传热系数 Ψ: 普通玻璃 0.04, Low-E 0.06 W/(m·K);
//        暖边 两玻单腔 0.04 (表值 -0.1), 三玻两腔 0.03 (表值 -0.15) — 暖边行已含此修正。
//   注2  玻纤增强聚氨酯材料导热系数约 0.36 W/(m·K).
//   注3  型材腔体未填充 λ≤0.033 泡沫 → 整窗传热系数 +0.15 W/(m²·K).
//   注4  推拉门窗 → 整窗传热系数在表值基础上 +0.3 W/(m²·K).
//   注5  表中 Low-E 玻璃均为高透玻璃。

export type Gas = "air" | "ar";

export type GlassRow = {
  /** Glass spec string, identical in both locales (e.g. "5Low-E+12A/Ar+5"). */
  glass: string;
  /** Number of panes: 2 = 双玻单腔, 3 = 三玻两腔. */
  panes: 2 | 3;
  /** Whether the build uses Low-E coating(s). */
  lowE: boolean;
  /** 暖边间隔条 (warm-edge spacer) build. */
  warmEdge?: boolean;
  /** When the spec pins the fill gas (e.g. "…15Ar…"), lock the gas toggle. */
  gasFixed?: Gas;
  /** 玻璃传热系数 W/(m²·K). */
  Ug: { air: number; ar: number };
  /** 整窗传热系数 W/(m²·K) — table baseline (30:70, casement, foam-filled). */
  Uw: { air: number; ar: number };
};

export type Series = {
  /** Profile series, e.g. 65 → "65 平开窗系列". */
  series: number;
  /** 框传热系数 Uf W/(m²·K). */
  Uf: number;
  rows: GlassRow[];
};

// Helper for single-value (gas-fixed) rows where air === ar.
const one = (v: number) => ({ air: v, ar: v });

export const JGT571_APPENDIX_C: Series[] = [
  {
    series: 55,
    Uf: 1.4,
    rows: [
      { glass: "5+15Ar+5", panes: 2, lowE: false, gasFixed: "ar", Ug: one(2.6), Uw: one(2.4) },
      { glass: "5Low-E+12A/Ar+5", panes: 2, lowE: true, Ug: { air: 1.9, ar: 1.7 }, Uw: { air: 2.0, ar: 1.8 } },
      { glass: "5+9A/Ar+5+9A/Ar+5", panes: 3, lowE: false, Ug: { air: 2.0, ar: 1.8 }, Uw: { air: 2.0, ar: 1.8 } },
      { glass: "5Low-E+9A/Ar+5+9A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.5, ar: 1.3 }, Uw: { air: 1.7, ar: 1.5 } },
    ],
  },
  {
    series: 60,
    Uf: 1.3,
    rows: [
      { glass: "5+12Ar+5", panes: 2, lowE: false, gasFixed: "ar", Ug: one(2.7), Uw: one(2.4) },
      { glass: "5+15Ar+5", panes: 2, lowE: false, gasFixed: "ar", Ug: one(2.6), Uw: one(2.3) },
      { glass: "5Low-E+12A/Ar+5", panes: 2, lowE: true, Ug: { air: 1.9, ar: 1.7 }, Uw: { air: 1.9, ar: 1.8 } },
      { glass: "5+9A/Ar+5+9A/Ar+5", panes: 3, lowE: false, Ug: { air: 2.0, ar: 1.8 }, Uw: { air: 1.9, ar: 1.8 } },
      { glass: "5Low-E+9A/Ar+5+9A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.5, ar: 1.3 }, Uw: { air: 1.7, ar: 1.5 } },
      { glass: "5Low-E+9A/Ar+5Low-E+9A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.1, ar: 1.0 }, Uw: { air: 1.4, ar: 1.3 } },
    ],
  },
  {
    series: 65,
    Uf: 1.2,
    rows: [
      { glass: "5+15Ar+5", panes: 2, lowE: false, gasFixed: "ar", Ug: one(2.6), Uw: one(2.3) },
      { glass: "5Low-E+12A/Ar+5", panes: 2, lowE: true, Ug: { air: 1.9, ar: 1.7 }, Uw: { air: 1.9, ar: 1.8 } },
      { glass: "5+9A/Ar+5+9A/Ar+5", panes: 3, lowE: false, Ug: { air: 1.9, ar: 1.8 }, Uw: { air: 1.9, ar: 1.8 } },
      { glass: "5Low-E+9A/Ar+5+9A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.5, ar: 1.3 }, Uw: { air: 1.6, ar: 1.5 } },
      { glass: "5Low-E+9A/Ar+5Low-E+9A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.1, ar: 1.0 }, Uw: { air: 1.35, ar: 1.3 } },
      { glass: "5+12A/Ar+5+12A/Ar+5", panes: 3, lowE: false, Ug: { air: 1.9, ar: 1.7 }, Uw: { air: 1.9, ar: 1.8 } },
      { glass: "5Low-E+12A/Ar+5+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.3, ar: 1.2 }, Uw: { air: 1.5, ar: 1.4 } },
      { glass: "5Low-E+12A/Ar+5Low-E+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.0, ar: 0.9 }, Uw: { air: 1.3, ar: 1.2 } },
    ],
  },
  {
    series: 70,
    Uf: 1.1,
    rows: [
      { glass: "5+12A/Ar+5+12A/Ar+5", panes: 3, lowE: false, Ug: { air: 1.9, ar: 1.7 }, Uw: { air: 1.8, ar: 1.7 } },
      { glass: "5Low-E+12A/Ar+5+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.3, ar: 1.2 }, Uw: { air: 1.5, ar: 1.4 } },
      { glass: "5Low-E+12A/Ar+5Low-E+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.0, ar: 0.9 }, Uw: { air: 1.3, ar: 1.2 } },
    ],
  },
  {
    series: 75,
    Uf: 1.0,
    rows: [
      { glass: "5+12A/Ar+5+12A/Ar+5", panes: 3, lowE: false, Ug: { air: 1.9, ar: 1.7 }, Uw: { air: 1.8, ar: 1.6 } },
      { glass: "5Low-E+12A/Ar+5+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.3, ar: 1.2 }, Uw: { air: 1.4, ar: 1.3 } },
      { glass: "5Low-E+12A/Ar+5Low-E+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.0, ar: 0.9 }, Uw: { air: 1.2, ar: 1.1 } },
      { glass: "5Low-E+15A/Ar+5+15A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.2, ar: 1.1 }, Uw: { air: 1.4, ar: 1.3 } },
      { glass: "5Low-E+15A/Ar+5Low-E+15A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.2, ar: 1.1 } },
    ],
  },
  {
    series: 80,
    Uf: 0.95,
    rows: [
      { glass: "5Low-E+12A/Ar+5+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.3, ar: 1.2 }, Uw: { air: 1.5, ar: 1.4 } },
      { glass: "5Low-E+12A/Ar+5Low-E+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.0, ar: 0.9 }, Uw: { air: 1.2, ar: 1.1 } },
      { glass: "5Low-E+15A/Ar+5+15A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.2, ar: 1.1 }, Uw: { air: 1.4, ar: 1.3 } },
      { glass: "5Low-E+15A/Ar+5Low-E+15A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.2, ar: 1.1 } },
    ],
  },
  {
    series: 85,
    Uf: 0.9,
    rows: [
      { glass: "5Low-E+12A/Ar+5+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.3, ar: 1.2 }, Uw: { air: 1.4, ar: 1.3 } },
      { glass: "5Low-E+12A/Ar+5Low-E+12A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.0, ar: 0.9 }, Uw: { air: 1.2, ar: 1.1 } },
      { glass: "5Low-E+12A/Ar暖边+5Low-E+12A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 1.0, ar: 0.9 }, Uw: { air: 1.05, ar: 0.95 } },
      { glass: "5Low-E+16A/Ar+5+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.2, ar: 1.1 }, Uw: { air: 1.35, ar: 1.3 } },
      { glass: "5Low-E+16A/Ar+5Low-E+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.15, ar: 1.05 } },
      { glass: "5Low-E+16A/Ar暖边+5Low-E+16A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.0, ar: 0.9 } },
    ],
  },
  {
    series: 90,
    Uf: 0.85,
    rows: [
      { glass: "5Low-E+16A/Ar+5+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.2, ar: 1.1 }, Uw: { air: 1.35, ar: 1.3 } },
      { glass: "5Low-E+16A/Ar+5Low-E+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.1, ar: 1.05 } },
      { glass: "5Low-E+16A/Ar暖边+5Low-E+16A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.0, ar: 0.9 } },
      { glass: "5Low-E+18A/Ar+5+18A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.15, ar: 1.05 }, Uw: { air: 1.3, ar: 1.2 } },
      { glass: "5Low-E+18A/Ar+5Low-E+18A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.85, ar: 0.7 }, Uw: { air: 1.1, ar: 1.0 } },
      { glass: "5Low-E+18A/Ar暖边+5Low-E+18A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.85, ar: 0.7 }, Uw: { air: 0.95, ar: 0.85 } },
    ],
  },
  {
    series: 95,
    Uf: 0.8,
    rows: [
      { glass: "5Low-E+16A/Ar+5+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.2, ar: 1.1 }, Uw: { air: 1.3, ar: 1.25 } },
      { glass: "5Low-E+16A/Ar+5Low-E+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.1, ar: 1.05 } },
      { glass: "5Low-E+16A/Ar暖边+5Low-E+16A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 0.95, ar: 0.9 } },
      { glass: "5Low-E+18A/Ar+5+18A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.15, ar: 1.05 }, Uw: { air: 1.3, ar: 1.2 } },
      { glass: "5Low-E+18A/Ar+5Low-E+18A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.85, ar: 0.7 }, Uw: { air: 1.05, ar: 0.95 } },
      { glass: "5Low-E+18A/Ar暖边+5Low-E+18A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.85, ar: 0.7 }, Uw: { air: 0.9, ar: 0.8 } },
    ],
  },
  {
    series: 100,
    Uf: 0.75,
    rows: [
      { glass: "5Low-E+16A/Ar+5+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.2, ar: 1.1 }, Uw: { air: 1.25, ar: 1.15 } },
      { glass: "5Low-E+16A/Ar+5Low-E+16A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 1.1, ar: 1.0 } },
      { glass: "5Low-E+16A/Ar暖边+5Low-E+16A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.9, ar: 0.8 }, Uw: { air: 0.95, ar: 0.85 } },
      { glass: "5Low-E+18A/Ar+5+18A/Ar+5", panes: 3, lowE: true, Ug: { air: 1.15, ar: 1.05 }, Uw: { air: 1.25, ar: 1.2 } },
      { glass: "5Low-E+18A/Ar+5Low-E+18A/Ar+5", panes: 3, lowE: true, Ug: { air: 0.85, ar: 0.7 }, Uw: { air: 1.05, ar: 0.95 } },
      { glass: "5Low-E+18A/Ar暖边+5Low-E+18A/Ar暖边+5", panes: 3, lowE: true, warmEdge: true, Ug: { air: 0.85, ar: 0.7 }, Uw: { air: 0.9, ar: 0.8 } },
    ],
  },
];

// 注2 玻纤增强聚氨酯材料导热系数 W/(m·K)
export const FRP_LAMBDA = 0.36;
// 注3 腔体未填充合格保温泡沫的整窗传热系数惩罚 W/(m²·K)
export const FOAM_PENALTY = 0.15;
// 注4 推拉门窗整窗传热系数惩罚 W/(m²·K)
export const SLIDING_PENALTY = 0.3;
// 注1 窗框与玻璃结合处线传热系数 Ψ W/(m·K)
export const PSI = {
  normal: 0.04, // 普通玻璃
  lowE: 0.06, // Low-E 玻璃
  warmDouble: 0.04, // 暖边 两玻单腔
  warmTriple: 0.03, // 暖边 三玻两腔
} as const;

// 对比框材典型框传热系数 Uf W/(m²·K)（行业参考值，非 571 数据）+ 材料导热系数 λ。
export const COMPARISON_FRAMES = [
  { id: "alu-no-break", Uf: 5.9, lambda: 160, thermalBreak: false },
  { id: "alu-break", Uf: 3.2, lambda: 160, thermalBreak: true },
  { id: "pvc", Uf: 1.5, lambda: 0.17, thermalBreak: false },
  { id: "timber", Uf: 1.4, lambda: 0.13, thermalBreak: false },
] as const;

// 线传热系数 Ψ by glass build, per 注1.
export function psiFor(row: { lowE: boolean; warmEdge?: boolean; panes: 2 | 3 }): number {
  if (row.warmEdge) return row.panes === 3 ? PSI.warmTriple : PSI.warmDouble;
  return row.lowE ? PSI.lowE : PSI.normal;
}

// 建筑外门窗保温性能分级 (GB/T 31433-2015 / 检测 GB/T 8484-2020), 10 级.
// JG/T 571-2019 要求门窗保温性能不应低于 6 级 (Uw < 2.5).
export function thermalGrade(Uw: number): number {
  if (Uw < 1.1) return 10;
  if (Uw < 1.3) return 9;
  if (Uw < 1.6) return 8;
  if (Uw < 2.0) return 7;
  if (Uw < 2.5) return 6;
  if (Uw < 3.0) return 5;
  if (Uw < 3.5) return 4;
  if (Uw < 4.0) return 3;
  if (Uw < 5.0) return 2;
  return 1;
}

export const JGT571_MIN_GRADE = 6; // 571 §6: 保温性能 ≥ 6 级

// ── Lookup for the AI `window_u_value` tool ───────────────────────────────
// Pure, deterministic table lookup so the model reports exact standard values
// instead of hallucinating. Returns structured data; the model phrases the
// answer in the user's language.

export type WindowConfigResult = {
  glass: string;
  panes: 2 | 3;
  lowE: boolean;
  warmEdge: boolean;
  gas: Gas;
  Ug: number;
  /** Casement, foam-filled baseline Uw (table value). */
  Uw: number;
  /** Uw if sliding (+0.3, 注4). */
  UwSliding: number;
  /** Uw if profile cavity NOT foam-filled (+0.15, 注3). */
  UwUnfilled: number;
  grade: number;
  meets571: boolean;
  /**
   * Atomic, copy-ready line binding THIS glass spec to ITS exact figures, so
   * the model reproduces values without swapping them between similar builds.
   */
  summary: string;
};

export function lookupWindowUValue(opts: {
  series?: number;
  gas?: Gas;
  glassQuery?: string;
}): {
  standard: string;
  minGrade: number;
  adjustments: { slidingNote4: number; unfilledFoamNote3: number };
  results: { series: number; Uf: number; configs: WindowConfigResult[] }[];
  seriesSummary?: { series: number; Uf: number; bestUw: number }[];
} {
  const gas: Gas = opts.gas === "air" ? "air" : "ar";
  const q = opts.glassQuery?.trim().toLowerCase() ?? "";

  const matchRow = (r: GlassRow): boolean => {
    if (!q) return true;
    const hay = r.glass.toLowerCase();
    if (hay.includes(q)) return true;
    // keyword fallbacks
    if ((q.includes("low-e") || q.includes("lowe") || q.includes("低辐射")) && r.lowE) return true;
    if ((q.includes("三玻") || q.includes("triple") || q.includes("两腔")) && r.panes === 3) return true;
    if ((q.includes("双玻") || q.includes("double") || q.includes("单腔")) && r.panes === 2) return true;
    if ((q.includes("暖边") || q.includes("warm")) && r.warmEdge) return true;
    return false;
  };

  const toResult = (r: GlassRow, effGas: Gas): WindowConfigResult => {
    const base = r.Uw[effGas];
    const sliding = Math.round((base + SLIDING_PENALTY) * 100) / 100;
    const unfilled = Math.round((base + FOAM_PENALTY) * 100) / 100;
    const g = thermalGrade(base);
    const gasLabel = effGas === "ar" ? "argon/氩气" : "air/空气";
    return {
      glass: r.glass,
      panes: r.panes,
      lowE: r.lowE,
      warmEdge: !!r.warmEdge,
      gas: effGas,
      Ug: r.Ug[effGas],
      Uw: base,
      UwSliding: sliding,
      UwUnfilled: unfilled,
      grade: g,
      meets571: g >= JGT571_MIN_GRADE,
      summary: `${r.glass} → Uw ${base.toFixed(2)} W/m²K (casement/平开, ${gasLabel}), grade/保温 ${g}级${g >= JGT571_MIN_GRADE ? "" : " (below 571 min)"}; sliding/推拉 +0.3 → ${sliding.toFixed(2)} (grade ${thermalGrade(sliding)}级); cavity-unfilled/未填充泡沫 +0.15 → ${unfilled.toFixed(2)} (grade ${thermalGrade(unfilled)}级)`,
    };
  };

  const seriesList = opts.series
    ? JGT571_APPENDIX_C.filter((s) => s.series === opts.series)
    : JGT571_APPENDIX_C;

  const results = seriesList.map((s) => {
    let rows = s.rows.filter(matchRow);
    if (rows.length === 0) rows = s.rows; // fall back to all rows on no match
    return {
      series: s.series,
      Uf: s.Uf,
      configs: rows.map((r) => toResult(r, r.gasFixed ?? gas)),
    };
  });

  return {
    standard: "JG/T 571-2019《玻纤增强聚氨酯节能门窗》附录C 表C.1 整窗传热配置表（框玻比 30:70）",
    minGrade: JGT571_MIN_GRADE,
    adjustments: { slidingNote4: SLIDING_PENALTY, unfilledFoamNote3: FOAM_PENALTY },
    results,
    // When no series specified, also hand the model a quick Uf overview.
    ...(opts.series
      ? {}
      : {
          seriesSummary: JGT571_APPENDIX_C.map((s) => ({
            series: s.series,
            Uf: s.Uf,
            bestUw: Math.min(...s.rows.map((r) => r.Uw.ar)),
          })),
        }),
  };
}
