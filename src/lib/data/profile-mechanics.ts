// Shared profile mechanics — single source of truth for both the on-site
// /tech/calculator UI and the AI `profile_mechanics` tool, mirroring how
// jgt571.ts backs both the U-value calculator and its tool. The AI and the
// calculator must never disagree, so the geometry/beam/equivalence math lives
// here and both callers import it.
//
// Units: dims in mm, span in mm, distributed load in kN/m, point load in kN,
// E in GPa, σ in MPa, ρ in g/cm³. Derived: Ix mm⁴, Wx mm³, M N·mm, σ MPa,
// deflection mm, weight kg/m.

export type ProfileMaterial = {
  label: string;
  labelEn: string;
  E: number; // GPa
  sigma: number; // MPa (allowable / characteristic bending strength)
  density: number; // g/cm³
  group: "FRP" | "Metal";
};

export const PROFILE_MATERIALS: Record<string, ProfileMaterial> = {
  "frp-e17": { label: "FRP EN 13706 E17", labelEn: "FRP EN 13706 E17", E: 17, sigma: 170, density: 1.9, group: "FRP" },
  "frp-e23": { label: "FRP EN 13706 E23", labelEn: "FRP EN 13706 E23", E: 23, sigma: 240, density: 1.9, group: "FRP" },
  "frp-standard": { label: "FRP ASCE 标准级", labelEn: "FRP ASCE Standard", E: 17.2, sigma: 207, density: 1.8, group: "FRP" },
  "frp-high": { label: "FRP ASCE 高性能级", labelEn: "FRP ASCE High-performance", E: 27.6, sigma: 345, density: 1.9, group: "FRP" },
  "frp-gb-i": { label: "FRP GB/T 31539 I级", labelEn: "FRP GB/T 31539 Class I", E: 20, sigma: 200, density: 1.9, group: "FRP" },
  "frp-gb-ii": { label: "FRP GB/T 31539 II级", labelEn: "FRP GB/T 31539 Class II", E: 15, sigma: 150, density: 1.8, group: "FRP" },
  "steel-s235": { label: "钢材 S235 (EN 10025)", labelEn: "Steel S235 (EN 10025)", E: 210, sigma: 235, density: 7.85, group: "Metal" },
  "steel-s355": { label: "钢材 S355 (EN 10025)", labelEn: "Steel S355 (EN 10025)", E: 210, sigma: 355, density: 7.85, group: "Metal" },
  "steel-q235": { label: "钢材 Q235 (GB/T 700)", labelEn: "Steel Q235 (GB/T 700)", E: 206, sigma: 235, density: 7.85, group: "Metal" },
  "steel-q345": { label: "钢材 Q345 (GB/T 1591)", labelEn: "Steel Q345 (GB/T 1591)", E: 206, sigma: 345, density: 7.85, group: "Metal" },
  "alu-6061": { label: "铝合金 6061-T6", labelEn: "Aluminum 6061-T6", E: 69, sigma: 276, density: 2.7, group: "Metal" },
  "alu-6063": { label: "铝合金 6063-T5", labelEn: "Aluminum 6063-T5", E: 69, sigma: 186, density: 2.7, group: "Metal" },
};

export type MaterialKey = keyof typeof PROFILE_MATERIALS;
export const MATERIAL_KEYS = Object.keys(PROFILE_MATERIALS) as MaterialKey[];
export const FRP_KEYS = MATERIAL_KEYS.filter((k) => PROFILE_MATERIALS[k].group === "FRP");
export const METAL_KEYS = MATERIAL_KEYS.filter((k) => PROFILE_MATERIALS[k].group === "Metal");

export const LOAD_TYPES = [
  { id: "udl", label: "均布荷载 (UDL)", labelEn: "Uniformly distributed load (UDL)", factor_M: 1 / 8, factor_d: 5 / 384 },
  { id: "point-mid", label: "跨中集中荷载", labelEn: "Mid-span point load", factor_M: 1 / 4, factor_d: 1 / 48 },
  { id: "cantilever-point", label: "悬臂梁 — 端部集中荷载", labelEn: "Cantilever — end point load", factor_M: 1, factor_d: 1 / 3 },
  { id: "cantilever-udl", label: "悬臂梁 — 均布荷载", labelEn: "Cantilever — UDL", factor_M: 1 / 2, factor_d: 1 / 8 },
] as const;

export type LoadTypeId = (typeof LOAD_TYPES)[number]["id"];

