"use client";

// 客户端交互层 — 三种状态:idle / loading / result
// 双模式入口:NL 对话框 + 专业表单 tab 切换。NL 抽取出来后预填表单,
// 用户确认 → 调 estimate。这样即使 AI 抽错,用户也能改。

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  QuoteInput,
  QuoteResult,
  ExtractResult,
  ProfileType,
} from "@/lib/quote/types";

type FormState = {
  profileType: ProfileType;
  d1: string; d2: string; d3: string; d4: string; // 截面四元尺寸(每种型材含义不同)
  length_mm: string;
  quantity: string;
  fiber: QuoteInput["fiber"];
  resin: QuoteInput["resin"];
  fiber_content_pct: string;
  surface_veil: boolean;
  inner_veil: boolean;
  uv_coating: boolean;
  fire_retardant: boolean;
  food_grade: boolean;
  color: QuoteInput["color"];
};

const DEFAULT_FORM: FormState = {
  profileType: "square",
  d1: "40", d2: "40", d3: "3", d4: "",
  length_mm: "6000",
  quantity: "100",
  fiber: "e_glass",
  resin: "epoxy",
  fiber_content_pct: "70",
  surface_veil: true,
  inner_veil: false,
  uv_coating: false,
  fire_retardant: false,
  food_grade: false,
  color: "gray",
};

