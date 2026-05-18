import { streamText } from "ai";
import { NextResponse } from "next/server";

import { getChatModelForRequest, isChatConfiguredForRequest } from "@/lib/ai/provider";

// S2 询盘助手核心:接收一条海外询盘 + 工厂背景 → 流式生成中英双语回复草案。
//
// 客户端使用方式:在 dashboard/inquiries/[id] 页面点 "AI 草拟" 按钮 → POST
// 这条 route → 流式插入到 textarea。生成后由人工修改、确认、点 "发送"。
//
// 提示词版本化(prompt_version)记入 factory_inquiry_drafts.promptVersion,
// 一旦版本升级,旧 draft 的版本号可帮我们做 A/B 评测。
//
// 双语策略:总是同时输出中文 + 英文两段,工厂业务员看中文确认意思,然后
// 决定是否调整英文 → 一键发出。这是 v4.1 H1 假设的核心 UX 模式。

export const runtime = "nodejs";

const PROMPT_VERSION = "v0.1.0";

interface Body {
  /** 必填:买家原始询盘(邮件正文 / 表单文本)。 */
  originalText: string;
  /** 可选:邮件主题。 */
  originalSubject?: string;
  /** 买家信息(任意一项有助于 personalize)。 */
  buyerName?: string;
  buyerCompany?: string;
  buyerCountry?: string;
  /** 工厂自我介绍(产品 / 工艺 / 认证 / 规模),驱动 personalization。 */
  factoryProfile?: string;
  /** 工厂偏好语气(formal/neutral/friendly)。 */
  tone?: "formal" | "neutral" | "friendly";
}

function buildSystemPrompt(): string {
  return [
    "你是一名为中国复材工厂工作的资深外贸业务员 AI 助手。",
    "你的任务:为每一条海外询盘草拟一封中英双语的专业回复邮件。",
    "",
    "硬约束:",
    "1. 同时输出中文回复 + 英文回复两个版本。中文用于工厂业务员审核,英文是真正发出的版本。",
    "2. 永远先用一段简短的「需求复述+解读」让业务员快速理解 AI 是否理解到位。",
    "3. 报价、交期、MOQ 等数字相关的承诺,**禁止凭空生成**——只在工厂资料里有明确依据时才说。否则用「待确认」「需要根据具体规格核算」等中性表达。",
    "4. 不许提及任何竞争对手工厂名字。",
    "5. 不许讨论政治、宗教或敏感话题。",
    "",
    "回复结构:",
    "---",
    "## 询盘解读",
    "(2-3 句话:买家是谁、要什么、关键 spec、潜在 red flag)",
    "",
    "## 中文版回复(给业务员审稿)",
    "(类似真实业务员风格的中文邮件全文)",
    "",
    "## English Reply (final draft to send)",
    "(对应英文版本,语气根据买家国家自动调:US→直接、EU→正式、ME→尊称、APAC→中性)",
    "",
    "## 建议附件 / 后续动作",
    "(列 2-4 个具体动作,如「发产品 catalog PDF」「请买家提供 CAD 图」「报价前先打电话核数量」等)",
    "---",
  ].join("\n");
}

function buildUserPrompt(body: Body): string {
  const lines: string[] = [];

  lines.push("### 工厂资料(背景上下文)");
  lines.push(body.factoryProfile ?? "(暂未提供——使用通用复材工厂场景)");

  lines.push("");
  lines.push("### 偏好语气");
  lines.push(body.tone ?? "neutral");

  lines.push("");
  lines.push("### 买家信息");
  if (body.buyerName) lines.push(`姓名: ${body.buyerName}`);
  if (body.buyerCompany) lines.push(`公司: ${body.buyerCompany}`);
  if (body.buyerCountry) lines.push(`国家: ${body.buyerCountry}`);
  if (!body.buyerName && !body.buyerCompany && !body.buyerCountry) {
    lines.push("(无 — 从邮件正文推断)");
  }

  lines.push("");
  lines.push("### 邮件主题");
  lines.push(body.originalSubject ?? "(无)");

  lines.push("");
  lines.push("### 邮件原文");
  lines.push(body.originalText);

  lines.push("");
  lines.push(
    "现在请按上面的结构(询盘解读 / 中文版回复 / English Reply / 建议附件)给出回复草案。",
  );

  return lines.join("\n");
}

export async function POST(req: Request) {
  if (!isChatConfiguredForRequest(req)) {
    return NextResponse.json(
      {
        error:
          "AI 模型未配置。请确认 OPENROUTER_API_KEY 或 DEEPSEEK_API_KEY 已设置。",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.originalText || body.originalText.trim().length < 10) {
    return NextResponse.json(
      { error: "originalText 必须 ≥ 10 字符" },
      { status: 400 },
    );
  }

  const model = getChatModelForRequest(req);
  const t0 = Date.now();

  // Minimal structured log so we can correlate Vercel runtime logs with
  // user-visible regressions during the 60-day H1 window. OTel / Vercel
  // Observability is a Phase 2 task.
  console.log("[draft-reply] start", {
    promptVersion: PROMPT_VERSION,
    buyerCountry: body.buyerCountry ?? null,
    tone: body.tone ?? "neutral",
    inputLen: body.originalText.length,
  });

  try {
    const result = streamText({
      model,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(body),
      // Higher temperature for the body of the reply, but the model is
      // instructed to stay grounded on factory profile — see system prompt.
      temperature: 0.5,
      maxOutputTokens: 1500,
      onFinish({ usage, finishReason }) {
        console.log("[draft-reply] finish", {
          promptVersion: PROMPT_VERSION,
          finishReason,
          tokens: usage,
          durationMs: Date.now() - t0,
        });
      },
    });

    // Return as a text stream that the dashboard can pipe into a textarea via
    // ReadableStream consumption (no AI SDK UI dep on the dashboard side).
    return result.toTextStreamResponse({
      headers: {
        "x-prompt-version": PROMPT_VERSION,
      },
    });
  } catch (err) {
    console.error("[draft-reply] streamText error", err);
    return NextResponse.json(
      { error: "Draft generation failed" },
      { status: 502 },
    );
  }
}
