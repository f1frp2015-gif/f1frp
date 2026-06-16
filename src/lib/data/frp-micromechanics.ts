// FRP micromechanics — rule-of-mixtures property estimation + target-driven
// material selection ("目标性能 → 候选 + 估算物性"). This is the Citrine-style
// "retrieval → prediction" upgrade, but kept ENGINEERING-HONEST:
//   - density: rule of mixtures (accurate)
//   - longitudinal modulus E1 = Vf·Ef + (1−Vf)·Em (classic ROM, a 0° upper bound)
//   - longitudinal tensile = Vf·σf·η (0° upper bound; η = process orientation eff.)
//   - service temp / corrosion / cost / conductivity: from the curated tables
// Estimates are INDICATIVE (±, labeled), never a substitute for a datasheet or
// a code design value (EN 13706 / ASCE / GB/T 31539 characteristic values are
// materially lower than ROM 0° ultimates).
//
// Fiber/resin numbers are kept consistent with FIBER_KNOWLEDGE in
// knowledge-extended.ts so the AI's estimates and its prose never diverge.

export type Fiber = {
  label: string;
  Ef: number; // GPa, longitudinal
  strength: number; // MPa, fiber tensile
  density: number; // g/cm³
  maxTempC: number; // fiber survival (resin usually governs)
  corrosion: number; // 1 (poor) – 5 (excellent), in wet/chemical service
  costRel: number; // 1 (cheap) – 5 (expensive), per kg
  conductive: boolean;
  note: string;
};

export const FIBERS: Record<string, Fiber> = {
  "e-glass": { label: "E-玻纤 (E-glass)", Ef: 72, strength: 3400, density: 2.54, maxTempC: 550, corrosion: 3, costRel: 1, conductive: false, note: "性价比最高、电绝缘、产能足" },
  "ecr-glass": { label: "ECR-玻纤 (耐腐蚀)", Ef: 80, strength: 3400, density: 2.62, maxTempC: 550, corrosion: 5, costRel: 2, conductive: false, note: "耐酸比 E-glass 高约 10×，化工防腐首选玻纤" },
  "s-glass": { label: "S-玻纤 (高强)", Ef: 87, strength: 4890, density: 2.49, maxTempC: 650, corrosion: 3, costRel: 4, conductive: false, note: "强度/模量高于 E-glass，成本高" },
  "carbon-t300": { label: "碳纤维 T300 (标模)", Ef: 230, strength: 3530, density: 1.76, maxTempC: 500, corrosion: 5, costRel: 5, conductive: true, note: "比刚度最高、最轻；导电(与金属接触有电偶腐蚀)、价高" },
  "carbon-t700": { label: "碳纤维 T700 (高强)", Ef: 230, strength: 4900, density: 1.8, maxTempC: 500, corrosion: 5, costRel: 5, conductive: true, note: "高强中模、抗疲劳；导电、价高" },
  basalt: { label: "玄武岩纤维 (Basalt)", Ef: 89, strength: 4000, density: 2.67, maxTempC: 700, corrosion: 4, costRel: 3, conductive: false, note: "耐温比玻纤高 ~200°C、耐酸碱、环保" },
  aramid: { label: "芳纶 (Aramid/Kevlar)", Ef: 110, strength: 3300, density: 1.44, maxTempC: 250, corrosion: 4, costRel: 4, conductive: false, note: "抗冲击、最轻；压缩强度低、吸湿、UV 敏感" },
  flax: { label: "亚麻 (Flax, 生物基)", Ef: 50, strength: 700, density: 1.5, maxTempC: 180, corrosion: 2, costRel: 2, conductive: false, note: "可再生、减振、低碳足迹；强度分散、耐温低、吸湿" },
};

export type Resin = {
  label: string;
  Em: number; // GPa
  density: number; // g/cm³
  maxServiceTempC: number; // continuous service (HDT-ish, governs composite)
  corrosion: number; // 1–5
  costRel: number; // 1–5
  note: string;
};