export function QuoteTool() {
  const t = useTranslations("PultrusionQuote");
  const [nlText, setNlText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [estimating, setEstimating] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "form">("chat");

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleExtract() {
    if (!nlText.trim() || nlText.trim().length < 5) return;
    setExtracting(true); setError(null);
    try {
      const res = await fetch("/api/quote/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlText }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "extract failed");
      }
      const ext: ExtractResult = await res.json();
      setExtractResult(ext);
      // 高置信度 → 预填表单 + 切到 form tab 让用户审一眼
      if (ext.confidence >= 60) {
        prefillFromExtract(ext);
        setTab("form");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "extract failed");
    } finally { setExtracting(false); }
  }

  function prefillFromExtract(ext: ExtractResult) {
    const p = ext.partial;
    const next: FormState = { ...DEFAULT_FORM };
    if (p.geometry) {
      next.profileType = p.geometry.type;
      switch (p.geometry.type) {
        case "round":
          next.d1 = String(p.geometry.od); next.d2 = String(p.geometry.id); break;
        case "square":
          next.d1 = String(p.geometry.side); next.d3 = String(p.geometry.t); break;
        case "rect":
          next.d1 = String(p.geometry.w); next.d2 = String(p.geometry.h);
          next.d3 = String(p.geometry.t); break;
        case "angle":
          next.d1 = String(p.geometry.leg); next.d3 = String(p.geometry.t); break;
        case "channel":
          next.d1 = String(p.geometry.w); next.d2 = String(p.geometry.h);
          next.d3 = String(p.geometry.t); break;
        case "i_beam":
          next.d1 = String(p.geometry.bf); next.d2 = String(p.geometry.h);
          next.d3 = String(p.geometry.tw); next.d4 = String(p.geometry.tf); break;
      }
    }
    if (p.length_mm) next.length_mm = String(p.length_mm);
    if (p.quantity) next.quantity = String(p.quantity);
    if (p.fiber) next.fiber = p.fiber;
    if (p.resin) next.resin = p.resin;
    if (p.fiber_content_pct) next.fiber_content_pct = String(p.fiber_content_pct);
    if (typeof p.surface_veil === "boolean") next.surface_veil = p.surface_veil;
    if (typeof p.inner_veil === "boolean") next.inner_veil = p.inner_veil;
    if (typeof p.uv_coating === "boolean") next.uv_coating = p.uv_coating;
    if (typeof p.fire_retardant === "boolean") next.fire_retardant = p.fire_retardant;
    if (typeof p.food_grade === "boolean") next.food_grade = p.food_grade;
    if (p.color) next.color = p.color;
    setForm(next);
  }

  function buildInput(): QuoteInput | { error: string } {
    const num = (s: string) => Number(s);
    const d1 = num(form.d1), d2 = num(form.d2), d3 = num(form.d3), d4 = num(form.d4);
    let geometry: QuoteInput["geometry"];
    switch (form.profileType) {
      case "round":
        if (!d1) return { error: t("error.missing_od") };
        geometry = { type: "round", od: d1, id: d2 || 0 }; break;
      case "square":
        if (!d1 || !d3) return { error: t("error.missing_square") };
        geometry = { type: "square", side: d1, t: d3 }; break;
      case "rect":
        if (!d1 || !d2 || !d3) return { error: t("error.missing_rect") };
        geometry = { type: "rect", w: d1, h: d2, t: d3 }; break;
      case "angle":
        if (!d1 || !d3) return { error: t("error.missing_angle") };
        geometry = { type: "angle", leg: d1, t: d3 }; break;
      case "channel":
        if (!d1 || !d2 || !d3) return { error: t("error.missing_channel") };
        geometry = { type: "channel", w: d1, h: d2, t: d3 }; break;
      case "i_beam":
        if (!d1 || !d2 || !d3 || !d4) return { error: t("error.missing_ibeam") };
        geometry = { type: "i_beam", bf: d1, h: d2, tw: d3, tf: d4 }; break;
    }
    const length_mm = num(form.length_mm);
    const quantity = num(form.quantity);
    if (!length_mm || !quantity) return { error: t("error.missing_qty") };
    return {
      geometry,
      length_mm,
      quantity: Math.floor(quantity),
      fiber: form.fiber,
      resin: form.resin,
      fiber_content_pct: num(form.fiber_content_pct) || 70,
      surface_veil: form.surface_veil,
      inner_veil: form.inner_veil,
      uv_coating: form.uv_coating,
      fire_retardant: form.fire_retardant,
      food_grade: form.food_grade,
      color: form.color,
    };
  }

  async function handleEstimate() {
    const input = buildInput();
    if ("error" in input) { setError(input.error); return; }
    setEstimating(true); setError(null);
    try {
      const res = await fetch("/api/quote/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          source: extractResult ? "nl_chat" : "form",
          rawUserText: extractResult ? nlText : undefined,
          extractConfidence: extractResult?.confidence,
          extractMissing: extractResult?.missing,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "estimate failed");
      }
      const data = await res.json();
      setResult(data.result);
      setExplanation(data.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "estimate failed");
    } finally { setEstimating(false); }
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "chat" | "form")}>
        <TabsList>
          <TabsTrigger value="chat">{t("tabs.chat")}</TabsTrigger>
          <TabsTrigger value="form">{t("tabs.form")}</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4 space-y-3">
          <Textarea
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            placeholder={t("chat.placeholder")}
            rows={3}
            maxLength={1500}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            {t.raw("chat.examples").map((ex: string, i: number) => (
              <button
                key={i}
                className="rounded border border-border/70 px-2 py-1 hover:bg-accent"
                onClick={() => setNlText(ex)}
                type="button"
              >
                {ex}
              </button>
            ))}
          </div>
          <Button onClick={handleExtract} disabled={extracting || nlText.trim().length < 5}>
            {extracting ? t("chat.parsing") : t("chat.parse")}
          </Button>

          {extractResult && (
            <Card className="border-border/70">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={extractResult.confidence >= 60 ? "default" : "outline"}>
                    {t("chat.confidence", { v: extractResult.confidence })}
                  </Badge>
                  {extractResult.confidence < 60 && (
                    <span className="text-muted-foreground">
                      {t("chat.lowConfidenceHint")}
                    </span>
                  )}
                </div>
                {extractResult.followup_question && (
                  <div className="rounded bg-accent/40 px-3 py-2 text-foreground">
                    {extractResult.followup_question}
                  </div>
                )}
                {extractResult.missing.length > 0 && (
                  <div className="text-muted-foreground">
                    {t("chat.missing")}: {extractResult.missing.join("、")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="form" className="mt-4">
          <FormSection form={form} set={set} t={t} />
          <Button className="mt-4" onClick={handleEstimate} disabled={estimating}>
            {estimating ? t("form.estimating") : t("form.estimate")}
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="rounded border border-red-500/30 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <ResultCard result={result} explanation={explanation} t={t} />
      )}
    </div>
  );
}

function FormSection({
  form, set, t,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("form.profileType")}>
        <select
          className="w-full rounded border border-border/70 bg-background px-3 py-2 text-sm"
          value={form.profileType}
          onChange={(e) => set("profileType", e.target.value as ProfileType)}
        >
          <option value="round">{t("form.profile.round")}</option>
          <option value="square">{t("form.profile.square")}</option>
          <option value="rect">{t("form.profile.rect")}</option>
          <option value="angle">{t("form.profile.angle")}</option>
          <option value="channel">{t("form.profile.channel")}</option>
          <option value="i_beam">{t("form.profile.i_beam")}</option>
        </select>
      </Field>

      <GeometryInputs form={form} set={set} t={t} />

      <Field label={t("form.length_mm")}>
        <Input value={form.length_mm} onChange={(e) => set("length_mm", e.target.value)} inputMode="numeric" />
      </Field>
      <Field label={t("form.quantity")}>
        <Input value={form.quantity} onChange={(e) => set("quantity", e.target.value)} inputMode="numeric" />
      </Field>

      <Field label={t("form.fiber")}>
        <select className="w-full rounded border border-border/70 bg-background px-3 py-2 text-sm"
          value={form.fiber} onChange={(e) => set("fiber", e.target.value as QuoteInput["fiber"])}>
          <option value="e_glass">{t("form.fiberOpt.e_glass")}</option>
          <option value="ecr_glass">{t("form.fiberOpt.ecr_glass")}</option>
          <option value="carbon">{t("form.fiberOpt.carbon")}</option>
          <option value="hybrid">{t("form.fiberOpt.hybrid")}</option>
        </select>
      </Field>
      <Field label={t("form.resin")}>
        <select className="w-full rounded border border-border/70 bg-background px-3 py-2 text-sm"
          value={form.resin} onChange={(e) => set("resin", e.target.value as QuoteInput["resin"])}>
          <option value="up">{t("form.resinOpt.up")}</option>
          <option value="epoxy">{t("form.resinOpt.epoxy")}</option>
          <option value="ve">{t("form.resinOpt.ve")}</option>
          <option value="phenolic">{t("form.resinOpt.phenolic")}</option>
          <option value="pu">{t("form.resinOpt.pu")}</option>
        </select>
      </Field>

      <Field label={t("form.fiber_content_pct")}>
        <Input value={form.fiber_content_pct} onChange={(e) => set("fiber_content_pct", e.target.value)} inputMode="numeric" />
      </Field>
      <Field label={t("form.color")}>
        <select className="w-full rounded border border-border/70 bg-background px-3 py-2 text-sm"
          value={form.color} onChange={(e) => set("color", e.target.value as QuoteInput["color"])}>
          <option value="gray">{t("form.colorOpt.gray")}</option>
          <option value="black">{t("form.colorOpt.black")}</option>
          <option value="white">{t("form.colorOpt.white")}</option>
          <option value="custom">{t("form.colorOpt.custom")}</option>
        </select>
      </Field>

      <div className="col-span-full grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Toggle label={t("form.surface_veil")} v={form.surface_veil} onChange={(b) => set("surface_veil", b)} />
        <Toggle label={t("form.inner_veil")} v={form.inner_veil} onChange={(b) => set("inner_veil", b)} />
        <Toggle label={t("form.uv_coating")} v={form.uv_coating} onChange={(b) => set("uv_coating", b)} />
        <Toggle label={t("form.fire_retardant")} v={form.fire_retardant} onChange={(b) => set("fire_retardant", b)} />
        <Toggle label={t("form.food_grade")} v={form.food_grade} onChange={(b) => set("food_grade", b)} />
      </div>
    </div>
  );
}

