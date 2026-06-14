// 截面几何 — 五种拉挤型材的横截面积 mm² 与单位重量 kg/m。
//
// 复材密度参考(g/cm³,约等于 t/m³):
//   E-glass FRP (拉挤 70% 玻纤含量)  ≈ 1.9
//   ECR-glass FRP                    ≈ 1.95
//   Carbon FRP                       ≈ 1.55
//   Hybrid (示意)                    ≈ 1.7
// 这些值是粗测口径 ±10% 浮动;精算需要按 fiber_content × ρ_fiber + resin × ρ_resin 加权。
// 引擎里我们走加权;此文件只给"按面积 + 体积密度"算重量的纯几何函数。

import type { Geometry, Fiber, Resin } from "./types";

export function crossSectionMm2(g: Geometry): number {
  switch (g.type) {
    case "round": {
      // 实心管 id=0 时,面积 = π R²;空心管 = π(R²-r²)
      const R = g.od / 2;
      const r = g.id / 2;
      return Math.PI * (R * R - r * r);
    }
    case "square": {
      // 等边方管中空截面 = a² - (a-2t)²;若 t*2 >= a 视作实心(返回 a²)
      const inner = Math.max(0, g.side - 2 * g.t);
      return g.side * g.side - inner * inner;
    }
    case "rect": {
      const innerW = Math.max(0, g.w - 2 * g.t);
      const innerH = Math.max(0, g.h - 2 * g.t);
      return g.w * g.h - innerW * innerH;
    }
    case "angle": {
      // 等边 L 角铁:两条腿宽度 t,扣掉重叠的 t × t
      return 2 * g.leg * g.t - g.t * g.t;
    }
    case "channel": {
      // U 型槽钢:一条腹板(高 h × t)+ 两条翼缘((w-t) × t),近似公式
      const flange = Math.max(0, g.w - g.t) * g.t;
      return g.h * g.t + 2 * flange;
    }
    case "i_beam": {
      // 工字梁:两条翼缘(bf × tf 各一)+ 一条腹板(高 = h - 2×tf,宽 tw)
      // 翼缘与腹板交界处的"角"算在翼缘里,不重复扣除(粗测口径)
      const webHeight = Math.max(0, g.h - 2 * g.tf);
      return 2 * g.bf * g.tf + webHeight * g.tw;
    }
    case "custom":
      return g.area_mm2;
  }
}

// 复材体积密度 g/cm³ — 这是简化模型:
//   ρ_composite = Vf × ρ_fiber + (1-Vf) × ρ_resin
// 体积分数 Vf 从 fiber_content_pct 取,缺省 70%。
export const FIBER_DENSITY: Record<Fiber, number> = {
  e_glass: 2.55,
  ecr_glass: 2.62,
  carbon: 1.78,
  hybrid: 2.20,  // 玻 + 碳 平均;实际跟混编比有关
};

export const RESIN_DENSITY: Record<Resin, number> = {
  up: 1.18,        // 不饱和聚酯
  epoxy: 1.20,     // 环氧
  ve: 1.12,        // 乙烯基酯
  phenolic: 1.30,
  pu: 1.15,        // 聚氨酯
};

export function compositeDensityGcm3(
  fiber: Fiber,
  resin: Resin,
  fiberContentPct = 70,
): number {
  const vf = Math.max(0.4, Math.min(0.85, fiberContentPct / 100));
  return vf * FIBER_DENSITY[fiber] + (1 - vf) * RESIN_DENSITY[resin];
}

// 外周长 mm — 用于表面毡 / UV 涂层等"按表面积摊"的成本项。
// 粗测口径,角铁 / 工字梁等开口型材按外露面总长简化估计。
export function outerPerimeterMm(g: Geometry): number {
  switch (g.type) {
    case "round":   return Math.PI * g.od;
    case "square":  return 4 * g.side;
    case "rect":    return 2 * (g.w + g.h);
    case "angle":   return 4 * g.leg; // L 形展开 ≈ 4 × leg (含 t 端面;粗测忽略)
    case "channel": return 2 * (g.w + g.h);
    case "i_beam":  return 4 * g.bf - 2 * g.tw + 2 * g.h; // 工字展开外周(含腹板两侧 + 翼缘上下)
    case "custom":  return g.outer_perim_mm;
  }
}

