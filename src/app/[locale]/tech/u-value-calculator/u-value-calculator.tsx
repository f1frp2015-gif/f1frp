"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

const frameSystems = [
  { id: "frp-65", label: "FRP 65系列 (65mm, 2腔)", labelEn: "FRP 65 series (65 mm, 2 chambers)", Uf: 1.4, depth: 65, faceWidth: 54 },
  { id: "frp-70", label: "FRP 70系列 (70mm, 3腔)", labelEn: "FRP 70 series (70 mm, 3 chambers)", Uf: 1.2, depth: 70, faceWidth: 58 },
  { id: "frp-80", label: "FRP 80系列 (80mm, 3腔)", labelEn: "FRP 80 series (80 mm, 3 chambers)", Uf: 1.0, depth: 80, faceWidth: 65 },
  { id: "frp-90", label: "FRP 90系列 (90mm, 3腔)", labelEn: "FRP 90 series (90 mm, 3 chambers)", Uf: 0.85, depth: 90, faceWidth: 72 },
  { id: "alu-no-break", label: "铝合金（无隔热条）", labelEn: "Aluminum (no thermal break)", Uf: 5.9, depth: 65, faceWidth: 50 },
  { id: "alu-break", label: "铝合金（PA隔热条）", labelEn: "Aluminum (PA thermal break)", Uf: 3.2, depth: 70, faceWidth: 55 },
  { id: "pvc-multi", label: "PVC多腔型", labelEn: "PVC multi-chamber", Uf: 1.5, depth: 70, faceWidth: 62 },
  { id: "pvc-steel", label: "PVC钢衬型", labelEn: "PVC with steel reinforcement", Uf: 1.8, depth: 70, faceWidth: 65 },
  { id: "timber", label: "木材（软木, 68mm）", labelEn: "Timber (softwood, 68 mm)", Uf: 1.4, depth: 75, faceWidth: 65 },
];

const glassConfigs = [
  { id: "dg-air", label: "双层 — 4/12Air/4", labelEn: "Double — 4/12Air/4", Ug: 2.8, thickness: 20 },
  { id: "dg-ar", label: "双层 — 4/16Ar/4 Low-E", labelEn: "Double — 4/16Ar/4 Low-E", Ug: 1.1, thickness: 24 },
  { id: "dg-ar-6", label: "双层 — 6/20Ar/6 Low-E", labelEn: "Double — 6/20Ar/6 Low-E", Ug: 1.0, thickness: 32 },
  { id: "tg-ar", label: "三层 — 4/14Ar/4/14Ar/4 双Low-E", labelEn: "Triple — 4/14Ar/4/14Ar/4 dual Low-E", Ug: 0.6, thickness: 40 },
  { id: "tg-kr", label: "三层 — 4/12Kr/4/12Kr/4 双Low-E", labelEn: "Triple — 4/12Kr/4/12Kr/4 dual Low-E", Ug: 0.5, thickness: 36 },
  { id: "tg-ar-wide", label: "三层 — 4/18Ar/4/18Ar/4 双Low-E", labelEn: "Triple — 4/18Ar/4/18Ar/4 dual Low-E", Ug: 0.55, thickness: 48 },
  { id: "qg-kr", label: "四层 — 3/12Kr/3/12Kr/3/12Kr/3 三Low-E", labelEn: "Quad — 3/12Kr/3/12Kr/3/12Kr/3 triple Low-E", Ug: 0.3, thickness: 48 },
];

const spacerTypes = [
  { id: "alu", label: "铝间隔条", labelEn: "Aluminum spacer", psi: 0.08 },
  { id: "steel", label: "钢间隔条", labelEn: "Steel spacer", psi: 0.06 },
  { id: "warm-basic", label: "暖边间隔条（标准）", labelEn: "Warm-edge spacer (standard)", psi: 0.04 },
  { id: "warm-premium", label: "暖边间隔条（高端/TGI/Swisspacer）", labelEn: "Warm-edge spacer (premium / TGI / Swisspacer)", psi: 0.03 },
];

