"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const materials: Record<
  string,
  { label: string; E: number; sigma: number; density: number; group: string }
> = {
  "frp-e17": { label: "FRP EN 13706 E17", E: 17, sigma: 170, density: 1.9, group: "FRP" },
  "frp-e23": { label: "FRP EN 13706 E23", E: 23, sigma: 240, density: 1.9, group: "FRP" },
  "frp-standard": { label: "FRP ASCE 标准级", E: 17.2, sigma: 207, density: 1.8, group: "FRP" },
  "frp-high": { label: "FRP ASCE 高性能级", E: 27.6, sigma: 345, density: 1.9, group: "FRP" },
  "frp-gb-i": { label: "FRP GB/T 31539 I级", E: 20, sigma: 200, density: 1.9, group: "FRP" },
  "frp-gb-ii": { label: "FRP GB/T 31539 II级", E: 15, sigma: 150, density: 1.8, group: "FRP" },
  "steel-s235": { label: "钢材 S235 (EN 10025)", E: 210, sigma: 235, density: 7.85, group: "Metal" },
  "steel-s355": { label: "钢材 S355 (EN 10025)", E: 210, sigma: 355, density: 7.85, group: "Metal" },
  "steel-q235": { label: "钢材 Q235 (GB/T 700)", E: 206, sigma: 235, density: 7.85, group: "Metal" },
  "steel-q345": { label: "钢材 Q345 (GB/T 1591)", E: 206, sigma: 345, density: 7.85, group: "Metal" },
  "alu-6061": { label: "铝合金 6061-T6", E: 69, sigma: 276, density: 2.7, group: "Metal" },
  "alu-6063": { label: "铝合金 6063-T5", E: 69, sigma: 186, density: 2.7, group: "Metal" },
};

const loadTypes = [
  { id: "udl", label: "均布荷载 (UDL)", factor_M: 1 / 8, factor_d: 5 / 384 },
  { id: "point-mid", label: "跨中集中荷载", factor_M: 1 / 4, factor_d: 1 / 48 },
  { id: "cantilever-point", label: "悬臂梁 — 端部集中荷载", factor_M: 1, factor_d: 1 / 3 },
  { id: "cantilever-udl", label: "悬臂梁 — 均布荷载", factor_M: 1 / 2, factor_d: 1 / 8 },
];

const profileShapes = [
  { id: "i-beam", label: "工字型 (I-Beam)" },
  { id: "channel", label: "槽型 (Channel)" },
  { id: "angle", label: "角型 (L-Profile)" },
  { id: "square-tube", label: "方管 / 矩形管" },
  { id: "round-tube", label: "圆管" },
];

