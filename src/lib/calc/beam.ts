/**
 * FRP 型材 梁 受弯核算(T3.1 工程计算器核心)。
 * 纯函数:几何 + 模量 + 跨距 + 载荷工况 → 惯性矩 I、最大弯矩 M、跨中/端部挠度 δ、最大弯曲应力 σ。
 *
 * 单位口径(全部换算到 N / mm 体系):
 *   E: GPa → ×1000 = MPa = N/mm²
 *   均布载荷 w: N/m → ÷1000 = N/mm
 *   集中载荷 P: N
 *   L: mm,I: mm⁴,c: mm → δ: mm,σ: MPa
 *
 * 公式(线弹性、小变形):
 *   简支均布   δ = 5wL⁴/(384EI)   M = wL²/8
 *   简支集中(跨中) δ = PL³/(48EI)  M = PL/4
 *   悬臂均布   δ = wL⁴/(8EI)       M = wL²/2
 *   悬臂集中(端部) δ = PL³/(3EI)   M = PL
 * 应力 σ = M·c/I。
 *
 * 注:复材为各向异性,此处按等效弯曲模量做线弹性快速核算,结果为工程估算;
 * 关键结构请按规范 + 实测层压性能复核。
 */
import type { Geometry } from "@/lib/quote/types";
import { momentOfInertiaMm4, extremeFiberMm } from "@/lib/quote/geometry";

export type SupportCase = "ss_udl" | "ss_point" | "cant_udl" | "cant_point";

export type BeamInput = {
  geometry: Geometry;
  /** 等效弯曲弹性模量 (GPa) */
  modulusGPa: number;
  /** 跨距(简支)或悬臂长 (mm) */
  spanMm: number;
  support: SupportCase;
  /** udl 工况:均布载荷 (N/m);point 工况:集中载荷 (N) */
  load: number;
};

export type BeamResult = {
  supported: boolean;
  iMm4: number;
  iCm4: number;
  cMm: number;
  maxMomentNmm: number;
  deflectionMm: number;
  stressMPa: number;
  /** 跨高比 L/δ(挠度合规常用指标),δ≤0 时为 null */
  spanOverDeflection: number | null;
};

const EMPTY = (i: number, c: number): BeamResult => ({
  supported: false,
  iMm4: i,
  iCm4: Number.isFinite(i) ? i / 1e4 : NaN,
  cMm: c,
  maxMomentNmm: 0,
  deflectionMm: 0,
  stressMPa: 0,
  spanOverDeflection: null,
});

export function computeBeam(input: BeamInput): BeamResult {
  const I = momentOfInertiaMm4(input.geometry);
  const c = extremeFiberMm(input.geometry);
  const E = input.modulusGPa * 1000; // GPa → MPa
  const L = input.spanMm;

  if (!Number.isFinite(I) || I <= 0 || E <= 0 || L <= 0) return EMPTY(I, c);

  const w = input.load / 1000; // N/m → N/mm(均布)
  const P = input.load; // N(集中)
  let delta = 0;
  let M = 0;
  switch (input.support) {
    case "ss_udl":
      delta = (5 * w * Math.pow(L, 4)) / (384 * E * I);
      M = (w * L * L) / 8;
      break;
    case "ss_point":
      delta = (P * Math.pow(L, 3)) / (48 * E * I);
      M = (P * L) / 4;
      break;
    case "cant_udl":
      delta = (w * Math.pow(L, 4)) / (8 * E * I);
      M = (w * L * L) / 2;
      break;
    case "cant_point":
      delta = (P * Math.pow(L, 3)) / (3 * E * I);
      M = P * L;
      break;
  }

  const sigma = (M * c) / I;
  return {
    supported: true,
    iMm4: I,
    iCm4: I / 1e4,
    cMm: c,
    maxMomentNmm: M,
    deflectionMm: delta,
    stressMPa: sigma,
    spanOverDeflection: delta > 0 ? L / delta : null,
  };
}
