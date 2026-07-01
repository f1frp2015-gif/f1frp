"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  ASCE_EXPOSURE,
  ASCE_WIND_SPEEDS,
  BASIC_WIND_PRESSURE,
  DEFLECTION_LIMITS,
  EC_TERRAIN,
  EC_WIND_SPEEDS,
  MATERIALS,
  NET_CP_PRESETS,
  PROFILE_SERIES,
  SHAPE_ZONES,
  TERRAIN,
  computeASCE,
  computeEC,
  computeGB,
  type AsceExposure,
  type EcTerrain,
  type Terrain,
  type WindStandard,
} from "@/lib/data/wind-load";

const L10N = {
  zh: {
    standardLabel: "计算标准 / 地区",
    stdGB: "🇨🇳 中国 · GB 50009",
    stdASCE: "🇺🇸 美国 · ASCE 7-22",
    stdEC: "🇪🇺 欧盟/英国 · Eurocode",
    badgeGB: "依据 GB 50009-2012《建筑结构荷载规范》· JGJ 102 / JGJ 214",
    badgeASCE: "Per ASCE 7-22 · Components & Cladding (§26/§30)",
    badgeEC: "Per Eurocode EN 1991-1-4 · Wind actions",
    secWind: "① 风荷载参数",
    secMember: "② 框料受力参数（简支梁）",
    seriesLabel: "门窗型材系列（公称框深）",
    seriesNone: "不指定 / 自定义",
    // GB
    city: "工程所在地 / 基本风压 w₀",
    cityCustom: "自定义 w₀",
    w0: "基本风压 w₀ (kN/m²)",
    terrain: "地面粗糙度类别",
    height: "计算点离地高度 z (m)",
    shape: "风荷载体型系数 μsl",
    shapeHint: "围护结构取控制工况（一般为角部/边缘吸力）绝对值",
    gammaW: "风荷载分项系数 γw",
    gammaHint: "GB 55001-2021 通用规范取 1.5；旧 GB 50009 为 1.4",
    // ASCE
    asceSpeed: "基本风速 V（3 秒阵风·极限）",
    asceExp: "暴露类别",
    asceCp: "净压力系数 |GCp − GCpi|",
    asceCpHint: "封闭建筑 GCpi = ±0.18；按 ASCE 7 图 30.3-1 与有效受风面积细化",
    asceLoadNote: "V 为极限风速；强度用 1.0W，挠度用 0.6W 使用级",
    // EC
    ecVb: "基本风速 vb（10min 平均·50 年）",
    ecCat: "地形类别",
    ecCp: "净压力系数 |cpe − cpi|",
    ecCpHint: "内压 cpi 取 +0.2 / −0.3；按 EN 1991-1-4 §7.2 分区细化",
    ecLoadNote: "qp 为特征值；强度用 γQ=1.5（ULS），挠度用特征值",
    windSpeed: "风速 (m/s)",
    // member
    material: "框料材料",
    eMod: "弹性模量 E (MPa)",
    fStr: "抗弯强度设计值 f (MPa)",
    tribWidth: "受荷宽度 B（框料间距，mm）",
    span: "计算跨度 L (mm)",
    sectMod: "抗弯截面模量 W (cm³)",
    inertia: "惯性矩 I (cm⁴)",
    sectHint: "截面特性可用「工程核算」工具或厂家 datasheet 获取",
    deflLimit: "挠度限值",
    // live
    liveMuz: "风压高度系数 μz",
    liveBgz: "阵风系数 βgz",
    liveKz: "速压暴露系数 Kz",
    liveQz: "速压 qz",
    liveCe: "暴露系数 ce",
    liveQp: "峰值速压 qp",
    liveP: "使用级风压",
    livePd: "设计级风压",
    // result
    resultTitle: "抗风压核算结果",
    pass: "满足抗风压要求",
    fail: "不满足抗风压要求",
    strengthCheck: "强度校核 σ ≤ f",
    deflCheck: "挠度校核 δ ≤ [δ]",
    designMoment: "设计弯矩 Md",
    utilization: "利用率",
    ok: "通过",
    ng: "超限",
    breakdown: "计算明细",
    lineLoad: "使用级线荷载 qk",
    allowDefl: "允许挠度 [δ]",
    // formulas
    formulaTitle: "计算依据与公式",
    fGB1: "围护结构风荷载标准值（GB 50009-2012 §8.1.1-2）：",
    fGB1Eq: "wk = βgz · μsl · μz · w0",
    fGB2: "μz（§8.2.1）、βgz（§8.6.1）按地面粗糙度与高度 z 计算，起算高度以下取起算高度值。",
    fASCE1: "ASCE 7-22 速压（SI）：",
    fASCE1Eq: "qz = 0.613 · Kz · Kzt · Kd · Ke · V²",
    fASCE2: "C&C 设计风压 p = qz·(GCp − GCpi)；Kz = 2.01·(z/zg)^(2/α)，Kd = 0.85，GCpi = ±0.18。",
    fEC1: "Eurocode EN 1991-1-4 峰值速压：",
    fEC1Eq: "qp(z) = ce(z) · qb , qb = 0.5·ρ·vb²",
    fEC2: "ce(z) = [1+7·Iv]·cr²，cr = kr·ln(z/z0)，kr = 0.19·(z0/0.05)^0.07，ρ = 1.25 kg/m³。",
    fStrength: "框料强度（简支梁均布风压）：σ = Md / W ，Md = γ · qk · L²/8 ，qk = p·B",
    fDefl: "框料挠度（使用级风压）：δ = 5·qk·L⁴ / (384·E·I) ≤ [δ] = L/n",
    // reference tables
    deflTableTitle: "挠度限值参考",
    matTableTitle: "常用框料材料参数",
    colMat: "材料",
    colE: "E (MPa)",
    colF: "f (MPa)",
    colStd: "限值 / 依据",
    cityTableTitle: "主要城市基本风压 w₀（kN/m²，50 年重现期）",
    cityTableSub: "摘自 GB 50009-2012 附录 E；玻璃幕墙按 JGJ 102 基本风压不宜小于 0.30。",
    notesTitle: "使用说明",
    noteCommon1: "本工具计算门窗、幕墙等围护结构的抗风压承载力与挠度，采用简支梁均布风压模型，用于立柱、横梁、中挺等主要受力杆件的初步核算。",
    noteCommon2: "净压力系数为控制工况（一般为角部/边缘吸力）绝对值，含内外压组合；具体分区、有效受风面积折减须按所选规范细化。",
    noteCommon3: "复材（FRP）拉挤型材的 E、f 随牌号与铺层差异较大，预设仅为典型值，务必以厂家实测 datasheet 为准。",
    noteCommon4: "挠度校核采用使用/特征级风压；强度校核采用设计/极限级。玻璃面板、连接节点、预埋件、地震及温度作用须另行验算。",
    stdNoteGB: "中国：GB 50009-2012 荷载 + JGJ 102（幕墙）/ JGJ 214（门窗）；分项系数按 GB 55001-2021。",
    stdNoteASCE: "美国：ASCE 7-22 / IBC；V 为极限（强度级）3 秒阵风，须按 ASCE 7 风速图按 Risk Category 取值。",
    stdNoteEC: "欧盟/英国：EN 1991-1-4 + 各国国家附录（vb、地形、cpe 可能有国家调整）。",
    disclaimer: "本计算结果仅供工程初步估算与方案比选参考，不能替代正式结构计算书。最终设计须由具备资质的结构工程师依据完整现行规范复核并承担相应责任。",
    reset: "恢复默认",
  },
  en: {
    standardLabel: "Standard / region",
    stdGB: "🇨🇳 China · GB 50009",
    stdASCE: "🇺🇸 US · ASCE 7-22",
    stdEC: "🇪🇺 EU/UK · Eurocode",
    badgeGB: "Per China GB 50009-2012 Load Code · JGJ 102 / JGJ 214",
    badgeASCE: "Per ASCE 7-22 · Components & Cladding (§26 / §30)",
    badgeEC: "Per Eurocode EN 1991-1-4 · Wind actions",
    secWind: "① Wind-load parameters",
    secMember: "② Frame member (simply-supported beam)",
    seriesLabel: "Window profile series (nominal depth)",
    seriesNone: "Not specified / custom",
    city: "Location / basic wind pressure w₀",
    cityCustom: "Custom w₀",
    w0: "Basic wind pressure w₀ (kN/m²)",
    terrain: "Terrain roughness category",
    height: "Height above ground z (m)",
    shape: "Wind shape coefficient μsl",
    shapeHint: "Governing (usually corner/edge suction) magnitude for cladding",
    gammaW: "Wind load partial factor γw",
    gammaHint: "GB 55001-2021 uses 1.5; legacy GB 50009 used 1.4",
    asceSpeed: "Basic wind speed V (3-sec gust · ultimate)",
    asceExp: "Exposure category",
    asceCp: "Net pressure coeff |GCp − GCpi|",
    asceCpHint: "Enclosed GCpi = ±0.18; refine per ASCE 7 Fig 30.3-1 & effective wind area",
    asceLoadNote: "V is ultimate; strength uses 1.0W, deflection 0.6W (service)",
    ecVb: "Basic wind velocity vb (10-min mean · 50-yr)",
    ecCat: "Terrain category",
    ecCp: "Net pressure coeff |cpe − cpi|",
    ecCpHint: "Internal cpi = +0.2 / −0.3; refine per EN 1991-1-4 §7.2 zones",
    ecLoadNote: "qp is characteristic; strength uses γQ=1.5 (ULS), deflection characteristic",
    windSpeed: "Wind speed (m/s)",
    material: "Frame material",
    eMod: "Young's modulus E (MPa)",
    fStr: "Design bending strength f (MPa)",
    tribWidth: "Tributary width B (member spacing, mm)",
    span: "Design span L (mm)",
    sectMod: "Section modulus W (cm³)",
    inertia: "Moment of inertia I (cm⁴)",
    sectHint: "Get section properties from the Eng. Calc tool or the profile datasheet",
    deflLimit: "Deflection limit",
    liveMuz: "Height factor μz",
    liveBgz: "Gust factor βgz",
    liveKz: "Exposure coeff Kz",
    liveQz: "Velocity pressure qz",
    liveCe: "Exposure factor ce",
    liveQp: "Peak velocity pressure qp",
    liveP: "Service pressure",
    livePd: "Design pressure",
    resultTitle: "Wind-pressure check result",
    pass: "Wind-pressure requirement satisfied",
    fail: "Wind-pressure requirement NOT satisfied",
    strengthCheck: "Strength σ ≤ f",
    deflCheck: "Deflection δ ≤ [δ]",
    designMoment: "Design moment Md",
    utilization: "Utilisation",
    ok: "OK",
    ng: "Over",
    breakdown: "Breakdown",
    lineLoad: "Line load (service) qk",
    allowDefl: "Allowable deflection [δ]",
    formulaTitle: "Basis & formulas",
    fGB1: "Cladding wind-load standard value (GB 50009-2012 §8.1.1-2):",
    fGB1Eq: "wk = βgz · μsl · μz · w0",
    fGB2: "μz (§8.2.1) and βgz (§8.6.1) from terrain category and height z; below cutoff height the cutoff value applies.",
    fASCE1: "ASCE 7-22 velocity pressure (SI):",
    fASCE1Eq: "qz = 0.613 · Kz · Kzt · Kd · Ke · V²",
    fASCE2: "C&C design pressure p = qz·(GCp − GCpi); Kz = 2.01·(z/zg)^(2/α), Kd = 0.85, GCpi = ±0.18.",
    fEC1: "Eurocode EN 1991-1-4 peak velocity pressure:",
    fEC1Eq: "qp(z) = ce(z) · qb , qb = 0.5·ρ·vb²",
    fEC2: "ce(z) = [1+7·Iv]·cr², cr = kr·ln(z/z0), kr = 0.19·(z0/0.05)^0.07, ρ = 1.25 kg/m³.",
    fStrength: "Member strength (simply-supported beam, UDL): σ = Md / W , Md = γ · qk · L²/8 , qk = p·B",
    fDefl: "Member deflection (service wind): δ = 5·qk·L⁴ / (384·E·I) ≤ [δ] = L/n",
    deflTableTitle: "Deflection-limit reference",
    matTableTitle: "Typical frame material parameters",
    colMat: "Material",
    colE: "E (MPa)",
    colF: "f (MPa)",
    colStd: "Limit / basis",
    cityTableTitle: "Basic wind pressure w₀ by city (kN/m², 50-yr)",
    cityTableSub: "From GB 50009-2012 Appendix E; for glass curtain walls JGJ 102 requires w₀ ≥ 0.30.",
    notesTitle: "Notes",
    noteCommon1: "This tool checks wind-pressure resistance and deflection of window / curtain-wall cladding members using a simply-supported UDL beam model — for preliminary sizing of mullions, transoms and meeting stiles.",
    noteCommon2: "The net pressure coefficient is the governing (usually corner/edge suction) magnitude including internal+external pressure; zone and effective-wind-area reduction must be refined per the selected code.",
    noteCommon3: "Pultruded FRP E and f vary widely by grade and lay-up; presets are typical values only — always confirm against the manufacturer's measured datasheet.",
    noteCommon4: "Deflection uses the service/characteristic wind; strength uses the design/ultimate level. Glass panels, connections, embeds, seismic and thermal actions must be checked separately.",
    stdNoteGB: "China: GB 50009-2012 loads + JGJ 102 (curtain wall) / JGJ 214 (windows); partial factor per GB 55001-2021.",
    stdNoteASCE: "US: ASCE 7-22 / IBC; V is the ultimate (strength-level) 3-sec gust — take it from the ASCE 7 wind maps for the Risk Category.",
    stdNoteEC: "EU/UK: EN 1991-1-4 + national annexes (vb, terrain, cpe may be nationally adjusted).",
    disclaimer: "Results are for preliminary estimation and scheme comparison only and do not replace a formal structural calculation. Final design must be reviewed and signed off by a qualified structural engineer per the full current codes.",
    reset: "Reset defaults",
  },
};