const windowTypes = [
  { id: "fixed", label: "固定窗", labelEn: "Fixed window", sashWidth: 0 },
  { id: "casement", label: "平开窗 / 内倒窗", labelEn: "Casement / tilt-turn", sashWidth: 58 },
  { id: "sliding", label: "推拉门", labelEn: "Sliding door", sashWidth: 70 },
  { id: "entrance", label: "入户门（带玻璃）", labelEn: "Entrance door (with glass)", sashWidth: 85 },
];

function calcUw(
  width: number, height: number, faceWidth: number,
  Uf: number, Ug: number, psi: number, sashWidth: number,
) {
  const W = width / 1000;
  const H = height / 1000;
  const fw = faceWidth / 1000;
  const sw = sashWidth / 1000;
  const totalFrameW = fw + sw;
  const Aw = W * H;
  const glassW = W - 2 * totalFrameW;
  const glassH = H - 2 * totalFrameW;
  if (glassW <= 0 || glassH <= 0) return null;
  const Ag = glassW * glassH;
  const Af = Aw - Ag;
  const lg = 2 * (glassW + glassH);
  const Uw = (Ag * Ug + Af * Uf + lg * psi) / (Ag + Af);
  return { Uw: Math.round(Uw * 1000) / 1000, Ag, Af, glassRatio: Math.round((Ag / Aw) * 100), lg };
}

type RatingKey = "passive_premium" | "passive" | "low_energy" | "compliant" | "basic" | "below";

function getRatingKey(Uw: number): RatingKey {
  if (Uw <= 0.8) return "passive_premium";
  if (Uw <= 1.0) return "passive";
  if (Uw <= 1.3) return "low_energy";
  if (Uw <= 1.8) return "compliant";
  if (Uw <= 2.5) return "basic";
  return "below";
}

