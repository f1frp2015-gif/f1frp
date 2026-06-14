"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import type { Geometry } from "@/lib/quote/types";
import { computeBeam, type SupportCase } from "@/lib/calc/beam";

type SectionType = "round" | "square" | "rect" | "i_beam";

const MODULUS_PRESETS: { zh: string; en: string; gpa: number }[] = [
  { zh: "玻纤拉挤 UP/VE ≈23", en: "GFRP pultrusion ≈23", gpa: 23 },
  { zh: "ECR/高强玻纤 ≈28", en: "ECR / high-strength ≈28", gpa: 28 },
  { zh: "碳纤拉挤 ≈120", en: "CFRP pultrusion ≈120", gpa: 120 },
];

type Dims = {
  od: number; id: number;
  sqSide: number; sqT: number;
  rW: number; rH: number; rT: number;
  ibBf: number; ibTf: number; ibH: number; ibTw: number;
};

const DEFAULT_DIMS: Dims = {
  od: 50, id: 44,
  sqSide: 50, sqT: 4,
  rW: 80, rH: 40, rT: 4,
  ibBf: 100, ibTf: 8, ibH: 100, ibTw: 6,
};

function buildGeometry(type: SectionType, d: Dims): Geometry {
  switch (type) {
    case "round": return { type: "round", od: d.od, id: d.id };
    case "square": return { type: "square", side: d.sqSide, t: d.sqT };
    case "rect": return { type: "rect", w: d.rW, h: d.rH, t: d.rT };
    case "i_beam": return { type: "i_beam", bf: d.ibBf, tf: d.ibTf, h: d.ibH, tw: d.ibTw };
  }
}

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function CalcClient() {
  const isEn = useLocale() === "en";
  const T = (zh: string, en: string) => (isEn ? en : zh);

  const [type, setType] = useState<SectionType>("square");
  const [dims, setDims] = useState<Dims>(DEFAULT_DIMS);
  const [modulusGPa, setModulusGPa] = useState(23);
  const [spanMm, setSpanMm] = useState(2000);
  const [support, setSupport] = useState<SupportCase>("ss_udl");
  const [load, setLoad] = useState(1000);

  const isUdl = support === "ss_udl" || support === "cant_udl";
  const geometry = buildGeometry(type, dims);
  const r = computeBeam({ geometry, modulusGPa, spanMm, support, load });

  const setD = (k: keyof Dims, v: number) => setDims((p) => ({ ...p, [k]: v }));

  const SECTIONS: { id: SectionType; zh: string; en: string }[] = [
    { id: "round", zh: "圆管", en: "Round tube" },
    { id: "square", zh: "方管", en: "Square tube" },
    { id: "rect", zh: "矩管", en: "Rect tube" },
    { id: "i_beam", zh: "工字梁", en: "I-beam" },
  ];

  const SUPPORTS: { id: SupportCase; zh: string; en: string }[] = [
    { id: "ss_udl", zh: "简支梁 · 均布载荷", en: "Simply supported · UDL" },
    { id: "ss_point", zh: "简支梁 · 跨中集中", en: "Simply supported · center point" },
    { id: "cant_udl", zh: "悬臂梁 · 均布载荷", en: "Cantilever · UDL" },
    { id: "cant_point", zh: "悬臂梁 · 端部集中", en: "Cantilever · end point" },
  ];

  const dimFields: { k: keyof Dims; zh: string; en: string }[] =
    type === "round"
      ? [{ k: "od", zh: "外径 OD", en: "OD" }, { k: "id", zh: "内径 ID(实心=0)", en: "ID (0=solid)" }]
      : type === "square"
        ? [{ k: "sqSide", zh: "边长", en: "Side" }, { k: "sqT", zh: "壁厚 t", en: "Wall t" }]
        : type === "rect"
          ? [{ k: "rW", zh: "宽 w", en: "Width w" }, { k: "rH", zh: "高 h", en: "Height h" }, { k: "rT", zh: "壁厚 t", en: "Wall t" }]
          : [{ k: "ibBf", zh: "翼缘宽 bf", en: "Flange bf" }, { k: "ibTf", zh: "翼缘厚 tf", en: "Flange tf" }, { k: "ibH", zh: "总高 h", en: "Height h" }, { k: "ibTw", zh: "腹板厚 tw", en: "Web tw" }];

  const labelCls = "mb-1 block text-[12px] font-medium text-muted-foreground";
  const inputCls = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-foreground/40";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {T("FRP 型材 受弯核算", "FRP Profile Bending Check")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {T(
            "线弹性快速估算:截面惯性矩、最大挠度、跨高比、最大弯曲应力。v1 支持圆管/方管/矩管/工字梁。",
            "Linear-elastic estimate: moment of inertia, max deflection, span/deflection, max bending stress. v1: round / square / rect tube + I-beam.",
          )}
        </p>
      </div>

      {/* 截面 */}
      <div>
        <div className={labelCls}>{T("截面类型", "Section")}</div>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setType(s.id)}
              className={[
                "rounded-md border px-3 py-1.5 text-[13px] transition-colors",
                type === s.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              ].join(" ")}
            >
              {T(s.zh, s.en)}
            </button>
          ))}
        </div>
      </div>

      {/* 尺寸 */}
      <div>
        <div className={labelCls}>{T("截面尺寸 (mm)", "Dimensions (mm)")}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {dimFields.map((f) => (
            <div key={f.k}>
              <label className="mb-1 block text-[11px] text-muted-foreground">{T(f.zh, f.en)}</label>
              <input
                type="number"
                inputMode="decimal"
                value={dims[f.k]}
                onChange={(e) => setD(f.k, Number(e.target.value))}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 模量 + 跨距 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className={labelCls}>{T("等效弯曲模量 E (GPa)", "Bending modulus E (GPa)")}</div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {MODULUS_PRESETS.map((p) => (
              <button
                key={p.gpa}
                type="button"
                onClick={() => setModulusGPa(p.gpa)}
                className={[
                  "rounded border px-2 py-1 text-[11px] transition-colors",
                  modulusGPa === p.gpa ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {T(p.zh, p.en)}
              </button>
            ))}
          </div>
          <input type="number" inputMode="decimal" value={modulusGPa} onChange={(e) => setModulusGPa(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <div className={labelCls}>{T("跨距 / 悬臂长 L (mm)", "Span / cantilever L (mm)")}</div>
          <input type="number" inputMode="decimal" value={spanMm} onChange={(e) => setSpanMm(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* 工况 + 载荷 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className={labelCls}>{T("支承与载荷工况", "Support & load case")}</div>
          <select value={support} onChange={(e) => setSupport(e.target.value as SupportCase)} className={inputCls}>
            {SUPPORTS.map((s) => (
              <option key={s.id} value={s.id}>{T(s.zh, s.en)}</option>
            ))}
          </select>
        </div>
        <div>
          <div className={labelCls}>{isUdl ? T("均布载荷 w (N/m)", "UDL w (N/m)") : T("集中载荷 P (N)", "Point load P (N)")}</div>
          <input type="number" inputMode="decimal" value={load} onChange={(e) => setLoad(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* 结果 */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Result label={T("惯性矩 I", "Inertia I")} value={`${fmt(r.iCm4)} cm⁴`} />
          <Result label={T("最大挠度 δ", "Max deflection δ")} value={`${fmt(r.deflectionMm)} mm`} highlight />
          <Result label={T("跨高比 L/δ", "Span/deflection")} value={r.spanOverDeflection ? `1 / ${fmt(r.spanOverDeflection, 0)}` : "—"} />
          <Result label={T("最大弯曲应力 σ", "Max stress σ")} value={`${fmt(r.stressMPa, 1)} MPa`} highlight />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {T(
          "估算口径:线弹性、小变形,按等效弯曲模量。复材为各向异性,关键结构请按规范 + 实测层压性能复核(剪切、局部屈曲、长期蠕变等未计入)。",
          "Estimate only: linear-elastic, small-deflection, using an equivalent bending modulus. FRP is anisotropic — verify critical structures against code + measured laminate properties (shear, local buckling, long-term creep not included).",
        )}
      </p>
    </div>
  );
}

function Result({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={["mt-1 font-semibold tabular-nums", highlight ? "text-lg text-foreground" : "text-base"].join(" ")}>
        {value}
      </div>
    </div>
  );
}
