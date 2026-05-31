// 把 QuoteResult breakdown → 100-200 字自然语言解释,建立信任。
//
// 故意不让 AI 重写价格;只让它"用人话点出最大成本驱动 + 一个工程提示"。
// 失败时返回 null,前端走静态 fallback 文案。

import { generateText } from "ai";
import { getChatModelForRequest } from "@/lib/ai/provider";
import type { QuoteInput, QuoteResult } from "./types";

export async function explainQuote(
  input: QuoteInput,
  result: QuoteResult,
  req: Request,
  locale: "zh" | "en",
): Promise<string | null> {
  const model = getChatModelForRequest(req);

  // 构造紧凑的 breakdown 文本,不让模型重新算
  const breakdownLine = result.breakdown
    .filter((b) => b.pct >= 1)
    .map(
      (b) =>
        `${locale === "en" ? b.label_en : b.label_zh}: ¥${b.amount_per_meter_cny.toFixed(2)}/m (${b.pct}%)`,
    )
    .join(" · ");

  const profileDesc = describeProfile(input, locale);

  const system =
    locale === "en"
      ? `You are a senior FRP pultrusion engineer at f1frp.com. Given a rough-quote breakdown, write a 80-140 word plain-English paragraph explaining WHY this price range, calling out the biggest cost driver and one practical engineering note. DO NOT recompute or change any number. DO NOT add disclaimers about it being a rough quote (the UI already shows that). No markdown, no bullet lists, no headers.`
      : `你是 f1frp.com 的拉挤型材资深工程师。给定一个粗测分项,用 80-140 字自然中文段落,解释为什么是这个价格区间,点出最大成本驱动 + 一条工程提示。不要重算或修改任何数字。不要重复"粗测仅供参考"(UI 已写)。不要 markdown、不要列表、不要标题。`;

  const prompt =
    locale === "en"
      ? `Profile: ${profileDesc}\nUnit price range: ¥${result.unit_price_low_cny.toFixed(2)} – ¥${result.unit_price_high_cny.toFixed(2)} / m\nBreakdown: ${breakdownLine}\nTotal meters: ${result.total_meters.toFixed(0)} m\nWeight: ${result.weight_kg_per_m.toFixed(2)} kg/m`
      : `型材描述:${profileDesc}\n单米价格区间:¥${result.unit_price_low_cny.toFixed(2)} – ¥${result.unit_price_high_cny.toFixed(2)} / 米\n成本分项:${breakdownLine}\n订单总长:${result.total_meters.toFixed(0)} 米\n单米重量:${result.weight_kg_per_m.toFixed(2)} kg/m`;

  try {
    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature: 0.4,
      maxOutputTokens: 500,
    });
    const cleaned = text.trim();
    if (cleaned.length < 30) return null;
    return cleaned;
  } catch (e) {
    console.warn(
      "[quote-explain] failed:",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

function describeProfile(input: QuoteInput, locale: "zh" | "en"): string {
  const g = input.geometry;
  const isEn = locale === "en";
  const geomTxt = (() => {
    switch (g.type) {
      case "round":
        return isEn
          ? `round tube OD${g.od} × ID${g.id} mm`
          : `圆管 OD${g.od} × ID${g.id} mm`;
      case "square":
        return isEn
          ? `square tube ${g.side}×${g.side}×${g.t} mm`
          : `方管 ${g.side}×${g.side}×${g.t} mm`;
      case "rect":
        return isEn
          ? `rect tube ${g.w}×${g.h}×${g.t} mm`
          : `矩管 ${g.w}×${g.h}×${g.t} mm`;
      case "angle":
        return isEn
          ? `L-angle ${g.leg}×${g.leg}×${g.t} mm`
          : `角铁 ${g.leg}×${g.leg}×${g.t} mm`;
      case "channel":
        return isEn
          ? `channel ${g.w}×${g.h}×${g.t} mm`
          : `槽钢 ${g.w}×${g.h}×${g.t} mm`;
      case "i_beam":
        return isEn
          ? `I-beam ${g.bf}×${g.h}×${g.tw}×${g.tf} mm (bf×h×tw×tf)`
          : `工字梁 ${g.bf}×${g.h}×${g.tw}×${g.tf} mm (翼宽×总高×腹厚×翼厚)`;
      case "custom": {
        const noteTxt = g.note ? (isEn ? ` — "${g.note}"` : ` — "${g.note}"`) : "";
        return isEn
          ? `custom profile A=${g.area_mm2}mm² Pout=${g.outer_perim_mm}mm Pin=${g.inner_perim_mm}mm, complexity=${g.complexity}${noteTxt}`
          : `异形截面 面积=${g.area_mm2}mm² 外周=${g.outer_perim_mm}mm 内周=${g.inner_perim_mm}mm,复杂度=${g.complexity}${noteTxt}`;
      }
    }
  })();
  const matTxt = `${labelFiber(input.fiber, isEn)} + ${labelResin(input.resin, isEn)}`;
  const flags: string[] = [];
  if (input.fire_retardant) flags.push(isEn ? "flame retardant" : "阻燃");
  if (input.insulating) flags.push(isEn ? "insulating" : "绝缘");
  if (input.conductive) flags.push(isEn ? "conductive" : "导电");
  if (input.weatherproof) flags.push(isEn ? "weatherproof" : "耐候");
  if (input.food_grade) flags.push(isEn ? "food grade" : "食品级");
  if (input.surface_veil) flags.push(isEn ? "surface mat" : "表面毡");
  if (input.inner_veil) flags.push(isEn ? "inner mat" : "内毡");
  if (input.machining) flags.push(isEn ? "machining" : "机加工");
  if (input.painting) flags.push(isEn ? "painted" : "喷涂");
  if (input.packaging) flags.push(isEn ? "packaged" : "含包装");
  if (input.freight) flags.push(isEn ? "freight included" : "含运费");
  const flagTxt = flags.length ? `, ${flags.join(", ")}` : "";
  return `${geomTxt}, ${matTxt}${flagTxt}, ${input.quantity} × ${input.length_mm}mm`;
}

function labelFiber(f: QuoteInput["fiber"], en: boolean): string {
  if (en) {
    return { e_glass: "E-glass", ecr_glass: "ECR-glass", carbon: "carbon", hybrid: "hybrid" }[f];
  }
  return { e_glass: "无碱玻纤", ecr_glass: "ECR 玻纤", carbon: "碳纤", hybrid: "混编" }[f];
}

function labelResin(r: QuoteInput["resin"], en: boolean): string {
  if (en) {
    return { up: "UP", epoxy: "epoxy", ve: "vinyl ester", phenolic: "phenolic", pu: "PU" }[r];
  }
  return { up: "聚酯", epoxy: "环氧", ve: "乙烯基酯", phenolic: "酚醛", pu: "聚氨酯" }[r];
}