function calcIx(shape: string, h: number, b: number, tw: number, tf: number): number {
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

function calcWx(Ix: number, h: number, shape?: string, b?: number, tw?: number): number {
  if (shape === "angle" && b && tw) {
    const t = tw;
    const yBar = (h * t * h / 2 + (b - t) * t * t / 2) / (h * t + (b - t) * t);
    const maxDist = Math.max(yBar, h - yBar);
    return Ix / maxDist;
  }
  return Ix / (h / 2);
}

function calcArea(shape: string, h: number, b: number, tw: number, tf: number): number {
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

type Mode = "beam" | "equivalence";

export default function ProfileCalculator() {
  const [mode, setMode] = useState<Mode>("beam");

  const [matKey, setMatKey] = useState("frp-e23");
  const [loadType, setLoadType] = useState("udl");
  const [span, setSpan] = useState(3000);
  const [load, setLoad] = useState(5);
  const [shape, setShape] = useState("i-beam");
  const [dimH, setDimH] = useState(200);
  const [dimB, setDimB] = useState(100);
  const [dimTw, setDimTw] = useState(10);
  const [dimTf, setDimTf] = useState(10);
  const [deflLimit, setDeflLimit] = useState(250);

  const [eqSourceMat, setEqSourceMat] = useState("steel-q235");
  const [eqTargetMat, setEqTargetMat] = useState("frp-gb-i");
  const [eqShape, setEqShape] = useState("i-beam");
  const [eqH, setEqH] = useState(200);
  const [eqB, setEqB] = useState(100);
  const [eqTw, setEqTw] = useState(8);
  const [eqTf, setEqTf] = useState(12);

  const mat = materials[matKey];
  const lt = loadTypes.find((l) => l.id === loadType)!;
  const Ix = calcIx(shape, dimH, dimB, dimTw, dimTf);
  const Wx = calcWx(Ix, dimH, shape, dimB, dimTw);
  const area = calcArea(shape, dimH, dimB, dimTw, dimTf);

  const isDistributed = loadType === "udl" || loadType === "cantilever-udl";
  const totalForce = isDistributed ? load * (span / 1000) : load;
  const M_max = isDistributed
    ? lt.factor_M * load * (span / 1000) * (span / 1000) * 1e6
    : lt.factor_M * load * span * 1000;
  const sigma_max = Wx > 0 ? M_max / Wx : 0;
  const defl = isDistributed
    ? (lt.factor_d * load * span ** 4) / (mat.E * 1000 * Ix)
    : (lt.factor_d * load * 1000 * span ** 3) / (mat.E * 1000 * Ix);
  const deflRatio = span / (defl || 1);
  const weightPerM = (area / 1e6) * mat.density;

  const stressOk = sigma_max <= mat.sigma;
  const deflOk = deflRatio >= deflLimit;

  const srcMat = materials[eqSourceMat];
  const tgtMat = materials[eqTargetMat];
  const srcIx = calcIx(eqShape, eqH, eqB, eqTw, eqTf);
  const srcWx = calcWx(srcIx, eqH, eqShape, eqB, eqTw);
  const srcArea = calcArea(eqShape, eqH, eqB, eqTw, eqTf);
  const reqWx = srcWx * (srcMat.sigma / tgtMat.sigma);
  const reqIx = srcIx * (srcMat.E / tgtMat.E);
  const stiffnessScale = Math.pow(srcMat.E / tgtMat.E, 1 / 3);
  const suggestedH = Math.round(eqH * stiffnessScale);
  const suggestedB = Math.round(eqB * stiffnessScale);
  const srcWeight = (srcArea / 1e6) * srcMat.density;
  const tgtAreaApprox = calcArea(eqShape, suggestedH, suggestedB, Math.round(eqTw * stiffnessScale), Math.round(eqTf * stiffnessScale));
  const tgtWeight = (tgtAreaApprox / 1e6) * tgtMat.density;
  const weightSaving = srcWeight > 0 ? (1 - tgtWeight / srcWeight) * 100 : 0;

  const inputCls = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const selectCls = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <div>
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setMode("beam")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${mode === "beam" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          梁分析
        </button>
        <button
          onClick={() => setMode("equivalence")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${mode === "equivalence" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          钢材 → FRP 等效替换
        </button>
      </div>

      {mode === "beam" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">输入参数</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>材料</label>
                <select value={matKey} onChange={(e) => setMatKey(e.target.value)} className={selectCls}>
                  <optgroup label="FRP — EN 13706">
                    <option value="frp-e17">EN 13706 E17级</option>
                    <option value="frp-e23">EN 13706 E23级</option>
                  </optgroup>
                  <optgroup label="FRP — GB/T 31539-2015">
                    <option value="frp-gb-i">GB/T 31539 I级</option>
                    <option value="frp-gb-ii">GB/T 31539 II级</option>
                  </optgroup>
                  <optgroup label="FRP — ASCE">
                    <option value="frp-standard">ASCE 标准级</option>
                    <option value="frp-high">ASCE 高性能级</option>
                  </optgroup>
                  <optgroup label="钢材 — EN">
                    <option value="steel-s235">S235 (EN 10025)</option>
                    <option value="steel-s355">S355 (EN 10025)</option>
                  </optgroup>
                  <optgroup label="钢材 — 国标">
                    <option value="steel-q235">Q235 (GB/T 700)</option>
                    <option value="steel-q345">Q345 (GB/T 1591)</option>
                  </optgroup>
                  <optgroup label="铝合金">
                    <option value="alu-6061">6061-T6</option>
                    <option value="alu-6063">6063-T5</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelCls}>荷载类型</label>
                <select value={loadType} onChange={(e) => setLoadType(e.target.value)} className={selectCls}>
                  {loadTypes.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>跨度 (mm)</label>
                <input type="number" value={span} onChange={(e) => setSpan(+e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{isDistributed ? "荷载 (kN/m)" : "荷载 (kN)"}</label>
                <input type="number" value={load} onChange={(e) => setLoad(+e.target.value)} step="0.1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>挠度限值 (L/n)</label>
                <input type="number" value={deflLimit} onChange={(e) => setDeflLimit(+e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>截面形状</label>
              <select value={shape} onChange={(e) => setShape(e.target.value)} className={selectCls}>
                {profileShapes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>{shape === "round-tube" ? "外径 (mm)" : "H (mm)"}</label>
                <input type="number" value={dimH} onChange={(e) => setDimH(+e.target.value)} className={inputCls} />
              </div>
              {shape !== "round-tube" && (
                <div>
                  <label className={labelCls}>B (mm)</label>
                  <input type="number" value={dimB} onChange={(e) => setDimB(+e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>{shape === "i-beam" || shape === "channel" ? "腹板tw (mm)" : "壁厚t (mm)"}</label>
                <input type="number" value={dimTw} onChange={(e) => setDimTw(+e.target.value)} className={inputCls} />
              </div>
              {(shape === "i-beam" || shape === "channel") && (
                <div>
                  <label className={labelCls}>翼缘tf (mm)</label>
                  <input type="number" value={dimTf} onChange={(e) => setDimTf(+e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">计算结果</h3>

            <div className="rounded-md bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">材料属性</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xl font-extrabold">{mat.E}</div><div className="text-xs text-muted-foreground">E (GPa)</div></div>
                <div><div className="text-xl font-extrabold">{mat.sigma}</div><div className="text-xs text-muted-foreground">σ (MPa)</div></div>
                <div><div className="text-xl font-extrabold">{mat.density}</div><div className="text-xs text-muted-foreground">ρ (g/cm³)</div></div>
              </div>
            </div>

            <div className="rounded-md bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">截面属性</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-base font-bold">{(Ix / 1e4).toFixed(1)}</div><div className="text-xs text-muted-foreground">Ix (cm⁴)</div></div>
                <div><div className="text-base font-bold">{(Wx / 1e3).toFixed(1)}</div><div className="text-xs text-muted-foreground">Wx (cm³)</div></div>
                <div><div className="text-base font-bold">{weightPerM.toFixed(2)}</div><div className="text-xs text-muted-foreground">kg/m</div></div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className={`rounded-md border p-4 ${stressOk ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">弯曲应力</div>
                <div className={`mt-1 text-2xl font-extrabold ${stressOk ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {sigma_max.toFixed(1)} MPa
                </div>
                <div className="text-xs text-muted-foreground">
                  {stressOk ? "✓" : "✗"} 限值: {mat.sigma} MPa ({((sigma_max / mat.sigma) * 100).toFixed(0)}%)
                </div>
              </div>
              <div className={`rounded-md border p-4 ${deflOk ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">挠度</div>
                <div className={`mt-1 text-2xl font-extrabold ${deflOk ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {defl.toFixed(1)} mm
                </div>
                <div className="text-xs text-muted-foreground">
                  {deflOk ? "✓" : "✗"} L/{deflRatio.toFixed(0)} (限值 L/{deflLimit})
                </div>
              </div>
            </div>

            <div className="rounded-md bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">荷载汇总</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>最大弯矩: <span className="font-bold text-foreground">{(M_max / 1e6).toFixed(2)} kNm</span></div>
                <div>总力: <span className="font-bold text-foreground">{totalForce.toFixed(1)} kN</span></div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              参考标准: EN 13706-3, GB/T 31539-2015, ASTM D3917, ASCE复合材料结构预标准。计算结果仅供初步选型参考，实际工程请进行详细设计验算。
            </p>
          </div>
        </div>
      )}

      {mode === "equivalence" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">原始型材（待替换）</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>现有材料</label>
                <select value={eqSourceMat} onChange={(e) => setEqSourceMat(e.target.value)} className={selectCls}>
                  <optgroup label="钢材 — EN">
                    <option value="steel-s235">S235 (EN 10025)</option>
                    <option value="steel-s355">S355 (EN 10025)</option>
                  </optgroup>
                  <optgroup label="钢材 — 国标">
                    <option value="steel-q235">Q235 (GB/T 700)</option>
                    <option value="steel-q345">Q345 (GB/T 1591)</option>
                  </optgroup>
                  <optgroup label="铝合金">
                    <option value="alu-6061">6061-T6</option>
                    <option value="alu-6063">6063-T5</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelCls}>目标FRP等级</label>
                <select value={eqTargetMat} onChange={(e) => setEqTargetMat(e.target.value)} className={selectCls}>
                  <optgroup label="EN 13706">
                    <option value="frp-e17">EN 13706 E17</option>
                    <option value="frp-e23">EN 13706 E23</option>
                  </optgroup>
                  <optgroup label="GB/T 31539-2015">
                    <option value="frp-gb-i">GB/T 31539 I级</option>
                    <option value="frp-gb-ii">GB/T 31539 II级</option>
                  </optgroup>
                  <optgroup label="ASCE">
                    <option value="frp-standard">ASCE 标准级</option>
                    <option value="frp-high">ASCE 高性能级</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>截面形状</label>
              <select value={eqShape} onChange={(e) => setEqShape(e.target.value)} className={selectCls}>
                {profileShapes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>{eqShape === "round-tube" ? "外径 (mm)" : "H (mm)"}</label>
                <input type="number" value={eqH} onChange={(e) => setEqH(+e.target.value)} className={inputCls} />
              </div>
              {eqShape !== "round-tube" && (
                <div>
                  <label className={labelCls}>B (mm)</label>
                  <input type="number" value={eqB} onChange={(e) => setEqB(+e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>{eqShape === "i-beam" || eqShape === "channel" ? "tw (mm)" : "t (mm)"}</label>
                <input type="number" value={eqTw} onChange={(e) => setEqTw(+e.target.value)} className={inputCls} />
              </div>
              {(eqShape === "i-beam" || eqShape === "channel") && (
                <div>
                  <label className={labelCls}>tf (mm)</label>
                  <input type="number" value={eqTf} onChange={(e) => setEqTf(+e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">FRP等效结果</h3>

            <div className="overflow-x-auto rounded-md bg-background">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">属性</th>
                    <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{srcMat.label}</th>
                    <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary">{tgtMat.label}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">弹性模量 E (GPa)</td><td className="px-4 py-2 font-medium">{srcMat.E}</td><td className="px-4 py-2 font-medium text-primary">{tgtMat.E}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">许用应力 σ (MPa)</td><td className="px-4 py-2 font-medium">{srcMat.sigma}</td><td className="px-4 py-2 font-medium text-primary">{tgtMat.sigma}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">密度 ρ (g/cm³)</td><td className="px-4 py-2 font-medium">{srcMat.density}</td><td className="px-4 py-2 font-medium text-primary">{tgtMat.density}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">所需 Ix (cm⁴)</td><td className="px-4 py-2 font-medium">{(srcIx / 1e4).toFixed(1)}</td><td className="px-4 py-2 font-medium text-primary">{(reqIx / 1e4).toFixed(1)}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">所需 Wx (cm³)</td><td className="px-4 py-2 font-medium">{(srcWx / 1e3).toFixed(1)}</td><td className="px-4 py-2 font-medium text-primary">{(reqWx / 1e3).toFixed(1)}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">建议FRP尺寸（等刚度）</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-base">
                <div>H: <span className="font-bold">{suggestedH} mm</span></div>
                <div>B: <span className="font-bold">{suggestedB} mm</span></div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                缩放系数 ×{stiffnessScale.toFixed(2)}，基于等弯曲刚度(EI)匹配。强度校核可能允许更小尺寸。
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-background p-4 text-center">
                <div className="text-xl font-extrabold">{srcWeight.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">原材料 (kg/m)</div>
              </div>
              <div className="rounded-md bg-background p-4 text-center">
                <div className="text-xl font-extrabold text-primary">{tgtWeight.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">FRP (kg/m)</div>
              </div>
              <div className="rounded-md border border-green-300 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
                <div className="text-xl font-extrabold text-green-600 dark:text-green-400">{weightSaving.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">减重比例</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              基于EN 13706-3、GB/T 31539-2015和ASCE预标准的等刚度替换方法。FRP型材设计通常由挠度(E·I)控制，而非屈服强度。实际工程请进行详细验算。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