export const RESINS: Record<string, Resin> = {
  "ortho-polyester": { label: "邻苯不饱和聚酯", Em: 3.2, density: 1.1, maxServiceTempC: 70, corrosion: 2, costRel: 1, note: "最便宜、通用，耐蚀/耐温一般" },
  "iso-polyester": { label: "间苯聚酯", Em: 3.4, density: 1.12, maxServiceTempC: 90, corrosion: 3, costRel: 2, note: "耐蚀/耐温优于邻苯，性价比好" },
  vinylester: { label: "乙烯基酯", Em: 3.4, density: 1.1, maxServiceTempC: 110, corrosion: 5, costRel: 3, note: "耐腐蚀/耐温优，化工防腐主力" },
  epoxy: { label: "环氧", Em: 3.5, density: 1.16, maxServiceTempC: 130, corrosion: 4, costRel: 4, note: "力学/粘结/耐疲劳最好，工艺慢、价高" },
  phenolic: { label: "酚醛", Em: 4.0, density: 1.24, maxServiceTempC: 200, corrosion: 3, costRel: 3, note: "阻燃/耐高温/低烟，韧性较差" },
  polyurethane: { label: "聚氨酯 (PU 拉挤)", Em: 3.0, density: 1.15, maxServiceTempC: 120, corrosion: 3, costRel: 3, note: "韧性/抗冲击好，门窗型材常用" },
};

export type Process = {
  label: string;
  vf: number; // representative fiber volume fraction
  orient: number; // 0° orientation efficiency (multi-axial derate vs pure UD)
};

export const PROCESSES: Record<string, Process> = {
  pultrusion: { label: "拉挤 (pultrusion)", vf: 0.6, orient: 0.6 },
  "filament-winding": { label: "缠绕 (filament winding)", vf: 0.65, orient: 0.7 },
  "hand-layup": { label: "手糊 (hand layup)", vf: 0.38, orient: 0.35 },
  rtm: { label: "RTM", vf: 0.5, orient: 0.45 },
  "vacuum-infusion": { label: "真空导入 (infusion)", vf: 0.55, orient: 0.5 },
  smc: { label: "SMC/模压", vf: 0.25, orient: 0.25 },
};

export type LaminateEstimate = {
  density: number; // g/cm³
  E1: number; // GPa, longitudinal (0°), rule of mixtures × orient
  tensile: number; // MPa, longitudinal (0°) upper bound × orient
  maxServiceTempC: number; // resin-governed
  corrosion: number; // min(fiber, resin)
  costRel: number; // weighted fiber/resin cost proxy 1–5
  conductive: boolean;
  vf: number;
};

// Rule-of-mixtures estimate for a fiber/resin system at a process's typical Vf.
export function estimateLaminate(
  fiberKey: string,
  resinKey: string,
  processKey: string,
): LaminateEstimate | null {
  const f = FIBERS[fiberKey];
  const r = RESINS[resinKey];
  const p = PROCESSES[processKey];
  if (!f || !r || !p) return null;
  const vf = p.vf;
  const density = vf * f.density + (1 - vf) * r.density;
  const E1 = (vf * f.Ef + (1 - vf) * r.Em) * p.orient;
  const tensile = vf * f.strength * p.orient; // matrix tensile contribution negligible
  return {
    density: Math.round(density * 1000) / 1000,
    E1: Math.round(E1 * 10) / 10,
    tensile: Math.round(tensile),
    maxServiceTempC: Math.min(f.maxTempC, r.maxServiceTempC),
    corrosion: Math.min(f.corrosion, r.corrosion),
    costRel: Math.round((f.costRel * vf + r.costRel * (1 - vf)) * 10) / 10,
    conductive: f.conductive,
    vf,
  };
}