// 闭口型材内周长 mm — 用于内毡 / 防腐内层。开口型材返回 0(没"内"概念)。
export function innerPerimeterMm(g: Geometry): number {
  switch (g.type) {
    case "round":   return g.id > 0 ? Math.PI * g.id : 0;
    case "square": {
      const inner = Math.max(0, g.side - 2 * g.t);
      return inner > 0 ? 4 * inner : 0;
    }
    case "rect": {
      const innerW = Math.max(0, g.w - 2 * g.t);
      const innerH = Math.max(0, g.h - 2 * g.t);
      return innerW > 0 && innerH > 0 ? 2 * (innerW + innerH) : 0;
    }
    case "angle":
    case "channel":
    case "i_beam":
      return 0;
    case "custom":
      return g.inner_perim_mm; // 用户自己负责语义;开口异形填 0
  }
}

// kg/m = mm² × m × ρ(g/cm³)
// 单位换算:mm² × 1000mm × (g/cm³) = mm² × 1000mm × g / 1000mm³
//        = mm² × g / mm² = g/m × (其实是 mm³/m × g/mm³)
// 简化:面积 mm² × 1mm 长度 = mm³;1mm³ × g/cm³ = 1e-3 g;1m 长 × 1mm² → 1000 mm³ → 1000e-3 × ρ g
//      所以 kg/m = area_mm2 × ρ_gcm3 × 1e-3 (因为 g/m × 1e-3 = kg/m;1e-3 from mm³→cm³)
export function weightKgPerMeter(
  g: Geometry,
  fiber: Fiber,
  resin: Resin,
  fiberContentPct = 70,
): number {
  const area = crossSectionMm2(g);
  const rho = compositeDensityGcm3(fiber, resin, fiberContentPct);
  // 1 m = 1000 mm;面积 area mm² × 长度 1000 mm = 1000 area mm³ = (1000 area / 1000) cm³ = area cm³
  // 重量 = area cm³ × rho g/cm³ = area × rho g = area × rho / 1000 kg
  return (area * rho) / 1000;
}

// 抗弯惯性矩 I (mm⁴, 关于水平弯曲中性轴 / 强轴)。
// 精确支持对称截面:圆管 / 方管 / 矩管 / 工字梁。
// 角钢 / 槽钢(质心偏置、需主轴)与 custom 暂返回 NaN —— 计算器 v1 不暴露这几类。
export function momentOfInertiaMm4(g: Geometry): number {
  switch (g.type) {
    case "round":
      return (Math.PI * (Math.pow(g.od, 4) - Math.pow(g.id, 4))) / 64;
    case "square": {
      const inner = Math.max(0, g.side - 2 * g.t);
      return (Math.pow(g.side, 4) - Math.pow(inner, 4)) / 12;
    }
    case "rect": {
      // h 为高度方向(弯曲绕 x 轴)
      const innerW = Math.max(0, g.w - 2 * g.t);
      const innerH = Math.max(0, g.h - 2 * g.t);
      return (g.w * Math.pow(g.h, 3) - innerW * Math.pow(innerH, 3)) / 12;
    }
    case "i_beam": {
      // 强轴:外接矩形 bf×h 扣两侧腹板空腔 (bf-tw)×(h-2tf)
      const webGap = Math.max(0, g.h - 2 * g.tf);
      return (g.bf * Math.pow(g.h, 3) - (g.bf - g.tw) * Math.pow(webGap, 3)) / 12;
    }
    case "angle":
    case "channel":
    case "custom":
      return NaN;
  }
}

// 极端纤维到中性轴距离 c (mm),用于弯曲应力 σ = M·c / I。
export function extremeFiberMm(g: Geometry): number {
  switch (g.type) {
    case "round":
      return g.od / 2;
    case "square":
      return g.side / 2;
    case "rect":
      return g.h / 2;
    case "i_beam":
      return g.h / 2;
    case "angle":
    case "channel":
    case "custom":
      return NaN;
  }
}
