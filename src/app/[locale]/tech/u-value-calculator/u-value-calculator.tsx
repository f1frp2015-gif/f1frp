"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  JGT571_APPENDIX_C,
  COMPARISON_FRAMES,
  FRP_LAMBDA,
  FOAM_PENALTY,
  SLIDING_PENALTY,
  psiFor,
  thermalGrade,
  JGT571_MIN_GRADE,
  type Gas,
} from "@/lib/data/jgt571";

// ── EN ISO 10077-1 / JGJ/T 151 area-weighted Uw for the optional
// actual-size refinement, fed with 571 Uf/Ug/Ψ values. ───────────────────
function calcUwGeom(
  width: number,
  height: number,
  faceWidth: number,
  Uf: number,
  Ug: number,
  psi: number,
) {
  const W = width / 1000;
  const H = height / 1000;
  const fw = faceWidth / 1000;
  const Aw = W * H;
  const gW = W - 2 * fw;
  const gH = H - 2 * fw;
  if (gW <= 0 || gH <= 0) return null;
  const Ag = gW * gH;
  const Af = Aw - Ag;
  const lg = 2 * (gW + gH);
  const Uw = (Ag * Ug + Af * Uf + lg * psi) / Aw;
  return { Uw, Ag, Af, lg, ratio: Ag / Aw };
}

type RatingKey =
  | "passive_premium"
  | "passive"
  | "low_energy"
  | "compliant"
  | "basic"
  | "below";

function getRatingKey(Uw: number): RatingKey {
  if (Uw <= 0.8) return "passive_premium";
  if (Uw <= 1.0) return "passive";
  if (Uw <= 1.3) return "low_energy";
  if (Uw <= 1.8) return "compliant";
  if (Uw <= 2.5) return "basic";
  return "below";
}

function getRatingColors(Uw: number) {
  if (Uw <= 1.0)
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
    };
  if (Uw <= 1.3)
    return {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    };
  if (Uw <= 1.8)
    return {
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    };
  if (Uw <= 2.5)
    return {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    };
  return {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
  };
}