const DEFAULTS = {
  // GB
  cityIdx: 3, // 重庆 Chongqing
  w0: 0.4,
  terrain: "C" as Terrain,
  muSl: 1.0,
  gammaW: 1.5,
  // ASCE
  asceV: 51,
  asceExp: "C" as AsceExposure,
  asceCp: 1.3,
  // EC
  ecVb: 22,
  ecCat: "II" as EcTerrain,
  ecCp: 1.3,
  // shared
  z: 30,
  series: 0,
  matKey: "frp23",
  E: 23000,
  f: 80,
  B: 1000,
  L: 3000,
  W: 90,
  I: 400,
  deflN: 180,
};

function fmt(v: number, d = 2) {
  if (!isFinite(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export default function WindLoadCalculator() {
  const locale = useLocale();
  const isEn = locale === "en";
  const s = isEn ? L10N.en : L10N.zh;

  // f1frp.com(中文)固定 GB；getfrp.com(英文)默认美标，可选地区
  const [standard, setStandard] = useState<WindStandard>(isEn ? "asce" : "gb");

  // GB
  const [cityIdx, setCityIdx] = useState(DEFAULTS.cityIdx);
  const [w0, setW0] = useState(DEFAULTS.w0);
  const [terrain, setTerrain] = useState<Terrain>(DEFAULTS.terrain);
  const [muSl, setMuSl] = useState(DEFAULTS.muSl);
  const [gammaW, setGammaW] = useState(DEFAULTS.gammaW);
  // ASCE
  const [asceV, setAsceV] = useState(DEFAULTS.asceV);
  const [asceExp, setAsceExp] = useState<AsceExposure>(DEFAULTS.asceExp);
  const [asceCp, setAsceCp] = useState(DEFAULTS.asceCp);
  // EC
  const [ecVb, setEcVb] = useState(DEFAULTS.ecVb);
  const [ecCat, setEcCat] = useState<EcTerrain>(DEFAULTS.ecCat);
  const [ecCp, setEcCp] = useState(DEFAULTS.ecCp);
  // shared
  const [z, setZ] = useState(DEFAULTS.z);
  const [series, setSeries] = useState(DEFAULTS.series);
  const [matKey, setMatKey] = useState(DEFAULTS.matKey);
  const [E, setE] = useState(DEFAULTS.E);
  const [f, setF] = useState(DEFAULTS.f);
  const [B, setB] = useState(DEFAULTS.B);
  const [L, setL] = useState(DEFAULTS.L);
  const [W, setW] = useState(DEFAULTS.W);
  const [I, setI] = useState(DEFAULTS.I);
  const [deflN, setDeflN] = useState(DEFAULTS.deflN);

  const member = { B, L, W, I, E, f, deflN };
  const r = useMemo(() => {
    if (standard === "asce")
      return computeASCE({ V: asceV, exp: asceExp, z, cp: asceCp, ...member });
    if (standard === "eurocode")
      return computeEC({ vb: ecVb, cat: ecCat, z, cp: ecCp, ...member });
    return computeGB({ w0, terrain, z, muSl, gammaW, ...member });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    standard,
    asceV,
    asceExp,
    asceCp,
    ecVb,
    ecCat,
    ecCp,
    w0,
    terrain,
    muSl,
    gammaW,
    z,
    B,
    L,
    W,
    I,
    E,
    f,
    deflN,
  ]);

  const badge =
    standard === "asce" ? s.badgeASCE : standard === "eurocode" ? s.badgeEC : s.badgeGB;

  function pickCity(idx: number) {
    setCityIdx(idx);
    if (idx >= 0) setW0(BASIC_WIND_PRESSURE[idx].w0);
  }
  function pickMaterial(key: string) {
    setMatKey(key);
    const m = MATERIALS.find((x) => x.key === key);
    if (m) {
      setE(m.E);
      setF(m.f);
    }
  }
  function pickSeries(n: number) {
    setSeries(n);
    if (n > 0) pickMaterial("frp23");
  }
  function resetAll() {
    setStandard(isEn ? "asce" : "gb");
    setCityIdx(DEFAULTS.cityIdx);
    setW0(DEFAULTS.w0);
    setTerrain(DEFAULTS.terrain);
    setMuSl(DEFAULTS.muSl);
    setGammaW(DEFAULTS.gammaW);
    setAsceV(DEFAULTS.asceV);
    setAsceExp(DEFAULTS.asceExp);
    setAsceCp(DEFAULTS.asceCp);
    setEcVb(DEFAULTS.ecVb);
    setEcCat(DEFAULTS.ecCat);
    setEcCp(DEFAULTS.ecCp);
    setZ(DEFAULTS.z);
    setSeries(DEFAULTS.series);
    setMatKey(DEFAULTS.matKey);
    setE(DEFAULTS.E);
    setF(DEFAULTS.f);
    setB(DEFAULTS.B);
    setL(DEFAULTS.L);
    setW(DEFAULTS.W);
    setI(DEFAULTS.I);
    setDeflN(DEFAULTS.deflN);
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

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    step = 1,
    min = 0,
  ) => (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Math.max(min, +e.target.value))}
      step={step}
      min={min}
      className={inputCls}
    />
  );

  const ratioBar = (ratio: number, pass: boolean) => (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${pass ? "bg-emerald-500" : "bg-red-500"}`}
        style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
      />
    </div>
  );

  // net-Cp preset buttons (ASCE / Eurocode)
  const cpPresets = (value: number, set: (v: number) => void, key: "asce" | "ec") => (
    <div className="flex flex-wrap gap-2">
      {NET_CP_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => set(p[key])}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            value === p[key]
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isEn ? p.en : p.zh} · {p[key].toFixed(1)}
        </button>
      ))}
      <input
        type="number"
        value={value}
        onChange={(e) => set(Math.max(0, +e.target.value))}
        step={0.1}
        min={0}
        className="w-20 rounded-md border bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
  );

  // live readout cells (standard-specific first two + service/design pressure)
  const liveCells: { label: string; value: string; accent?: boolean }[] =
    standard === "asce"
      ? [
          { label: s.liveKz, value: fmt(r.asce?.Kz ?? 0, 3) },
          { label: s.liveQz, value: fmt(r.asce?.qz ?? 0, 3) },
          { label: s.liveP, value: fmt(r.pService, 3), accent: true },
          { label: s.livePd, value: fmt(r.pDesign, 3) },
        ]
      : standard === "eurocode"
        ? [
            { label: s.liveCe, value: fmt(r.ec?.ce ?? 0, 3) },
            { label: s.liveQp, value: fmt(r.ec?.qp ?? 0, 3) },
            { label: s.liveP, value: fmt(r.pService, 3), accent: true },
            { label: s.livePd, value: fmt(r.pDesign, 3) },
          ]
        : [
            { label: s.liveMuz, value: fmt(r.gb?.muz ?? 0, 3) },
            { label: s.liveBgz, value: fmt(r.gb?.bgz ?? 0, 3) },
            { label: s.liveP, value: fmt(r.pService, 3), accent: true },
            { label: s.livePd, value: fmt(r.pDesign, 3) },
          ];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {badge}
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="shrink-0 rounded-md border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {s.reset}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Input panel */}
        <div className="space-y-6">
          {/* Section 1 — wind */}
          <div className="space-y-5 rounded-lg border bg-background p-6">
            <h3 className="text-sm font-bold">{s.secWind}</h3>

            {/* Standard/region selector — en only (zh 固定 GB) */}
            {isEn && (
              <div>
                <label className={labelCls}>{s.standardLabel}</label>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value as WindStandard)}
                  className={selectCls}
                >
                  <option value="asce">{s.stdASCE}</option>
                  <option value="eurocode">{s.stdEC}</option>
                  <option value="gb">{s.stdGB}</option>
                </select>
              </div>
            )}

            {/* GB inputs */}
            {standard === "gb" && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>{s.city}</label>
                    <select
                      value={cityIdx}
                      onChange={(e) => pickCity(+e.target.value)}
                      className={selectCls}
                    >
                      {BASIC_WIND_PRESSURE.map((c, i) => (
                        <option key={c.city} value={i}>
                          {isEn ? c.cityEn : c.city} · w₀ {c.w0.toFixed(2)}
                        </option>
                      ))}
                      <option value={-1}>{s.cityCustom}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{s.w0}</label>
                    <input
                      type="number"
                      value={w0}
                      onChange={(e) => {
                        setW0(Math.max(0, +e.target.value));
                        setCityIdx(-1);
                      }}
                      step={0.05}
                      min={0}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{s.terrain}</label>
                  <select
                    value={terrain}
                    onChange={(e) => setTerrain(e.target.value as Terrain)}
                    className={selectCls}
                  >
                    {(Object.keys(TERRAIN) as Terrain[]).map((k) => (
                      <option key={k} value={k}>
                        {isEn ? TERRAIN[k].labelEn : TERRAIN[k].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>{s.height}</label>
                    {numInput(z, setZ, 1, 0)}
                  </div>
                  <div>
                    <label className={labelCls}>{s.gammaW}</label>
                    <div className="flex gap-2 rounded-md border bg-muted/40 p-1">
                      <button type="button" onClick={() => setGammaW(1.5)} className={segBtn(gammaW === 1.5)}>
                        1.5
                      </button>
                      <button type="button" onClick={() => setGammaW(1.4)} className={segBtn(gammaW === 1.4)}>
                        1.4
                      </button>
                    </div>
                    <span className="mt-1 block text-xs text-muted-foreground">{s.gammaHint}</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{s.shape}</label>
                  <div className="flex flex-wrap gap-2">
                    {SHAPE_ZONES.map((zone) => (
                      <button
                        key={zone.key}
                        type="button"
                        onClick={() => setMuSl(zone.muSl)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          muSl === zone.muSl
                            ? "border-primary bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isEn ? zone.en : zone.zh} · {zone.muSl.toFixed(1)}
                      </button>
                    ))}
                    <input
                      type="number"
                      value={muSl}
                      onChange={(e) => setMuSl(Math.max(0, +e.target.value))}
                      step={0.1}
                      min={0}
                      className="w-20 rounded-md border bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="mt-1 block text-xs text-muted-foreground">{s.shapeHint}</span>
                </div>
              </>
            )}

            {/* ASCE inputs */}
            {standard === "asce" && (
              <>
                <div>
                  <label className={labelCls}>{s.asceSpeed}</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={asceV}
                      onChange={(e) => setAsceV(+e.target.value)}
                      className={selectCls}
                    >
                      {ASCE_WIND_SPEEDS.map((w) => (
                        <option key={w.V} value={w.V}>
                          {isEn ? w.en : w.zh}
                        </option>
                      ))}
                    </select>
                    <div className="w-28 shrink-0">
                      <input
                        type="number"
                        value={asceV}
                        onChange={(e) => setAsceV(Math.max(0, +e.target.value))}
                        step={1}
                        min={0}
                        className={inputCls}
                      />
                      <span className="mt-0.5 block text-center text-[10px] text-muted-foreground">
                        {s.windSpeed}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>{s.asceExp}</label>
                    <select
                      value={asceExp}
                      onChange={(e) => setAsceExp(e.target.value as AsceExposure)}
                      className={selectCls}
                    >
                      {(Object.keys(ASCE_EXPOSURE) as AsceExposure[]).map((k) => (
                        <option key={k} value={k}>
                          {isEn ? ASCE_EXPOSURE[k].en : ASCE_EXPOSURE[k].zh}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{s.height}</label>
                    {numInput(z, setZ, 1, 0)}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{s.asceCp}</label>
                  {cpPresets(asceCp, setAsceCp, "asce")}
                  <span className="mt-1 block text-xs text-muted-foreground">{s.asceCpHint}</span>
                </div>
                <div className="rounded-md bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                  {s.asceLoadNote}
                </div>
              </>
            )}

            {/* Eurocode inputs */}
            {standard === "eurocode" && (
              <>
                <div>
                  <label className={labelCls}>{s.ecVb}</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={ecVb}
                      onChange={(e) => setEcVb(+e.target.value)}
                      className={selectCls}
                    >
                      {EC_WIND_SPEEDS.map((w) => (
                        <option key={w.vb} value={w.vb}>
                          {isEn ? w.en : w.zh}
                        </option>
                      ))}
                    </select>
                    <div className="w-28 shrink-0">
                      <input
                        type="number"
                        value={ecVb}
                        onChange={(e) => setEcVb(Math.max(0, +e.target.value))}
                        step={1}
                        min={0}
                        className={inputCls}
                      />
                      <span className="mt-0.5 block text-center text-[10px] text-muted-foreground">
                        {s.windSpeed}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>{s.ecCat}</label>
                    <select
                      value={ecCat}
                      onChange={(e) => setEcCat(e.target.value as EcTerrain)}
                      className={selectCls}
                    >
                      {(Object.keys(EC_TERRAIN) as EcTerrain[]).map((k) => (
                        <option key={k} value={k}>
                          {isEn ? EC_TERRAIN[k].en : EC_TERRAIN[k].zh}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{s.height}</label>
                    {numInput(z, setZ, 1, 0)}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{s.ecCp}</label>
                  {cpPresets(ecCp, setEcCp, "ec")}
                  <span className="mt-1 block text-xs text-muted-foreground">{s.ecCpHint}</span>
                </div>
                <div className="rounded-md bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                  {s.ecLoadNote}
                </div>
              </>
            )}

            {/* live wind readout */}
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-center sm:grid-cols-4">
              {liveCells.map((c) => (
                <div key={c.label}>
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </span>
                  <span className={`text-sm font-bold ${c.accent ? "text-primary" : ""}`}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 — member */}
          <div className="space-y-5 rounded-lg border bg-background p-6">
            <h3 className="text-sm font-bold">{s.secMember}</h3>

            <div>
              <label className={labelCls}>{s.seriesLabel}</label>
              <select
                value={series}
                onChange={(e) => pickSeries(+e.target.value)}
                className={selectCls}
              >
                <option value={0}>{s.seriesNone}</option>
                {PROFILE_SERIES.map((p) => (
                  <option key={p.series} value={p.series}>
                    {isEn
                      ? `${p.series} series · ${p.depth} mm`
                      : `${p.series} 系列 · 公称框深 ${p.depth} mm`}
                  </option>
                ))}
              </select>
              {series > 0 && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {isEn
                    ? `Nominal frame depth ${series} mm · fill W, I from the profile datasheet`
                    : `公称框深 ${series} mm · W、I 请按型材实测 datasheet 填写`}
                </span>
              )}
            </div>

            <div>
              <label className={labelCls}>{s.material}</label>
              <select
                value={matKey}
                onChange={(e) => pickMaterial(e.target.value)}
                className={selectCls}
              >
                {MATERIALS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {isEn ? m.en : m.zh}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{s.eMod}</label>
                {numInput(E, setE, 1000, 0)}
              </div>
              <div>
                <label className={labelCls}>{s.fStr}</label>
                {numInput(f, setF, 5, 0)}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{s.tribWidth}</label>
                {numInput(B, setB, 50, 1)}
              </div>
              <div>
                <label className={labelCls}>{s.span}</label>
                {numInput(L, setL, 50, 1)}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{s.sectMod}</label>
                {numInput(W, setW, 1, 0)}
              </div>
              <div>
                <label className={labelCls}>{s.inertia}</label>
                {numInput(I, setI, 5, 0)}
              </div>
            </div>
            <span className="-mt-2 block text-xs text-muted-foreground">{s.sectHint}</span>

            <div>
              <label className={labelCls}>{s.deflLimit}</label>
              <select
                value={deflN}
                onChange={(e) => setDeflN(+e.target.value)}
                className={selectCls}
              >
                {DEFLECTION_LIMITS.map((d) => (
                  <option key={d.n} value={d.n}>
                    {isEn ? d.en : d.zh}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className="space-y-3">
          <div
            className={`rounded-lg border p-6 text-center ${
              r.pass
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {s.resultTitle}
            </span>
            <span
              className={`mt-2 block text-2xl font-extrabold ${
                r.pass
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {r.pass ? "✓ " + s.pass : "✗ " + s.fail}
            </span>
          </div>

          {/* strength */}
          <div className="rounded-lg border bg-background p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {s.strengthCheck}
              </span>
              <span
                className={`text-xs font-bold ${r.strengthPass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {r.strengthPass ? "✓ " + s.ok : "✗ " + s.ng}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-sm">
              <span>
                σ = <b>{fmt(r.sigma, 1)}</b> MPa
              </span>
              <span className="text-muted-foreground">f = {fmt(f, 0)} MPa</span>
            </div>
            {ratioBar(r.strengthRatio, r.strengthPass)}
            <span className="mt-1 block text-right text-xs text-muted-foreground">
              {s.utilization} {fmt(r.strengthRatio * 100, 0)}%
            </span>
          </div>

          {/* deflection */}
          <div className="rounded-lg border bg-background p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {s.deflCheck}
              </span>
              <span
                className={`text-xs font-bold ${r.deflPass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {r.deflPass ? "✓ " + s.ok : "✗ " + s.ng}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-sm">
              <span>
                δ = <b>{fmt(r.delta, 1)}</b> mm
              </span>
              <span className="text-muted-foreground">[δ] = {fmt(r.deltaLimit, 1)} mm</span>
            </div>
            {ratioBar(r.deflRatio, r.deflPass)}
            <span className="mt-1 block text-right text-xs text-muted-foreground">
              {s.utilization} {fmt(r.deflRatio * 100, 0)}%
            </span>
          </div>

          {/* breakdown */}
          <div className="rounded-lg border bg-background p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {s.breakdown}
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{s.liveP}</dt>
                <dd className="font-medium">{fmt(r.pService, 3)} kN/m²</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{s.livePd}</dt>
                <dd className="font-medium">{fmt(r.pDesign, 3)} kN/m²</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{s.lineLoad}</dt>
                <dd className="font-medium">{fmt(r.qk, 3)} kN/m</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{s.designMoment}</dt>
                <dd className="font-medium">{fmt(r.Md, 2)} kN·m</dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="text-muted-foreground">{s.allowDefl}</dt>
                <dd className="font-medium">{fmt(r.deltaLimit, 1)} mm</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* formulas */}
      <div className="mt-12 rounded-lg border bg-muted/30 p-6">
        <h3 className="text-sm font-bold">{s.formulaTitle}</h3>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
          {standard === "gb" && (
            <>
              <p>
                {s.fGB1}{" "}
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                  {s.fGB1Eq}
                </code>
              </p>
              <p>{s.fGB2}</p>
            </>
          )}
          {standard === "asce" && (
            <>
              <p>
                {s.fASCE1}{" "}
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                  {s.fASCE1Eq}
                </code>
              </p>
              <p>{s.fASCE2}</p>
            </>
          )}
          {standard === "eurocode" && (
            <>
              <p>
                {s.fEC1}{" "}
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                  {s.fEC1Eq}
                </code>
              </p>
              <p>{s.fEC2}</p>
            </>
          )}
          <p>
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
              {s.fStrength}
            </code>
          </p>
          <p>
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
              {s.fDefl}
            </code>
          </p>
        </div>
      </div>

      {/* deflection-limit + material reference */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold">{s.deflTableTitle}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-left">
                  <th className="pb-2 pr-4 font-bold">{s.colStd}</th>
                </tr>
              </thead>
              <tbody>
                {DEFLECTION_LIMITS.map((d) => (
                  <tr key={d.n} className={`border-b ${d.n === deflN ? "bg-primary/5" : ""}`}>
                    <td className="py-2 pr-4">{isEn ? d.en : d.zh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold">{s.matTableTitle}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-left">
                  <th className="pb-2 pr-4 font-bold">{s.colMat}</th>
                  <th className="pb-2 pr-4 font-bold">{s.colE}</th>
                  <th className="pb-2 font-bold">{s.colF}</th>
                </tr>
              </thead>
              <tbody>
                {MATERIALS.map((m) => (
                  <tr key={m.key} className={`border-b ${m.key === matKey ? "bg-primary/5" : ""}`}>
                    <td className="py-2 pr-4">
                      {isEn ? m.en : m.zh}
                      {m.verify && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">*</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {m.E.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 text-muted-foreground">{m.f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">* {s.noteCommon3}</p>
        </div>
      </div>

      {/* city w0 table — GB only */}
      {standard === "gb" && (
        <div className="mt-12">
          <h3 className="text-lg font-bold">{s.cityTableTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{s.cityTableSub}</p>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
            {BASIC_WIND_PRESSURE.map((c, i) => (
              <button
                key={c.city}
                type="button"
                onClick={() => pickCity(i)}
                className={`flex items-center justify-between rounded px-2 py-1 text-left transition-colors hover:bg-muted ${
                  cityIdx === i ? "bg-primary/5 font-medium" : ""
                }`}
              >
                <span>{isEn ? c.cityEn : c.city}</span>
                <span className="text-muted-foreground">{c.w0.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* notes */}
      <div className="mt-12 rounded-lg border bg-muted/30 p-6">
        <h3 className="text-sm font-bold">{s.notesTitle}</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>{s.noteCommon1}</li>
          <li>{s.noteCommon2}</li>
          <li>{s.noteCommon3}</li>
          <li>{s.noteCommon4}</li>
          <li>
            {standard === "asce"
              ? s.stdNoteASCE
              : standard === "eurocode"
                ? s.stdNoteEC
                : s.stdNoteGB}
          </li>
        </ol>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{s.disclaimer}</p>
      </div>
    </div>
  );
}