export type SelectionTargets = {
  process?: string; // default pultrusion (f1frp focus)
  minModulusGPa?: number; // required longitudinal E1
  minTensileMPa?: number; // required longitudinal tensile (0° upper bound)
  maxDensity?: number; // g/cm³ ceiling (weight)
  minServiceTempC?: number; // required continuous service temp
  corrosionService?: boolean; // wet/chemical environment → need ≥4
  electricalInsulation?: boolean; // must be non-conductive
  costSensitive?: boolean; // prefer cheaper systems
};

export type Candidate = {
  fiber: string;
  fiberLabel: string;
  resin: string;
  resinLabel: string;
  process: string;
  processLabel: string;
  estimate: LaminateEstimate;
  score: number; // higher = better fit
  fit: string[]; // human-readable reasons / flags
};

// Score & rank fiber × resin combos at the chosen process against the targets.
// Hard misses (temp, density, corrosion, insulation) are penalized heavily;
// soft preferences (cost, exceeding modulus/strength) nudge the ranking.
export function selectMaterials(targets: SelectionTargets, topN = 4): Candidate[] {
  const processKey = targets.process && PROCESSES[targets.process] ? targets.process : "pultrusion";
  const out: Candidate[] = [];

  for (const fiberKey of Object.keys(FIBERS)) {
    for (const resinKey of Object.keys(RESINS)) {
      const est = estimateLaminate(fiberKey, resinKey, processKey);
      if (!est) continue;
      let score = 100;
      const fit: string[] = [];

      if (targets.minModulusGPa != null) {
        if (est.E1 >= targets.minModulusGPa) { score += 10; fit.push(`E1≈${est.E1}GPa ≥ 目标 ${targets.minModulusGPa}`); }
        else { score -= (targets.minModulusGPa - est.E1) * 3; fit.push(`E1≈${est.E1}GPa < 目标 ${targets.minModulusGPa}（不足）`); }
      }
      if (targets.minTensileMPa != null) {
        if (est.tensile >= targets.minTensileMPa) { score += 8; fit.push(`拉伸≈${est.tensile}MPa(0°上限) ≥ 目标`); }
        else { score -= (targets.minTensileMPa - est.tensile) * 0.08; fit.push(`拉伸≈${est.tensile}MPa < 目标 ${targets.minTensileMPa}`); }
      }
      if (targets.maxDensity != null) {
        if (est.density <= targets.maxDensity) { score += 8; fit.push(`密度 ${est.density} ≤ 上限 ${targets.maxDensity}`); }
        else { score -= (est.density - targets.maxDensity) * 40; fit.push(`密度 ${est.density} > 上限 ${targets.maxDensity}（超重）`); }
      }
      if (targets.minServiceTempC != null) {
        if (est.maxServiceTempC >= targets.minServiceTempC) { score += 8; fit.push(`耐温 ${est.maxServiceTempC}°C ≥ 要求`); }
        else { score -= 60; fit.push(`耐温 ${est.maxServiceTempC}°C < 要求 ${targets.minServiceTempC}°C（树脂受限）`); }
      }
      if (targets.corrosionService) {
        if (est.corrosion >= 4) { score += 12; fit.push(`耐蚀等级 ${est.corrosion}/5（适合腐蚀环境）`); }
        else { score -= 40; fit.push(`耐蚀等级 ${est.corrosion}/5（腐蚀环境偏弱）`); }
      }
      if (targets.electricalInsulation && est.conductive) { score -= 80; fit.push("导电纤维，不满足电绝缘要求"); }
      if (targets.electricalInsulation && !est.conductive) { fit.push("非导电，满足电绝缘"); }
      // cost: always nudge cheaper; stronger when costSensitive
      score -= est.costRel * (targets.costSensitive ? 6 : 2);

      out.push({
        fiber: fiberKey,
        fiberLabel: FIBERS[fiberKey].label,
        resin: resinKey,
        resinLabel: RESINS[resinKey].label,
        process: processKey,
        processLabel: PROCESSES[processKey].label,
        estimate: est,
        score: Math.round(score * 10) / 10,
        fit,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, topN);
}