export const PROFILE_SHAPES = [
  { id: "i-beam", label: "工字型 (I-Beam)", labelEn: "I-beam" },
  { id: "channel", label: "槽型 (Channel)", labelEn: "Channel" },
  { id: "angle", label: "角型 (L-Profile)", labelEn: "L-profile (angle)" },
  { id: "square-tube", label: "方管 / 矩形管", labelEn: "Square / rectangular tube" },
  { id: "round-tube", label: "圆管", labelEn: "Round tube" },
] as const;

export type ShapeId = (typeof PROFILE_SHAPES)[number]["id"];

// Second moment of area about the strong axis (mm⁴).
export function calcIx(shape: string, h: number, b: number, tw: number, tf: number): number {
  if (shape === "i-beam" || shape === "channel") {
    return (b * h ** 3 - (b - tw) * (h - 2 * tf) ** 3) / 12;
  }
  if (shape === "angle") {
    const t = tw;
    const yBar = (h * t * h / 2 + (b - t) * t * t / 2) / (h * t + (b - t) * t);
    const Iv = (t * h ** 3) / 12 + h * t * (h / 2 - yBar) ** 2;
    const Ih = ((b - t) * t ** 3) / 12 + (b - t) * t * (yBar - t / 2) ** 2;
    return Iv + Ih;
  }
  if (shape === "square-tube") {
    return (b * h ** 3 - (b - 2 * tw) * (h - 2 * tw) ** 3) / 12;
  }
  if (shape === "round-tube") {
    const Ro = h / 2;
    const Ri = Ro - tw;
    return (Math.PI / 4) * (Ro ** 4 - Ri ** 4);
  }
  return 0;
}

// Section modulus (mm³).
export function calcWx(Ix: number, h: number, shape?: string, b?: number, tw?: number): number {
  if (shape === "angle" && b && tw) {
    const t = tw;
    const yBar = (h * t * h / 2 + (b - t) * t * t / 2) / (h * t + (b - t) * t);
    const maxDist = Math.max(yBar, h - yBar);
    return Ix / maxDist;
  }
  return Ix / (h / 2);
}

// Cross-sectional area (mm²).
export function calcArea(shape: string, h: number, b: number, tw: number, tf: number): number {
  if (shape === "i-beam" || shape === "channel") return 2 * b * tf + (h - 2 * tf) * tw;
  if (shape === "angle") return h * tw + (b - tw) * tw;
  if (shape === "square-tube") return b * h - (b - 2 * tw) * (h - 2 * tw);
  if (shape === "round-tube") {
    const Ro = h / 2;
    const Ri = Ro - tw;
    return Math.PI * (Ro ** 2 - Ri ** 2);
  }
  return 0;
}

export type BeamInput = {
  matKey: string;
  shape: string;
  h: number;
  b: number;
  tw: number;
  tf: number;
  loadType: string;
  span: number; // mm
  load: number; // kN/m (distributed) or kN (point)
  deflLimit: number; // span/N denominator, e.g. 250
};

export type BeamResult = {
  material: ProfileMaterial;
  Ix: number;
  Wx: number;
  area: number;
  isDistributed: boolean;
  totalForce: number; // kN
  M_max: number; // N·mm
  sigma_max: number; // MPa
  defl: number; // mm
  deflRatio: number; // span / defl
  weightPerM: number; // kg/m
  stressOk: boolean;
  deflOk: boolean;
};

// Single-span / cantilever beam check. Formulas are kept identical to the UI
// calculator (this is the shared implementation both call).
export function analyzeBeam(inp: BeamInput): BeamResult {
  const material = PROFILE_MATERIALS[inp.matKey] ?? PROFILE_MATERIALS["frp-e23"];
  const lt = LOAD_TYPES.find((l) => l.id === inp.loadType) ?? LOAD_TYPES[0];
  const Ix = calcIx(inp.shape, inp.h, inp.b, inp.tw, inp.tf);
  const Wx = calcWx(Ix, inp.h, inp.shape, inp.b, inp.tw);
  const area = calcArea(inp.shape, inp.h, inp.b, inp.tw, inp.tf);

  const isDistributed = inp.loadType === "udl" || inp.loadType === "cantilever-udl";
  const totalForce = isDistributed ? inp.load * (inp.span / 1000) : inp.load;
  const M_max = isDistributed
    ? lt.factor_M * inp.load * (inp.span / 1000) * (inp.span / 1000) * 1e6
    : lt.factor_M * inp.load * inp.span * 1000;
  const sigma_max = Wx > 0 ? M_max / Wx : 0;
  const defl = isDistributed
    ? (lt.factor_d * inp.load * inp.span ** 4) / (material.E * 1000 * Ix)
    : (lt.factor_d * inp.load * 1000 * inp.span ** 3) / (material.E * 1000 * Ix);
  const deflRatio = inp.span / (defl || 1);
  const weightPerM = (area / 1e3) * material.density;

  return {
    material,
    Ix,
    Wx,
    area,
    isDistributed,
    totalForce,
    M_max,
    sigma_max,
    defl,
    deflRatio,
    weightPerM,
    stressOk: sigma_max <= material.sigma,
    deflOk: deflRatio >= inp.deflLimit,
  };
}

