// OpenRouter-backed commentary generator (Claude Haiku via OpenRouter).
// Drop-in replacement for generatePaperCommentary / generatePatentCommentary
// when GOOGLE_GENERATIVE_AI_API_KEY quota is exhausted.
//
// Set OPENROUTER_API_KEY in env. Model is "anthropic/claude-haiku-4.5" by
// default; override with OPENROUTER_MODEL if you want a different slug.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callOpenRouter(
  messages: Msg[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // OpenRouter recommends these for analytics / free credit routing:
        "HTTP-Referer": "https://f1frp.com",
        "X-Title": "f1frp commentary backfill",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts?.maxTokens ?? 1200,
        temperature: opts?.temperature ?? 0.4,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`openrouter ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return text.length >= 80 ? text : null;
  } catch (e) {
    console.warn(
      "[openrouter] fail:",
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

const SYSTEM_PAPER = `你是复材站的学术观察员，专为 FRP 中文工程师解读论文，尤其关注拉挤 / RTM / HP-RTM / 热塑拉挤方向。

写作要求：
1. 输出 400-700 字纯中文段落（不要 markdown 标题、不要列表）
2. 首句点出"这篇研究对中国 FRP 工程实践（拉挤 / HP-RTM 方向优先）意味着什么"
3. 说明核心发现、方法/材料/工艺、与主流做法的差异
4. 末段给工程落地提示：适用场景、局限、可借鉴的参数或阈值
5. 不复述摘要；不吹捧；不编造未提及的数值
6. 语气：工程师气、理性、可读性高
7. 信息不足时明确说明"原摘要信息量有限"并给合理推断范围`;

const SYSTEM_PATENT = `你是复材站的技术观察员，专为 FRP 中文工程师解读专利。

写作要求：
1. 输出 350-600 字纯中文段落（不要 markdown 标题、不要列表）
2. 首句给出"这件专利讲的是什么工程要点、对实际生产/应用意味着什么"
3. 说明核心技术改进点、用到的材料/工艺/结构、相较传统方案的差异
4. 末段给工程落地提示：适用场景、风险点、可能的产业化瓶颈
5. 不复述权利要求；不用法律语气；不编造数值
6. 如果是中国专利，直接整理润色；英/日文专利基于翻译后的中文摘要解读
7. 语气：工程师气、理性、可读性高`;

export async function generatePaperCommentaryOR(p: {
  title: string;
  titleEn?: string;
  abstract?: string;
  journal?: string;
  year?: number;
  keywords?: string[];
}): Promise<string | null> {
  if (!p.title && !p.abstract) return null;
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
  return callOpenRouter(
    [
      { role: "system", content: SYSTEM_PAPER },
      { role: "user", content: prompt },
    ],
    { maxTokens: 1200 }
  );
}

export async function generatePatentCommentaryOR(p: {
  title: string;
  titleEn?: string;
  abstract?: string;
  applicant?: string;
  country?: string;
  grantDate?: string;
  filingDate?: string;
}): Promise<string | null> {
  if (!p.title && !p.abstract) return null;
  const prompt = [
    `# 待解读专利`,
    `标题（中文）：${p.title}`,
    p.titleEn && p.titleEn !== p.title ? `原始英文标题：${p.titleEn}` : "",
    p.applicant ? `申请人/权利人：${p.applicant}` : "",
    p.country
      ? `来源：${p.country}${p.grantDate ? `（授权 ${p.grantDate}）` : p.filingDate ? `（申请 ${p.filingDate}）` : ""}`
      : "",
    "",
    `# 摘要正文`,
    p.abstract ?? "（摘要为空）",
  ]
    .filter(Boolean)
    .join("\n");
  return callOpenRouter(
    [
      { role: "system", content: SYSTEM_PATENT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 900 }
  );
}