export default function UValueCalculator() {
  const t = useTranslations("Tech");
  const locale = useLocale();
  const isEn = locale === "en";

  const [seriesIdx, setSeriesIdx] = useState(2); // 65 系列
  const [rowIdx, setRowIdx] = useState(3);
  const [gas, setGas] = useState<Gas>("ar");
  const [opening, setOpening] = useState<"casement" | "sliding">("casement");
  const [foam, setFoam] = useState(true);
  const [mode, setMode] = useState<"standard" | "custom">("standard");
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1500);
  const [faceWidth, setFaceWidth] = useState(90);

  const selSeries = JGT571_APPENDIX_C[seriesIdx];
  const selRow = selSeries.rows[Math.min(rowIdx, selSeries.rows.length - 1)];
  const effGas: Gas = selRow.gasFixed ?? gas;

  const slidingAdd = opening === "sliding" ? SLIDING_PENALTY : 0;
  const foamAdd = foam ? 0 : FOAM_PENALTY;

  // Glass build descriptor, generated from flags.
  const glassDesc = useMemo(() => {
    const parts = [
      selRow.panes === 3 ? t("uvalue.paneTriple") : t("uvalue.paneDouble"),
    ];
    if (selRow.lowE) parts.push("Low-E");
    if (selRow.warmEdge) parts.push(t("uvalue.warmEdge"));
    return parts.join(" · ");
  }, [selRow, t]);

  const baseUw = selRow.Uw[effGas];
  const stdUw = baseUw + slidingAdd + foamAdd;

  const psi = psiFor(selRow);
  const geom = useMemo(
    () =>
      mode === "custom"
        ? calcUwGeom(width, height, faceWidth, selSeries.Uf, selRow.Ug[effGas], psi)
        : null,
    [mode, width, height, faceWidth, selSeries, selRow, effGas, psi],
  );
  const customUw = geom ? geom.Uw + slidingAdd + foamAdd : null;

  const Uw = mode === "custom" ? customUw : stdUw;
  const grade = Uw != null ? thermalGrade(Uw) : 0;
  const meets571 = grade >= JGT571_MIN_GRADE;

  // Frame-material comparison at the current glass build (table 30:70,
  // casement, foam-filled). Swapping only the frame shifts Uw by the frame's
  // 30% contribution: ΔUw = 0.3·(Uf_material − Uf_frp).
  const cmpRows = COMPARISON_FRAMES.map((m) => ({
    ...m,
    Uw: Math.round((baseUw + 0.3 * (m.Uf - selSeries.Uf)) * 100) / 100,
  }));
  const aluNoBreak = cmpRows.find((m) => m.id === "alu-no-break")!;
  const vsAluPct = Math.round(((aluNoBreak.Uw - baseUw) / aluNoBreak.Uw) * 100);
  const matLabel = (id: string) =>
    id === "alu-no-break"
      ? t("uvalue.matAluNoBreak")
      : id === "alu-break"
        ? t("uvalue.matAluBreak")
        : id === "pvc"
          ? t("uvalue.matPvc")
          : t("uvalue.matTimber");

  function changeSeries(idx: number) {
    setSeriesIdx(idx);
    setRowIdx((r) => Math.min(r, JGT571_APPENDIX_C[idx].rows.length - 1));
  }

  const selectCls =
    "w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";
  const inputCls =
    "w-full rounded-md border bg-background px-3 py-2.5 text-sm text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const segBtn = (active: boolean) =>
    `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-background text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div>
      {/* Standard badge */}
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
        {t("uvalue.stdBadge")}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Input panel */}
        <div className="space-y-5 rounded-lg border bg-background p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("uvalue.labelSeries")}</label>
              <select
                value={seriesIdx}
                onChange={(e) => changeSeries(+e.target.value)}
                className={selectCls}
              >
                {JGT571_APPENDIX_C.map((s, i) => (
                  <option key={s.series} value={i}>
                    {s.series} {t("uvalue.seriesSuffix")} · Uf {s.Uf}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">
                U<sub>f</sub> = {selSeries.Uf} W/m²K
              </span>
            </div>
            <div>
              <label className={labelCls}>{t("uvalue.labelGlassCfg")}</label>
              <select
                value={Math.min(rowIdx, selSeries.rows.length - 1)}
                onChange={(e) => setRowIdx(+e.target.value)}
                className={selectCls}
              >
                {selSeries.rows.map((r, i) => (
                  <option key={r.glass} value={i}>
                    {r.glass}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">
                {glassDesc} · U<sub>g</sub> = {selRow.Ug[effGas]} W/m²K
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("uvalue.labelGas")}</label>
              <div className="flex gap-2 rounded-md border bg-muted/40 p-1">
                <button
                  type="button"
                  disabled={!!selRow.gasFixed}
                  onClick={() => setGas("air")}
                  className={segBtn(effGas === "air")}
                >
                  {t("uvalue.gasAir")}
                </button>
                <button
                  type="button"
                  disabled={!!selRow.gasFixed}
                  onClick={() => setGas("ar")}
                  className={segBtn(effGas === "ar")}
                >
                  {t("uvalue.gasAr")}
                </button>
              </div>
              {selRow.gasFixed && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("uvalue.gasLocked")}
                </span>
              )}
            </div>
            <div>
              <label className={labelCls}>{t("uvalue.labelOpening")}</label>
              <div className="flex gap-2 rounded-md border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setOpening("casement")}
                  className={segBtn(opening === "casement")}
                >
                  {t("uvalue.openCasement")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpening("sliding")}
                  className={segBtn(opening === "sliding")}
                >
                  {t("uvalue.openSliding")}
                </button>
              </div>
              {opening === "sliding" && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("uvalue.note4Short")}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("uvalue.labelFoam")}</label>
            <div className="flex gap-2 rounded-md border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setFoam(true)}
                className={segBtn(foam)}
              >
                {t("uvalue.foamYes")}
              </button>
              <button
                type="button"
                onClick={() => setFoam(false)}
                className={segBtn(!foam)}
              >
                {t("uvalue.foamNo")}
              </button>
            </div>
          </div>

          {/* Mode switch */}
          <div>
            <label className={labelCls}>{t("uvalue.labelMode")}</label>
            <div className="flex gap-2 rounded-md border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setMode("standard")}
                className={segBtn(mode === "standard")}
              >
                {t("uvalue.modeStandard")}
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={segBtn(mode === "custom")}
              >
                {t("uvalue.modeCustom")}
              </button>
            </div>
          </div>

          {mode === "custom" && (
            <>
              <div>
                <label className={labelCls}>{t("uvalue.labelSize")}</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Math.max(200, +e.target.value))}
                      min={200}
                      max={4000}
                      step={50}
                      className={inputCls}
                    />
                    <span className="mt-0.5 block text-center text-xs text-muted-foreground">
                      {t("uvalue.width")}
                    </span>
                  </div>
                  <span className="text-muted-foreground">×</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Math.max(200, +e.target.value))}
                      min={200}
                      max={4000}
                      step={50}
                      className={inputCls}
                    />
                    <span className="mt-0.5 block text-center text-xs text-muted-foreground">
                      {t("uvalue.height")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={faceWidth}
                      onChange={(e) => setFaceWidth(Math.max(30, +e.target.value))}
                      min={30}
                      max={200}
                      step={5}
                      className={inputCls}
                    />
                    <span className="mt-0.5 block text-center text-xs text-muted-foreground">
                      {t("uvalue.faceWidth")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                {t("uvalue.customNote")}
              </div>
            </>
          )}
        </div>

        {/* Result panel */}
        <div className="space-y-3">
          {Uw != null ? (
            <>
              <div
                className={`rounded-lg border p-8 text-center ${getRatingColors(Uw).bg}`}
              >
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("uvalue.totalUw")}
                  <sub>w</sub>
                </span>
                <span className="mt-2 block text-5xl font-extrabold leading-none tracking-tight">
                  {Uw.toFixed(2)}
                </span>
                <span className="block text-sm text-muted-foreground">W/m²K</span>
                <span
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${getRatingColors(Uw).color} ${getRatingColors(Uw).bg}`}
                >
                  {t(`uvalue.ratings.${getRatingKey(Uw)}`)}
                </span>
              </div>

              {/* 571 thermal grade */}
              <div
                className={`rounded-lg border p-5 ${
                  meets571
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("uvalue.gradeLabel")}
                  </span>
                  <span className="text-lg font-extrabold">
                    {t("uvalue.gradeValue", { n: grade })}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <span
                    className={
                      meets571
                        ? "font-semibold text-emerald-700 dark:text-emerald-400"
                        : "font-semibold text-red-700 dark:text-red-400"
                    }
                  >
                    {meets571 ? "✓" : "✗"}{" "}
                    {meets571 ? t("uvalue.gradePass") : t("uvalue.gradeFail")}
                  </span>
                  <span className="text-muted-foreground">
                    · {t("uvalue.grade571")}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("uvalue.breakdownTitle")}
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("uvalue.bdSeries")} U<sub>f</sub>
                    </dt>
                    <dd className="font-medium">{selSeries.Uf} W/m²K</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("uvalue.bdGlass")} U<sub>g</sub>
                    </dt>
                    <dd className="font-medium">{selRow.Ug[effGas]} W/m²K</dd>
                  </div>
                  {mode === "standard" ? (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("uvalue.bdBaseUw")}</dt>
                      <dd className="font-medium">{baseUw.toFixed(2)} W/m²K</dd>
                    </div>
                  ) : (
                    geom && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            {t("uvalue.bdPsi")} Ψ
                          </dt>
                          <dd className="font-medium">{psi} W/mK</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            {t("uvalue.glassRatio")}
                          </dt>
                          <dd className="font-medium">
                            {Math.round(geom.ratio * 100)}%
                          </dd>
                        </div>
                      </>
                    )
                  )}
                  {slidingAdd > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("uvalue.bdSliding")}</dt>
                      <dd className="font-medium text-amber-600 dark:text-amber-400">
                        +{slidingAdd.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  {foamAdd > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("uvalue.bdFoam")}</dt>
                      <dd className="font-medium text-amber-600 dark:text-amber-400">
                        +{foamAdd.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <dt className="font-semibold">
                      {t("uvalue.totalUw")}
                      <sub>w</sub>
                    </dt>
                    <dd className="font-bold">{Uw.toFixed(2)} W/m²K</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border bg-background p-5">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("uvalue.compliance")}
                </h4>
                <div className="space-y-1.5 text-xs">
                  {(isEn
                    ? [
                        { region: "🇨🇳 China", label: "Severe cold (Harbin)", max: 1.5 },
                        { region: "🇨🇳 China", label: "Cold (Beijing)", max: 2.0 },
                        { region: "🇨🇳 China", label: "Hot summer / cold winter", max: 2.3 },
                        { region: "🇪🇺 EU", label: "Passive House", max: 0.8 },
                        { region: "🇪🇺 EU", label: "Near-zero energy", max: 1.3 },
                        { region: "🇺🇸 US", label: "ENERGY STAR Northern", max: 1.7 },
                        { region: "🇨🇦 Canada", label: "Zone A (coldest)", max: 1.2 },
                      ]
                    : [
                        { region: "🇨🇳 中国", label: "严寒地区（哈尔滨）", max: 1.5 },
                        { region: "🇨🇳 中国", label: "寒冷地区（北京）", max: 2.0 },
                        { region: "🇨🇳 中国", label: "夏热冬冷（上海）", max: 2.3 },
                        { region: "🇪🇺 欧洲", label: "被动房", max: 0.8 },
                        { region: "🇪🇺 欧洲", label: "近零能耗", max: 1.3 },
                        { region: "🇺🇸 美国", label: "ENERGY STAR 北方", max: 1.7 },
                        { region: "🇨🇦 加拿大", label: "A区（最冷）", max: 1.2 },
                      ]
                  ).map((tbl) => (
                    <div
                      key={`${tbl.region}-${tbl.label}`}
                      className="flex items-center justify-between gap-1"
                    >
                      <span className="truncate text-muted-foreground">
                        {tbl.region} {tbl.label}
                      </span>
                      <span
                        className={`shrink-0 font-medium ${Uw <= tbl.max ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      >
                        ≤ {tbl.max.toFixed(2)} {Uw <= tbl.max ? "✓" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-red-300 bg-red-50 p-5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {t("uvalue.sizeError")}
            </div>
          )}
        </div>
      </div>

      {/* Frame-material comparison (vs aluminium / PVC / timber) */}
      <div className="mt-14">
        <h3 className="text-2xl font-bold">{t("uvalue.cmpTitle")}</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("uvalue.cmpSub")}
        </p>

        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {t("uvalue.cmpHeadline", { pct: vsAluPct })}
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left">
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colFrameMat")}</th>
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colFrameUf")}</th>
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colWinUw")}</th>
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colLambda")}</th>
                <th className="pb-2 font-bold">{t("uvalue.colBreak")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-primary/5">
                <td className="py-2 pr-5 font-medium">
                  {t("uvalue.matFrpPu", { n: selSeries.series })}
                </td>
                <td className="py-2 pr-5 font-medium">{selSeries.Uf}</td>
                <td className="py-2 pr-5 font-bold">{baseUw.toFixed(2)}</td>
                <td className="py-2 pr-5 text-muted-foreground">{FRP_LAMBDA}</td>
                <td className="py-2 text-muted-foreground">{t("uvalue.breakNo")}</td>
              </tr>
              {cmpRows.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2 pr-5">{matLabel(m.id)}</td>
                  <td className="py-2 pr-5">{m.Uf}</td>
                  <td className="py-2 pr-5 font-medium">{m.Uw.toFixed(2)}</td>
                  <td className="py-2 pr-5 text-muted-foreground">{m.lambda}</td>
                  <td className="py-2 text-muted-foreground">
                    {m.id === "alu-break"
                      ? t("uvalue.breakYes")
                      : m.id === "alu-no-break"
                        ? "—"
                        : t("uvalue.breakNo")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("uvalue.cmpNote")}
        </p>
      </div>

      {/* 571 series Uf quick-reference */}
      <div className="mt-14">
        <h3 className="text-2xl font-bold">{t("uvalue.seriesTableTitle")}</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("uvalue.seriesTableSub")}
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left">
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colSeries")}</th>
                <th className="pb-2 pr-5 font-bold">
                  U<sub>f</sub> (W/m²K)
                </th>
                <th className="pb-2 font-bold">{t("uvalue.colBestUw")}</th>
              </tr>
            </thead>
            <tbody>
              {JGT571_APPENDIX_C.map((s, i) => {
                const best = Math.min(...s.rows.map((r) => r.Uw.ar));
                return (
                  <tr
                    key={s.series}
                    className={`border-b ${i === seriesIdx ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-2 pr-5 font-medium">
                      {s.series} {t("uvalue.seriesSuffix")}
                    </td>
                    <td className="py-2 pr-5">{s.Uf}</td>
                    <td className="py-2 text-muted-foreground">
                      {best.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 表 C.1 注 + citation */}
      <div className="mt-12 rounded-lg border bg-muted/30 p-6">
        <h3 className="text-sm font-bold">{t("uvalue.notesTitle")}</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>{t("uvalue.note1")}</li>
          <li>{t("uvalue.note2")}</li>
          <li>{t("uvalue.note3")}</li>
          <li>{t("uvalue.note4")}</li>
          <li>{t("uvalue.note5")}</li>
        </ol>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          {t("uvalue.citation")}
        </p>
      </div>

      {/* International standards reference */}
      <div className="mt-14">
        <h3 className="text-2xl font-bold">{t("uvalue.stdTableTitle")}</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("uvalue.stdTableSub")}
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left">
                <th className="pb-2 pr-3 font-bold">{t("uvalue.colRegion")}</th>
                <th className="pb-2 pr-3 font-bold">{t("uvalue.colStd")}</th>
                <th className="pb-2 pr-3 font-bold">{t("uvalue.colZone")}</th>
                <th className="pb-2 pr-3 font-bold">{t("uvalue.colMaxUw")}</th>
                <th className="pb-2 font-bold">{t("uvalue.colNote")}</th>
              </tr>
            </thead>
            <tbody>
              {(isEn
                ? [
                    { region: "China", std: "JG/T 571-2019", zone: "GFRP-PU window ≥ grade 6", uw: "< 2.50", note: "GFRP-PU energy-saving window standard (App. C basis)" },
                    { region: "China", std: "GB 55015-2021", zone: "Severe cold residential", uw: "≤ 1.50", note: "Mandatory building energy code" },
                    { region: "China", std: "GB 55015-2021", zone: "Cold residential", uw: "≤ 2.00", note: "Mandatory building energy code" },
                    { region: "China", std: "GB/T 8484-2020", zone: "Test method", uw: "—", note: "Hot-box test for window U-value" },
                    { region: "EU", std: "EN ISO 10077-1", zone: "Passive House", uw: "≤ 0.80", note: "PHI certified; installed" },
                    { region: "EU", std: "EPBD 2024", zone: "Near-zero energy", uw: "≤ 1.30", note: "Member states vary" },
                    { region: "US", std: "ENERGY STAR v7.0", zone: "Northern", uw: "≤ 1.70", note: "NFRC tested; strictest" },
                    { region: "Canada", std: "CSA A440/NEB", zone: "Zone A (coldest)", uw: "≤ 1.20", note: "Triple glazing typically required" },
                  ]
                : [
                    { region: "中国", std: "JG/T 571-2019", zone: "玻纤增强聚氨酯门窗 ≥ 6级", uw: "< 2.50", note: "玻纤增强聚氨酯节能门窗标准（本计算器附录C依据）" },
                    { region: "中国", std: "GB 55015-2021", zone: "严寒地区住宅", uw: "≤ 1.50", note: "建筑节能强制性国标" },
                    { region: "中国", std: "GB 55015-2021", zone: "寒冷地区住宅", uw: "≤ 2.00", note: "建筑节能强制性国标" },
                    { region: "中国", std: "GB/T 8484-2020", zone: "检测方法", uw: "—", note: "整窗传热系数热箱法检测" },
                    { region: "欧洲", std: "EN ISO 10077-1", zone: "被动房", uw: "≤ 0.80", note: "PHI认证；含安装" },
                    { region: "欧洲", std: "EPBD 2024", zone: "近零能耗", uw: "≤ 1.30", note: "各成员国有差异" },
                    { region: "美国", std: "ENERGY STAR v7.0", zone: "北方区", uw: "≤ 1.70", note: "NFRC测试；最严格" },
                    { region: "加拿大", std: "CSA A440/NEB", zone: "A区（最冷）", uw: "≤ 1.20", note: "通常需三层玻璃" },
                  ]
              ).map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-3 font-medium">{row.region}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">
                    {row.std}
                  </td>
                  <td className="py-2 pr-3">{row.zone}</td>
                  <td className="py-2 pr-3 font-medium">{row.uw}</td>
                  <td className="py-2 text-xs text-muted-foreground">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="mt-5 rounded-md bg-muted/50 px-5 py-3 text-xs leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: t.raw("uvalue.stdDisclaimer") as string }}
        />
      </div>
    </div>
  );
}
