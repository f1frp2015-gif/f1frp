import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

const schema = z.object({
  titleZh: z.string().describe("中文标题，自然通顺，不要逐字直译"),
  abstractZh: z
    .string()
    .describe("中文摘要，300-600 字，保留技术细节和数值"),
  keywordsZh: z
    .array(z.string())
    .max(8)
    .describe("4-8 个中文关键词"),
});

export type Translation = z.infer<typeof schema>;

export async function translateToChinese(
  input: { title: string; abstract?: string },
  opts?: { domainHint?: string }
): Promise<Translation> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
  }
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  const domain = opts?.domainHint ?? "FRP 纤维增强复合材料";
  const { experimental_output } = await generateText({
    model: google("gemini-2.5-flash"),
    experimental_output: Output.object({ schema }),
    system: `你是 ${domain} 领域的资深技术编辑，负责把英文学术/专利文献翻译为中文并做简要本地化。
要求：
1. 标题翻译遵循行业惯例（如 CFRP=碳纤维增强复合材料，RTM=树脂传递模塑）
2. 摘要保留关键技术指标（数值、温度、工艺参数），不要泛化
3. 关键词应覆盖材料类型、工艺、应用领域
4. 如果原文本就是中文，直接整理而非翻译。
5. 不要编造原文中不存在的数据。`,
    prompt: `原文标题：${input.title}\n\n原文摘要：${input.abstract ?? "（无）"}`,
  });
  return experimental_output;
}