function GeometryInputs({
  form, set, t,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  switch (form.profileType) {
    case "round":
      return (
        <>
          <Field label={t("form.geom.od")}><Input value={form.d1} onChange={(e) => set("d1", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.id")}><Input value={form.d2} onChange={(e) => set("d2", e.target.value)} inputMode="numeric" /></Field>
        </>
      );
    case "square":
      return (
        <>
          <Field label={t("form.geom.side")}><Input value={form.d1} onChange={(e) => set("d1", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.t")}><Input value={form.d3} onChange={(e) => set("d3", e.target.value)} inputMode="numeric" /></Field>
        </>
      );
    case "rect":
    case "channel":
      return (
        <>
          <Field label={t("form.geom.w")}><Input value={form.d1} onChange={(e) => set("d1", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.h")}><Input value={form.d2} onChange={(e) => set("d2", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.t")}><Input value={form.d3} onChange={(e) => set("d3", e.target.value)} inputMode="numeric" /></Field>
        </>
      );
    case "angle":
      return (
        <>
          <Field label={t("form.geom.leg")}><Input value={form.d1} onChange={(e) => set("d1", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.t")}><Input value={form.d3} onChange={(e) => set("d3", e.target.value)} inputMode="numeric" /></Field>
        </>
      );
    case "i_beam":
      // GB/T 706 标注顺序:bf × h × tw × tf  → d1=bf, d2=h, d3=tw, d4=tf
      return (
        <>
          <Field label={t("form.geom.bf")}><Input value={form.d1} onChange={(e) => set("d1", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.h_ibeam")}><Input value={form.d2} onChange={(e) => set("d2", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.tw")}><Input value={form.d3} onChange={(e) => set("d3", e.target.value)} inputMode="numeric" /></Field>
          <Field label={t("form.geom.tf")}><Input value={form.d4} onChange={(e) => set("d4", e.target.value)} inputMode="numeric" /></Field>
        </>
      );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

function ResultCard({
  result, explanation, t,
}: {
  result: QuoteResult;
  explanation: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  // 国内侧(zh)严格遵守"不出现代理 / RFQ 字样"(CLAUDE.md §7 + feedback_brand_separation):
  // CTA 直接 mailto 联系 f1frp2015@gmail.com,不跳 /rfq(那是海外代理通路)。
  // 海外侧(en / getfrp.com)保留 /rfq 跳转 — 那里是曜一代理服务的入口。
  const locale = useLocale();
  const isZh = locale === "zh";
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("result.eyebrow")}
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            ¥{result.unit_price_low_cny} – ¥{result.unit_price_high_cny}
            <span className="ml-2 text-sm font-normal text-muted-foreground">/ m</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t("result.totalRange", {
              low: result.total_low_cny.toLocaleString(),
              high: result.total_high_cny.toLocaleString(),
              meters: result.total_meters.toLocaleString(),
            })}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("result.breakdownEyebrow")}
          </div>
          <div className="mt-2 space-y-1">
            {result.breakdown.filter((b) => b.pct >= 1).map((b) => (
              <div key={b.key} className="flex items-center gap-3 text-sm">
                <div className="w-24 text-muted-foreground">{b.label_zh}</div>
                <div className="h-2 flex-1 overflow-hidden rounded bg-accent">
                  <div className="h-full bg-foreground/80" style={{ width: `${b.pct}%` }} />
                </div>
                <div className="w-12 text-right tabular-nums">{b.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {explanation && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("result.aiExplain")}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{explanation}</p>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="rounded border border-amber-500/30 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {result.warnings.map((w, i) => (<div key={i}>⚠ {w}</div>))}
          </div>
        )}

        <div className="border-t border-border/70 pt-4">
          <div className="text-sm text-muted-foreground">{t("result.cta.hint")}</div>
          <div className="mt-2 flex gap-2">
            {isZh ? (
              <a
                href={`mailto:${t("result.cta.email")}?subject=${encodeURIComponent(t("result.cta.emailSubject"))}`}
                className="inline-flex items-center rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/85"
              >
                {t("result.cta.emailButton")}
              </a>
            ) : (
              <Link href="/rfq" className="inline-flex items-center rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/85">
                {t("result.cta.rfq")}
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