function getRatingColors(Uw: number) {
  if (Uw <= 1.0) return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" };
  if (Uw <= 1.3) return { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" };
  if (Uw <= 1.8) return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" };
  if (Uw <= 2.5) return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" };
  return { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" };
}

export default function UValueCalculator() {
  const t = useTranslations("Tech");
  const locale = useLocale();
  const isEn = locale === "en";
  const lab = (o: { label: string; labelEn?: string }) =>
    isEn && o.labelEn ? o.labelEn : o.label;

  const [frame, setFrame] = useState("frp-70");
  const [glass, setGlass] = useState("tg-ar");
  const [spacer, setSpacer] = useState("warm-basic");
  const [winType, setWinType] = useState("casement");
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1400);

  const selFrame = frameSystems.find((f) => f.id === frame)!;
  const selGlass = glassConfigs.find((g) => g.id === glass)!;
  const selSpacer = spacerTypes.find((s) => s.id === spacer)!;
  const selWinType = windowTypes.find((w) => w.id === winType)!;

  const result = useMemo(
    () => calcUw(width, height, selFrame.faceWidth, selFrame.Uf, selGlass.Ug, selSpacer.psi, selWinType.sashWidth),
    [width, height, selFrame, selGlass, selSpacer, selWinType],
  );

  const baseline = useMemo(
    () => calcUw(width, height, 50, 5.9, selGlass.Ug, 0.08, 0),
    [width, height, selGlass],
  );

  const improvement = result && baseline ? Math.round(((baseline.Uw - result.Uw) / baseline.Uw) * 100) : 0;

  const selectCls = "w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";
  const inputCls = "w-full rounded-md border bg-background px-3 py-2.5 text-sm text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Input panel */}
        <div className="space-y-5 rounded-lg border bg-background p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("uvalue.labelFrame")}</label>
              <select value={frame} onChange={(e) => setFrame(e.target.value)} className={selectCls}>
                <optgroup label={isEn ? "FRP composites" : "FRP复合材料"}>
                  {frameSystems.filter((f) => f.id.startsWith("frp")).map((f) => (
                    <option key={f.id} value={f.id}>{lab(f)}</option>
                  ))}
                </optgroup>
                <optgroup label={isEn ? "Comparison materials" : "对比材料"}>
                  {frameSystems.filter((f) => !f.id.startsWith("frp")).map((f) => (
                    <option key={f.id} value={f.id}>{lab(f)}</option>
                  ))}
                </optgroup>
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">
                U<sub>f</sub> = {selFrame.Uf} W/m²K · {selFrame.faceWidth} mm
              </span>
            </div>
            <div>
              <label className={labelCls}>{t("uvalue.labelGlass")}</label>
              <select value={glass} onChange={(e) => setGlass(e.target.value)} className={selectCls}>
                <optgroup label={isEn ? "Double IGU" : "双层中空玻璃"}>
                  {glassConfigs.filter((g) => g.id.startsWith("dg")).map((g) => (
                    <option key={g.id} value={g.id}>{lab(g)}</option>
                  ))}
                </optgroup>
                <optgroup label={isEn ? "Triple IGU" : "三层中空玻璃"}>
                  {glassConfigs.filter((g) => g.id.startsWith("tg")).map((g) => (
                    <option key={g.id} value={g.id}>{lab(g)}</option>
                  ))}
                </optgroup>
                <optgroup label={isEn ? "Quad IGU" : "四层中空玻璃"}>
                  {glassConfigs.filter((g) => g.id.startsWith("qg")).map((g) => (
                    <option key={g.id} value={g.id}>{lab(g)}</option>
                  ))}
                </optgroup>
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">
                U<sub>g</sub> = {selGlass.Ug} W/m²K · {selGlass.thickness} mm
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("uvalue.labelSpacer")}</label>
              <select value={spacer} onChange={(e) => setSpacer(e.target.value)} className={selectCls}>
                {spacerTypes.map((s) => <option key={s.id} value={s.id}>{lab(s)}</option>)}
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">Ψ<sub>g</sub> = {selSpacer.psi} W/mK</span>
            </div>
            <div>
              <label className={labelCls}>{t("uvalue.labelWinType")}</label>
              <select value={winType} onChange={(e) => setWinType(e.target.value)} className={selectCls}>
                {windowTypes.map((w) => <option key={w.id} value={w.id}>{lab(w)}</option>)}
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">
                {t("uvalue.sashWidth", { w: selWinType.sashWidth })}
                {selWinType.sashWidth === 0 ? ` ${t("uvalue.noSash")}` : ""}
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("uvalue.labelSize")}</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input type="number" value={width} onChange={(e) => setWidth(Math.max(200, +e.target.value))} min={200} max={4000} step={50} className={inputCls} />
                <span className="mt-0.5 block text-center text-xs text-muted-foreground">{t("uvalue.width")}</span>
              </div>
              <span className="text-muted-foreground">×</span>
              <div className="flex-1">
                <input type="number" value={height} onChange={(e) => setHeight(Math.max(200, +e.target.value))} min={200} max={4000} step={50} className={inputCls} />
                <span className="mt-0.5 block text-center text-xs text-muted-foreground">{t("uvalue.height")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <strong>EN ISO 10077-1:</strong>{" "}
            U<sub>w</sub> = (A<sub>g</sub>·U<sub>g</sub> + A<sub>f</sub>·U<sub>f</sub> + l<sub>g</sub>·Ψ<sub>g</sub>) / (A<sub>g</sub> + A<sub>f</sub>)
            <br />
            <span className="opacity-70">
              IECC/ASHRAE 90.1 (US) · CSA A440/NEB (CA) · EPBD (EU) · GB 50189/GB 50176 (CN)
            </span>
          </div>
        </div>

        {/* Result panel */}
        <div className="space-y-3">
          {result ? (
            <>
              <div className={`rounded-lg border p-8 text-center ${getRatingColors(result.Uw).bg}`}>
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("uvalue.totalUw")}<sub>w</sub>
                </span>
                <span className="mt-2 block text-5xl font-extrabold leading-none tracking-tight">
                  {result.Uw.toFixed(2)}
                </span>
                <span className="block text-sm text-muted-foreground">W/m²K</span>
                <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${getRatingColors(result.Uw).color} ${getRatingColors(result.Uw).bg}`}>
                  {t(`uvalue.ratings.${getRatingKey(result.Uw)}`)}
                </span>
              </div>

              <div className="rounded-lg border bg-background p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("uvalue.calcDetail")}</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("uvalue.glassArea")}<sub>g</sub>)</dt><dd className="font-medium">{result.Ag.toFixed(2)} m²</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("uvalue.frameArea")}<sub>f</sub>)</dt><dd className="font-medium">{result.Af.toFixed(2)} m²</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("uvalue.glassRatio")}</dt><dd className="font-medium">{result.glassRatio}%</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("uvalue.glassPerim")}<sub>g</sub>)</dt><dd className="font-medium">{result.lg.toFixed(2)} m</dd></div>
                  <div className="flex justify-between border-t pt-2"><dt className="text-muted-foreground">{t("uvalue.frameUf")}<sub>f</sub></dt><dd className="font-medium">{selFrame.Uf} W/m²K</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("uvalue.glassUg")}<sub>g</sub></dt><dd className="font-medium">{selGlass.Ug} W/m²K</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t("uvalue.spacerPsi")}<sub>g</sub></dt><dd className="font-medium">{selSpacer.psi} W/mK</dd></div>
                </dl>
              </div>

              {baseline && improvement > 0 && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                    {t("uvalue.vsAlu")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <span dangerouslySetInnerHTML={{ __html: t.raw("uvalue.vsAluText").toString()
                      .replace("{pct}", String(improvement))
                      .replace("{uw}", baseline.Uw.toFixed(2)) }} />
                  </p>
                </div>
              )}

              <div className="rounded-lg border bg-background p-5">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("uvalue.compliance")}</h4>
                <div className="space-y-1.5 text-xs">
                  {[
                    ...(isEn
                      ? [
                          { region: "🇨🇳 China", label: "Severe cold (Harbin)", max: 1.50, std: "GB 50189" },
                          { region: "🇨🇳 China", label: "Cold (Beijing)", max: 2.00, std: "GB 50189" },
                          { region: "🇨🇳 China", label: "Hot summer / cold winter (Shanghai)", max: 2.30, std: "GB 50189" },
                          { region: "🇨🇳 China", label: "Hot summer / warm winter (Guangzhou)", max: 3.00, std: "GB 50189" },
                          { region: "🇪🇺 EU", label: "Passive House", max: 0.80, std: "EN ISO 10077" },
                          { region: "🇪🇺 EU", label: "Near-zero energy", max: 1.30, std: "EPBD 2024" },
                          { region: "🇺🇸 US", label: "ENERGY STAR Northern", max: 1.70, std: "NFRC/IECC" },
                          { region: "🇨🇦 Canada", label: "Zone A (coldest)", max: 1.20, std: "CSA A440" },
                        ]
                      : [
                          { region: "🇨🇳 中国", label: "严寒地区（哈尔滨）", max: 1.50, std: "GB 50189" },
                          { region: "🇨🇳 中国", label: "寒冷地区（北京）", max: 2.00, std: "GB 50189" },
                          { region: "🇨🇳 中国", label: "夏热冬冷（上海）", max: 2.30, std: "GB 50189" },
                          { region: "🇨🇳 中国", label: "夏热冬暖（广州）", max: 3.00, std: "GB 50189" },
                          { region: "🇪🇺 欧洲", label: "被动房", max: 0.80, std: "EN ISO 10077" },
                          { region: "🇪🇺 欧洲", label: "近零能耗指令", max: 1.30, std: "EPBD 2024" },
                          { region: "🇺🇸 美国", label: "ENERGY STAR 北方", max: 1.70, std: "NFRC/IECC" },
                          { region: "🇨🇦 加拿大", label: "A区（最冷）", max: 1.20, std: "CSA A440" },
                        ]),
                  ].map((tbl) => (
                    <div key={`${tbl.region}-${tbl.label}`} className="flex items-center justify-between gap-1">
                      <span className="text-muted-foreground truncate">{tbl.region} {tbl.label}</span>
                      <span className={`shrink-0 font-medium ${result.Uw <= tbl.max ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        ≤ {tbl.max.toFixed(2)} {result.Uw <= tbl.max ? "✓" : ""}
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

      {/* Frame comparison table */}
      <div className="mt-14">
        <h3 className="text-2xl font-bold">{t("uvalue.frameCmpTitle")} U<sub>f</sub></h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("uvalue.frameCmpSub")}</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left">
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colFrameSystem")}</th>
                <th className="pb-2 pr-5 font-bold">U<sub>f</sub> (W/m²K)</th>
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colDepth")}</th>
                <th className="pb-2 pr-5 font-bold">{t("uvalue.colFaceWidth")}</th>
                <th className="pb-2 font-bold">{t("uvalue.colThermalBreak")}</th>
              </tr>
            </thead>
            <tbody>
              {frameSystems.map((f) => (
                <tr key={f.id} className={`border-b ${f.id.startsWith("frp") ? "bg-primary/5" : ""}`}>
                  <td className="py-2 pr-5">{f.label}</td>
                  <td className="py-2 pr-5 font-medium">{f.Uf}</td>
                  <td className="py-2 pr-5 text-muted-foreground">{f.depth}</td>
                  <td className="py-2 pr-5 text-muted-foreground">{f.faceWidth}</td>
                  <td className="py-2 text-muted-foreground">
                    {f.id.startsWith("frp") || f.id === "timber"
                      ? t("uvalue.noBreakNeeded")
                      : f.id === "alu-break"
                        ? t("uvalue.paBreakNeeded")
                        : f.id === "pvc-steel"
                          ? t("uvalue.steelBridge")
                          : f.id === "pvc-multi"
                            ? t("uvalue.lowStiffness")
                            : t("uvalue.highConductance")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* International standards table */}
      <div className="mt-14">
        <h3 className="text-2xl font-bold">{t("uvalue.stdTableTitle")}</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("uvalue.stdTableSub")}</p>
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
                    { region: "China", std: "GB 50189-2015", zone: "Severe cold (Harbin)", uw: "≤ 1.50", note: "Public buildings; residential per GB 50176" },
                    { region: "China", std: "GB 50189-2015", zone: "Cold (Beijing)", uw: "≤ 2.00", note: "Public buildings" },
                    { region: "China", std: "GB 50189-2015", zone: "Hot summer / cold winter (Shanghai)", uw: "≤ 2.30", note: "Public buildings; SHGC also limited" },
                    { region: "China", std: "GB 50189-2015", zone: "Hot summer / warm winter (Guangzhou)", uw: "≤ 3.00", note: "Public buildings; SHGC dominant" },
                    { region: "China", std: "GB 50176-2016", zone: "Residential (severe cold)", uw: "≤ 1.50", note: "Civil building thermal design code" },
                    { region: "China", std: "GB 50176-2016", zone: "Residential (cold)", uw: "≤ 2.00", note: "Civil building thermal design code" },
                    { region: "China", std: "GB/T 8484-2020", zone: "Test method", uw: "—", note: "Standard test for window thermal performance" },
                    { region: "EU", std: "EN ISO 10077-1", zone: "Passive House premium", uw: "≤ 0.80", note: "PHI certified; installed" },
                    { region: "EU", std: "EN ISO 10077-1", zone: "Passive House classic", uw: "≤ 0.85", note: "PHI certified" },
                    { region: "EU", std: "EPBD 2024", zone: "Near-zero energy (Central EU)", uw: "≤ 1.30", note: "Member states vary" },
                    { region: "US", std: "IECC 2024", zone: "Zone 4 (New York)", uw: "≤ 1.99", note: "NFRC tested" },
                    { region: "US", std: "IECC 2024", zone: "Zone 7-8 (Alaska)", uw: "≤ 1.70", note: "Extreme cold" },
                    { region: "US", std: "ENERGY STAR v7.0", zone: "Northern", uw: "≤ 1.70", note: "NFRC tested; strictest" },
                    { region: "Canada", std: "CSA A440/NEB", zone: "Zone A (coldest)", uw: "≤ 1.20", note: "Triple glazing typically required" },
                    { region: "Canada", std: "CSA A440/NEB", zone: "Zone C (warmest)", uw: "≤ 1.60", note: "Vancouver / southern Ontario" },
                  ]
                : [
                    { region: "中国", std: "GB 50189-2015", zone: "严寒地区（哈尔滨）", uw: "≤ 1.50", note: "公共建筑；住宅按GB 50176" },
                    { region: "中国", std: "GB 50189-2015", zone: "寒冷地区（北京）", uw: "≤ 2.00", note: "公共建筑" },
                    { region: "中国", std: "GB 50189-2015", zone: "夏热冬冷（上海）", uw: "≤ 2.30", note: "公共建筑；同时限制SHGC" },
                    { region: "中国", std: "GB 50189-2015", zone: "夏热冬暖（广州）", uw: "≤ 3.00", note: "公共建筑；SHGC为主要控制指标" },
                    { region: "中国", std: "GB 50176-2016", zone: "住宅（严寒）", uw: "≤ 1.50", note: "民用建筑热工设计规范" },
                    { region: "中国", std: "GB 50176-2016", zone: "住宅（寒冷）", uw: "≤ 2.00", note: "民用建筑热工设计规范" },
                    { region: "中国", std: "GB/T 8484-2020", zone: "测试方法", uw: "—", note: "窗户热工性能标准测试方法" },
                    { region: "欧洲", std: "EN ISO 10077-1", zone: "被动房高端", uw: "≤ 0.80", note: "PHI认证；含安装" },
                    { region: "欧洲", std: "EN ISO 10077-1", zone: "被动房经典", uw: "≤ 0.85", note: "PHI认证" },
                    { region: "欧洲", std: "EPBD 2024", zone: "近零能耗建筑(中欧)", uw: "≤ 1.30", note: "各成员国有差异" },
                    { region: "美国", std: "IECC 2024", zone: "4区（纽约）", uw: "≤ 1.99", note: "NFRC测试" },
                    { region: "美国", std: "IECC 2024", zone: "7-8区（阿拉斯加）", uw: "≤ 1.70", note: "极寒区" },
                    { region: "美国", std: "ENERGY STAR v7.0", zone: "北方区", uw: "≤ 1.70", note: "NFRC测试；最严格" },
                    { region: "加拿大", std: "CSA A440/NEB", zone: "A区（最冷）", uw: "≤ 1.20", note: "通常需三层玻璃" },
                    { region: "加拿大", std: "CSA A440/NEB", zone: "C区（最暖）", uw: "≤ 1.60", note: "温哥华/安省南部" },
                  ]
              ).map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-3 font-medium">{row.region}</td>
                  <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{row.std}</td>
                  <td className="py-2 pr-3">{row.zone}</td>
                  <td className="py-2 pr-3 font-medium">{row.uw}</td>
                  <td className="py-2 text-xs text-muted-foreground">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-md bg-muted/50 px-5 py-3 text-xs leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: t.raw("uvalue.stdDisclaimer") as string }}
        />
      </div>
    </div>
  );
}
