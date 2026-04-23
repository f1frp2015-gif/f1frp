// Generate a short Chinese engineer-facing commentary for a freshly ingested paper.
// Purpose: turn raw English abstracts into value for Chinese FRP engineers,
// making papers worth reading (and linking to) — feeds the content flywheel.

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const SYSTEM = `你是复材站的学术观察员，专为 FRP 中文工程师解读论文。

写作要求：
1. 输出 400-700 字纯中文段落（不要 markdown 标题、不要列表）
2. 先用 1 句话给出"这篇研究对中国 FRP 工程实践意味着什么"
3. 接着说明核心发现、用到的方法/材料/工艺、与主流做法的差异
4. 最后一段给工程落地提示：适用场景、局限、可借鉴的参数或阈值
5. 不要复述摘要；不要吹捧；不要编造未提及的数值或厂商名
6. 语气：理性、工程师气、可读性高，避免学术装腔

当信息不足时：诚实说明"原摘要信息量有限"，并给出合理推断的范围。不要编造细节。`;

type PaperInput = {
  title: string;
  titleEn?: string;
  abstract?: string;
  journal?: string;
  year?: number;
  keywords?: string[];
};

const SYSTEM_PATENT = `你是复材站的技术观察员，专为 FRP 中文工程师解读专利。

写作要求：
1. 输出 350-600 字纯中文段落（不要 markdown 标题、不要列表）
2. 先用 1 句话给出"这件专利讲的是什么工程要点、对实际生产/应用意味着什么"
3. 说明核心技术改进点、用到的材料/工艺/结构、相较传统方案的差异
4. 末段给工程落地提示：适用场景、规避风险点、可能的产业化瓶颈
5. 不要复述权利要求；不要法律语气；不要编造数值
6. 如果是中国专利，直接整理润色；英文/日文专利基于翻译后的中文摘要解读
7. 语气：工程师气、理性、可读性高
8. 信息不足时明确说明"摘要信息有限"并给合理推断`;

type PatentInput = {
  title: string;
  titleEn?: string;
  abstract?: string;
  applicant?: string;
  country?: string;
  grantDate?: string;
  filingDate?: string;
};

export async function generatePatentCommentary(
  p: PatentInput
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  if (!p.title && !p.abstract) return null;

  const google = createGoogleGenerativeAI({ apiKey });

  const prompt = [
    `# 待解读专利`,
    `标题（中文）：${p.title}`,
    p.titleEn && p.titleEn !== p.title ? `原始英文标题：${p.titleEn}` : "",
    p.applicant ? `申请人/权利人：${p.applicant}` : "",
    p.country ? `来源：${p.country}${p.grantDate ? `（授权 ${p.grantDate}）` : p.filingDate ? `（申请 ${p.filingDate}）` : ""}` : "",
    "",
    `# 摘要正文`,
    p.abstract ?? "（摘要为空）",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PATENT,
      prompt,
      maxOutputTokens: 1800,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
    });
    const cleaned = text.trim();
    if (cleaned.length < 80) return null;
    return cleaned;
  } catch (e) {
    console.warn(
      "[patent-commentary] failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

export async function generatePaperCommentary(p: PaperInput): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  if (!p.title && !p.abstract) return null;

  const google = createGoogleGenerativeAI({ apiKey });

  const prompt = [
    `# 待解读论文`,
    `标题（中文/翻译后）：${p.title}`,
    p.titleEn && p.titleEn !== p.title ? `原始英文标题：${p.titleEn}` : "",
    p.journal ? `来源刊物：${p.journal}${p.year ? `（${p.year}）` : ""}` : "",
    p.keywords?.length ? `关键词：${p.keywords.join("、")}` : "",
    "",
    `# 摘要正文`,
    p.abstract ?? "（摘要为空）",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM,
      prompt,
      maxOutputTokens: 2000,
      // gemini-2.5-flash defaults to reasoning mode, which eats the output
      // budget on silent thinking tokens — disable it so all tokens go to text.
      providerOptions: {
        google: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
    });
    const cleaned = text.trim();
    // Guard against empty or refusal-style outputs.
    if (cleaned.length < 80) return null;
    return cleaned;
  } catch (e) {
    console.warn(
      "[commentary] generation failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}