export type EquivInput = {
  sourceMatKey: string;
  targetMatKey: string;
  shape: string;
  h: number;
  b: number;
  tw: number;
  tf: number;
};

export type EquivResult = {
  srcMat: ProfileMaterial;
  tgtMat: ProfileMaterial;
  srcIx: number;
  srcWx: number;
  srcArea: number;
  reqWx: number;
  reqIx: number;
  stiffnessScale: number;
  strengthScale: number;
  stiffH: number;
  stiffB: number;
  stiffTw: number;
  stiffTf: number;
  strengthH: number;
  strengthB: number;
  strengthTw: number;
  strengthTf: number;
  governingScale: number;
  governingIsStiffness: boolean;
  stiffArea: number;
  strengthArea: number;
  stiffWeight: number;
  strengthWeight: number;
  tgtWeight: number;
  srcWeight: number;
  weightSaving: number; // %
  isAluminumSource: boolean;
};

// Equal-stiffness / equal-strength metal → FRP replacement sizing under
// geometric similarity (I ∝ k⁴, W ∝ k³). The governing criterion is whichever
// demands more material (larger scale factor).
export function equivalence(inp: EquivInput): EquivResult {
  const srcMat = PROFILE_MATERIALS[inp.sourceMatKey] ?? PROFILE_MATERIALS["steel-q235"];
  const tgtMat = PROFILE_MATERIALS[inp.targetMatKey] ?? PROFILE_MATERIALS["frp-gb-i"];
  const srcIx = calcIx(inp.shape, inp.h, inp.b, inp.tw, inp.tf);
  const srcWx = calcWx(srcIx, inp.h, inp.shape, inp.b, inp.tw);
  const srcArea = calcArea(inp.shape, inp.h, inp.b, inp.tw, inp.tf);
  const reqWx = srcWx * (srcMat.sigma / tgtMat.sigma);
  const reqIx = srcIx * (srcMat.E / tgtMat.E);

  const stiffnessScale = Math.pow(srcMat.E / tgtMat.E, 1 / 4);
  const strengthScale = Math.pow(srcMat.sigma / tgtMat.sigma, 1 / 3);

  const stiffH = Math.round(inp.h * stiffnessScale);
  const stiffB = Math.round(inp.b * stiffnessScale);
  const stiffTw = Math.max(1, Math.round(inp.tw * stiffnessScale));
  const stiffTf = Math.max(1, Math.round(inp.tf * stiffnessScale));

  const strengthH = Math.round(inp.h * strengthScale);
  const strengthB = Math.round(inp.b * strengthScale);
  const strengthTw = Math.max(1, Math.round(inp.tw * strengthScale));
  const strengthTf = Math.max(1, Math.round(inp.tf * strengthScale));

  const governingScale = Math.max(stiffnessScale, strengthScale);
  const governingIsStiffness = stiffnessScale >= strengthScale;

  const stiffArea = calcArea(inp.shape, stiffH, stiffB, stiffTw, stiffTf);
  const strengthArea = calcArea(inp.shape, strengthH, strengthB, strengthTw, strengthTf);
  const stiffWeight = (stiffArea / 1e3) * tgtMat.density;
  const strengthWeight = (strengthArea / 1e3) * tgtMat.density;
  const tgtWeight = governingIsStiffness ? stiffWeight : strengthWeight;
  const srcWeight = (srcArea / 1e3) * srcMat.density;
  const weightSaving = srcWeight > 0 ? (1 - tgtWeight / srcWeight) * 100 : 0;

  return {
    srcMat,
    tgtMat,
    srcIx,
    srcWx,
    srcArea,
    reqWx,
    reqIx,
    stiffnessScale,
    strengthScale,
    stiffH,
    stiffB,
    stiffTw,
    stiffTf,
    strengthH,
    strengthB,
    strengthTw,
    strengthTf,
    governingScale,
    governingIsStiffness,
    stiffArea,
    strengthArea,
    stiffWeight,
    strengthWeight,
    tgtWeight,
    srcWeight,
    weightSaving,
    isAluminumSource: inp.sourceMatKey.startsWith("alu-"),
  };
}
