"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LOAD_TYPES as loadTypes,
  PROFILE_SHAPES as profileShapes,
  analyzeBeam,
  equivalence,
} from "@/lib/data/profile-mechanics";

type Mode = "beam" | "equivalence";

export default function ProfileCalculator() {
  const t = useTranslations("Tech");
  const locale = useLocale();
  const isEn = locale === "en";
  const lab = (o: { label: string; labelEn?: string }) =>
    isEn && o.labelEn ? o.labelEn : o.label;

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

  // Beam analysis + metal→FRP equivalence are computed by the shared
  // @/lib/data/profile-mechanics module so the AI `profile_mechanics` tool and
  // this UI never disagree (same single source of truth as jgt571).
  const {
    material: mat,
    Ix,
    Wx,
    isDistributed,
    totalForce,
    M_max,
    sigma_max,
    defl,
    deflRatio,
    weightPerM,
    stressOk,
    deflOk,
  } = analyzeBeam({
    matKey,
    shape,
    h: dimH,
    b: dimB,
    tw: dimTw,
    tf: dimTf,
    loadType,
    span,
    load,
    deflLimit,
  });

  const {
    srcMat,
    tgtMat,
    srcIx,
    srcWx,
    reqWx,
    reqIx,
    stiffnessScale,
    strengthScale,
    stiffH,
    stiffB,
    strengthH,
    strengthB,
    governingScale,
    governingIsStiffness,
    srcWeight,
    tgtWeight,
    weightSaving,
    isAluminumSource,
  } = equivalence({
    sourceMatKey: eqSourceMat,
    targetMatKey: eqTargetMat,
    shape: eqShape,
    h: eqH,
    b: eqB,
    tw: eqTw,
    tf: eqTf,
  });
  const governingKey = governingIsStiffness
    ? "calculator.governingStiffness"
    : "calculator.governingStrength";

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
          {t("calculator.modeBeam")}
        </button>
        <button
          onClick={() => setMode("equivalence")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${mode === "equivalence" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          {t("calculator.modeEquiv")}
        </button>
      </div>

      {mode === "beam" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.inputTitle")}</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{t("calculator.labelMaterial")}</label>
                <select value={matKey} onChange={(e) => setMatKey(e.target.value)} className={selectCls}>
                  <optgroup label="FRP — EN 13706">
                    <option value="frp-e17">{isEn ? "EN 13706 E17" : "EN 13706 E17级"}</option>
                    <option value="frp-e23">{isEn ? "EN 13706 E23" : "EN 13706 E23级"}</option>
                  </optgroup>
                  <optgroup label="FRP — GB/T 31539-2015">
                    <option value="frp-gb-i">{isEn ? "GB/T 31539 Class I" : "GB/T 31539 I级"}</option>
                    <option value="frp-gb-ii">{isEn ? "GB/T 31539 Class II" : "GB/T 31539 II级"}</option>
                  </optgroup>
                  <optgroup label="FRP — ASCE">
                    <option value="frp-standard">{isEn ? "ASCE Standard" : "ASCE 标准级"}</option>
                    <option value="frp-high">{isEn ? "ASCE High-performance" : "ASCE 高性能级"}</option>
                  </optgroup>
                  <optgroup label={isEn ? "Steel — EN" : "钢材 — EN"}>
                    <option value="steel-s235">S235 (EN 10025)</option>
                    <option value="steel-s355">S355 (EN 10025)</option>
                  </optgroup>
                  <optgroup label={isEn ? "Steel — China GB" : "钢材 — 国标"}>
                    <option value="steel-q235">Q235 (GB/T 700)</option>
                    <option value="steel-q345">Q345 (GB/T 1591)</option>
                  </optgroup>
                  <optgroup label={isEn ? "Aluminum" : "铝合金"}>
                    <option value="alu-6061">6061-T6</option>
                    <option value="alu-6063">6063-T5</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t("calculator.labelLoadType")}</label>
                <select value={loadType} onChange={(e) => setLoadType(e.target.value)} className={selectCls}>
                  {loadTypes.map((l) => <option key={l.id} value={l.id}>{lab(l)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>{t("calculator.labelSpan")}</label>
                <input type="number" value={span} onChange={(e) => setSpan(+e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{isDistributed ? t("calculator.labelLoad") : t("calculator.labelLoadPoint")}</label>
                <input type="number" value={load} onChange={(e) => setLoad(+e.target.value)} step="0.1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t("calculator.labelDeflLimit")}</label>
                <input type="number" value={deflLimit} onChange={(e) => setDeflLimit(+e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t("calculator.labelShape")}</label>
              <select value={shape} onChange={(e) => setShape(e.target.value)} className={selectCls}>
                {profileShapes.map((s) => <option key={s.id} value={s.id}>{lab(s)}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>{shape === "round-tube" ? t("calculator.labelOD") : t("calculator.labelH")}</label>
                <input type="number" value={dimH} onChange={(e) => setDimH(+e.target.value)} className={inputCls} />
              </div>
              {shape !== "round-tube" && (
                <div>
                  <label className={labelCls}>{t("calculator.labelB")}</label>
                  <input type="number" value={dimB} onChange={(e) => setDimB(+e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>{shape === "i-beam" || shape === "channel" ? t("calculator.labelTw") : t("calculator.labelTwShort")}</label>
                <input type="number" value={dimTw} onChange={(e) => setDimTw(+e.target.value)} className={inputCls} />
              </div>
              {(shape === "i-beam" || shape === "channel") && (
                <div>
                  <label className={labelCls}>{t("calculator.labelTf")}</label>
                  <input type="number" value={dimTf} onChange={(e) => setDimTf(+e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.resultTitle")}</h3>

            <div className="rounded-md bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("calculator.matProps")}</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xl font-extrabold">{mat.E}</div><div className="text-xs text-muted-foreground">E (GPa)</div></div>
                <div><div className="text-xl font-extrabold">{mat.sigma}</div><div className="text-xs text-muted-foreground">σ (MPa)</div></div>
                <div><div className="text-xl font-extrabold">{mat.density}</div><div className="text-xs text-muted-foreground">ρ (g/cm³)</div></div>
              </div>
            </div>

            <div className="rounded-md bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("calculator.sectionProps")}</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-base font-bold">{(Ix / 1e4).toFixed(1)}</div><div className="text-xs text-muted-foreground">Ix (cm⁴)</div></div>
                <div><div className="text-base font-bold">{(Wx / 1e3).toFixed(1)}</div><div className="text-xs text-muted-foreground">Wx (cm³)</div></div>
                <div><div className="text-base font-bold">{weightPerM.toFixed(2)}</div><div className="text-xs text-muted-foreground">kg/m</div></div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className={`rounded-md border p-4 ${stressOk ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("calculator.stress")}</div>
                <div className={`mt-1 text-2xl font-extrabold ${stressOk ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {sigma_max.toFixed(1)} MPa
                </div>
                <div className="text-xs text-muted-foreground">
                  {stressOk ? "✓" : "✗"} {t("calculator.stressLimit", { val: mat.sigma, pct: ((sigma_max / mat.sigma) * 100).toFixed(0) })}
                </div>
              </div>
              <div className={`rounded-md border p-4 ${deflOk ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("calculator.deflection")}</div>
                <div className={`mt-1 text-2xl font-extrabold ${deflOk ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {defl.toFixed(1)} mm
                </div>
                <div className="text-xs text-muted-foreground">
                  {deflOk ? "✓" : "✗"} {t("calculator.deflLimit", { ratio: deflRatio.toFixed(0), limit: deflLimit })}
                </div>
              </div>
            </div>

            <div className="rounded-md bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("calculator.loadSummary")}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>{t("calculator.maxMoment")} <span className="font-bold text-foreground">{(M_max / 1e6).toFixed(2)} kNm</span></div>
                <div>{t("calculator.totalForce")} <span className="font-bold text-foreground">{totalForce.toFixed(1)} kN</span></div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t("calculator.disclaimer")}</p>
          </div>
        </div>
      )}

      {mode === "equivalence" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.equivSrcTitle")}</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{t("calculator.equivSrcMat")}</label>
                <select value={eqSourceMat} onChange={(e) => setEqSourceMat(e.target.value)} className={selectCls}>
                  <optgroup label={isEn ? "Steel — EN" : "钢材 — EN"}>
                    <option value="steel-s235">S235 (EN 10025)</option>
                    <option value="steel-s355">S355 (EN 10025)</option>
                  </optgroup>
                  <optgroup label={isEn ? "Steel — China GB" : "钢材 — 国标"}>
                    <option value="steel-q235">Q235 (GB/T 700)</option>
                    <option value="steel-q345">Q345 (GB/T 1591)</option>
                  </optgroup>
                  <optgroup label={isEn ? "Aluminum" : "铝合金"}>
                    <option value="alu-6061">6061-T6</option>
                    <option value="alu-6063">6063-T5</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t("calculator.equivTgtMat")}</label>
                <select value={eqTargetMat} onChange={(e) => setEqTargetMat(e.target.value)} className={selectCls}>
                  <optgroup label="EN 13706">
                    <option value="frp-e17">EN 13706 E17</option>
                    <option value="frp-e23">EN 13706 E23</option>
                  </optgroup>
                  <optgroup label="GB/T 31539-2015">
                    <option value="frp-gb-i">{isEn ? "GB/T 31539 Class I" : "GB/T 31539 I级"}</option>
                    <option value="frp-gb-ii">{isEn ? "GB/T 31539 Class II" : "GB/T 31539 II级"}</option>
                  </optgroup>
                  <optgroup label="ASCE">
                    <option value="frp-standard">{isEn ? "ASCE Standard" : "ASCE 标准级"}</option>
                    <option value="frp-high">{isEn ? "ASCE High-performance" : "ASCE 高性能级"}</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>{t("calculator.labelShape")}</label>
              <select value={eqShape} onChange={(e) => setEqShape(e.target.value)} className={selectCls}>
                {profileShapes.map((s) => <option key={s.id} value={s.id}>{lab(s)}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>{eqShape === "round-tube" ? t("calculator.labelOD") : t("calculator.labelH")}</label>
                <input type="number" value={eqH} onChange={(e) => setEqH(+e.target.value)} className={inputCls} />
              </div>
              {eqShape !== "round-tube" && (
                <div>
                  <label className={labelCls}>{t("calculator.labelB")}</label>
                  <input type="number" value={eqB} onChange={(e) => setEqB(+e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>{eqShape === "i-beam" || eqShape === "channel" ? t("calculator.labelTw") : t("calculator.labelTwShort")}</label>
                <input type="number" value={eqTw} onChange={(e) => setEqTw(+e.target.value)} className={inputCls} />
              </div>
              {(eqShape === "i-beam" || eqShape === "channel") && (
                <div>
                  <label className={labelCls}>{t("calculator.labelTf")}</label>
                  <input type="number" value={eqTf} onChange={(e) => setEqTf(+e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.equivResTitle")}</h3>

            <div className="overflow-x-auto rounded-md bg-background">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.colProp")}</th>
                    <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{lab(srcMat)}</th>
                    <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary">{lab(tgtMat)}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">{t("calculator.colE")}</td><td className="px-4 py-2 font-medium">{srcMat.E}</td><td className="px-4 py-2 font-medium text-primary">{tgtMat.E}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">{t("calculator.colSigma")}</td><td className="px-4 py-2 font-medium">{srcMat.sigma}</td><td className="px-4 py-2 font-medium text-primary">{tgtMat.sigma}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">{t("calculator.colRho")}</td><td className="px-4 py-2 font-medium">{srcMat.density}</td><td className="px-4 py-2 font-medium text-primary">{tgtMat.density}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">{t("calculator.colReqIx")}</td><td className="px-4 py-2 font-medium">{(srcIx / 1e4).toFixed(1)}</td><td className="px-4 py-2 font-medium text-primary">{(reqIx / 1e4).toFixed(1)}</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">{t("calculator.colReqWx")}</td><td className="px-4 py-2 font-medium">{(srcWx / 1e3).toFixed(1)}</td><td className="px-4 py-2 font-medium text-primary">{(reqWx / 1e3).toFixed(1)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* 双准则建议尺寸：等刚度 + 等强度 */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border bg-background p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.equalStiffnessTitle")}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>H: <span className="font-bold">{stiffH} mm</span></div>
                  <div>B: <span className="font-bold">{stiffB} mm</span></div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  k = (E<sub>src</sub>/E<sub>tgt</sub>)<sup>1/4</sup> = ×{stiffnessScale.toFixed(2)}
                </p>
              </div>
              <div className="rounded-md border bg-background p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("calculator.equalStrengthTitle")}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>H: <span className="font-bold">{strengthH} mm</span></div>
                  <div>B: <span className="font-bold">{strengthB} mm</span></div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  k = (σ<sub>src</sub>/σ<sub>tgt</sub>)<sup>1/3</sup> = ×{strengthScale.toFixed(2)}
                </p>
              </div>
            </div>

            {/* 控制准则提示 */}
            <div className="rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">{t("calculator.governingTitle")}</div>
              <div className="mt-1.5 text-base font-bold">
                {t(governingKey)} — ×{governingScale.toFixed(2)}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {isAluminumSource ? t("calculator.governingHintAl") : t("calculator.governingHintSteel")}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-background p-4 text-center">
                <div className="text-xl font-extrabold">{srcWeight.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{t("calculator.srcWeight")}</div>
              </div>
              <div className="rounded-md bg-background p-4 text-center">
                <div className="text-xl font-extrabold text-primary">{tgtWeight.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{t("calculator.frpWeightGov")}</div>
              </div>
              <div className="rounded-md border border-green-300 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
                <div className="text-xl font-extrabold text-green-600 dark:text-green-400">{weightSaving.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">{t("calculator.weightSaving")}</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t("calculator.equivDisclaimer")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
