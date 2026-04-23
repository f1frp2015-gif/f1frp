// Claude Opus 4.7 translator + commentary for the bulk pultrusion ingest.
// Kept separate from the daily cron (which still uses Gemini) so we can
// swap models without disturbing production.

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const MODEL_ID = "claude-opus-4-7";

const translationSchema = z.object({
  titleZh: z.string().describe("中文标题，自然通顺，不逐字直译"),
  abstractZh: z
    .string()
    .describe("中文摘要，300-600 字，保留技术细节和数值"),
  keywordsZh: z
    .array(z.string())
    .max(8)
    .describe("4-8 个中文关键词"),
});

export type OpusTranslation = z.infer<typeof translationSchema>;

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return createAnthropic({ apiKey });
}

export async function opusTranslate(
  input: { title: string; abstract?: string },
  opts?: { domainHint?: string }
): Promise<OpusTranslation> {
  const anthropic = getAnthropic();
  const domain = opts?.domainHint ?? "FRP 纤维增强复合材料，特别是拉挤工艺方向";

  const { experimental_output } = await generateText({
    model: anthropic(MODEL_ID),
    experimental_output: Output.object({ schema: translationSchema }),
    system: `你是 ${domain} 领域的资深技术编辑。

翻译要求：
1. 标题遵循行业惯例：CFRP=碳纤维增强复合材料、GFRP=玻璃纤维增强复合材料、RTM=树脂传递模塑、UD=单向、SMC=片状模塑复合、BMI=双马来酰亚胺
2. 拉挤工艺术语：pultrusion=拉挤、die=模具、pulling force=牵引力、preform=预成型件、roving=粗纱、impregnation=浸胶、heating zone=加热区
3. 摘要保留关键数值（温度、速度、力学性能、纤维体积含量等）
4. 关键词覆盖材料类型、工艺步骤、应用领域
5. 原文已是中文则整理润色，不要机翻再翻
6. 不要编造原文中不存在的数据`,
    prompt: `原文标题：${input.title}\n\n原文摘要：${input.abstract ?? "（无）"}`,
    maxOutputTokens: 3000,
  });
  return experimental_output;
}

const SYSTEM_COMMENTARY = `你是复材站的学术观察员，专为 FRP 中文工程师解读论文，尤其关注拉挤工艺方向。

写作要求：
1. 400-700 字纯中文段落（不用 markdown 标题，不用列表）
2. 首句点出"这篇研究对中国 FRP 工程实践（拉挤方向优先）意味着什么"
3. 接着说明核心发现、用到的方法/材料/工艺、与主流做法的差异
4. 末段给工程落地提示：适用场景、局限、可借鉴的参数或阈值
5. 拉挤相关内容要具体到工艺参数（拉挤速度、模具温度、固化曲线、纤维体积含量、制品缺陷）
6. 不复述摘要；不吹捧；不编造未提及的数值
7. 语气：工程师气、理性、可读性高
8. 信息不足时明确说明"原摘要信息量有限"并给合理推断范围`;

export async function opusCommentary(p: {
  title: string;
  titleEn?: string;
  abstract?: string;
  journal?: string;
  year?: number;
  keywords?: string[];
}): Promise<string | null> {
  if (!p.title && !p.abstract) return null;
  const anthropic = getAnthropic();

  const prompt = [
    `# 待解读论文`,
    `标题（中文）：${p.title}`,
    p.titleEn && p.titleEn !== p.title ? `原始英文标题：${p.titleEn}` : "",
    p.journal ? `来源：${p.journal}${p.year ? `（${p.year}）` : ""}` : "",
    p.keywords?.length ? `关键词：${p.keywords.join("、")}` : "",
    "",
    `# 摘要正文`,
    p.abstract ?? "（摘要为空）",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text } = await generateText({
      model: anthropic(MODEL_ID),
      system: SYSTEM_COMMENTARY,
      prompt,
      maxOutputTokens: 2000,
    });
    const cleaned = text.trim();
    if (cleaned.length < 80) return null;
    return cleaned;
  } catch (e) {
    console.warn(
      "[opus-commentary] failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}
