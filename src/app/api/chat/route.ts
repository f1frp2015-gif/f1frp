import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  type UIMessage,
} from "ai";
import { getSessionUid } from "@/lib/auth/current-user";
import {
  getChatModelForRequest,
  getVisionChatModelForRequest,
  isChatConfiguredForRequest,
  parseRequestedProvider,
} from "@/lib/ai/provider";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_EN } from "@/lib/ai/knowledge";
import { retrieveTopK, buildRagContext, type Retrieved } from "@/lib/ai/retrieve";
import { makeWebSearchTool, isWebSearchConfigured } from "@/lib/ai/tools/web-search";
import { makeWindowUValueTool } from "@/lib/ai/tools/window-uvalue";
import { makeProfileCalcTool } from "@/lib/ai/tools/profile-calc";
import { makeMaterialSelectorTool } from "@/lib/ai/tools/material-selector";
import { makeExportExcelTool } from "@/lib/ai/tools/export-excel";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import {
  consumeAnonChatCredit,
  ANON_LIMIT_RESPONSE_BODY,
} from "@/lib/auth-gate";

export const runtime = "nodejs";
export const maxDuration = 60;

function normalizeMessages(raw: unknown[]): UIMessage[] {
  return raw.map((entry, i) => {
    const m = (entry ?? {}) as {
      parts?: UIMessage["parts"];
      id?: string;
      role?: UIMessage["role"];
      content?: string;
    };
    if (m.parts) return m as UIMessage;
    return {
      id: m.id || String(i),
      role: m.role || "user",
      parts: [{ type: "text" as const, text: m.content || "" }],
    };
  });
}

function lastUserQuery(uiMessages: UIMessage[]): string {
  for (let i = uiMessages.length - 1; i >= 0; i--) {
    const m = uiMessages[i];
    if (m.role !== "user") continue;
    const text = m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    if (text.trim()) return text;
  }
  return "";
}

function localeInstruction(locale: string): string {
  if (locale === "en") {
    return `You MUST respond entirely in English, regardless of the language used in the knowledge base or retrieved passages. If source material is in Chinese, translate faithfully to English. Keep technical terms, standard numbers (e.g. ASTM D3039), and proper nouns as-is.`;
  }
  return `你必须使用简体中文回答，即使检索结果是英文资料也要翻译成中文。术语、标准号、专有名词保留原样。`;
}

function citationGuidance(locale: string): string {
  if (locale === "en") {
    return `Your answer MUST cite the retrieved results wherever possible. Use the format \`[#N]\` (where N is the result index) inline at the end of the supported statement.
- If no retrieved result supports a statement, explicitly say "f1frp has no record of this; the following is general knowledge."
- Do NOT fabricate DOIs, patent numbers, or standard numbers.
- Do NOT append a "References" section — the inline [#N] markers are sufficient.`;
  }
  return `你的回答**必须**尽量引用下方检索结果。引用格式为 \`[#N]\`（N 为检索结果编号），放在对应陈述句末尾。
- 如果没有相关检索结果能支持某陈述，请明确说"复材站库中暂无此信息，以下为通用知识"。
- 不允许编造 DOI、专利号、标准号。
- 请在答案末尾不用再列"参考文献"，前文行内 [#N] 已足够。`;
}

function hasFilePart(uiMessages: UIMessage[]): boolean {
  return uiMessages.some((m) => m.parts.some((p) => p.type === "file"));
}

// Extra system guidance injected only when the turn carries attachments —
// steers the model to actually *read* drawings/photos and pull out specs.
function visionInstruction(locale: string): string {
  if (locale === "en") {
    return `The user has attached one or more files (engineering drawings, product photos, or PDFs). Before answering:
1. Read each attachment carefully. For drawings/photos, extract the concrete information visible: dimensions, cross-section shape, material callouts, standard codes, tolerances, quantities, and any annotations.
2. Restate what you can see so the user can confirm you read it correctly.
3. Explicitly flag anything unreadable, ambiguous, or missing (e.g. "wall thickness is not dimensioned").
4. Then answer using composites expertise, grounded in the library where possible.
5. If the user wants a parts list / bill of materials, present it as a clean table. Then add a one-line offer: reply "导出 Excel" (or "export to Excel") on the next message and you'll generate a downloadable .xlsx file.
Never invent dimensions or values that are not legible in the attachment.`;
  }
  return `用户上传了一个或多个附件（工程图纸、产品照片或 PDF）。回答前请：
1. 仔细识别每个附件。对图纸/照片，提取可见的具体信息：尺寸、截面形状、材料标注、标准号、公差、数量及任何注释。
2. 复述你识别到的内容，便于用户确认识别无误。
3. 明确指出无法识别、有歧义或缺失的部分（例如"壁厚未标注尺寸"）。
4. 然后结合复材专业知识作答，尽量基于复材站库。
5. 若用户需要零件 / 物料清单（BOM），用清晰的表格列出；并在结尾主动提示一句：在下一条消息回复"导出 Excel"，我就把清单生成可下载的 .xlsx 表格文件。
绝不编造附件中无法辨认的尺寸或数值。`;
}

function visionUnavailableText(locale: string): string {
  if (locale === "en") {
    return "Image and PDF recognition isn't enabled on this site yet. For now, please describe the drawing or specs in text and I'll help — or visit getfrp.com where attachment recognition is live.";
  }
  return "本站的图纸 / 图片 / PDF 识别功能正在开通中，暂时无法读取附件。你可以先用文字描述图纸或参数，我来帮你分析；或访问 getfrp.com（海外站已支持附件识别）。";
}

// Qwen-VL (domestic, via DashScope's OpenAI-compatible endpoint) only accepts
// `image_url` content — a `file` (PDF) part makes DashScope return a 400
// (`Invalid value: file ...`) *after* the 200/stream has opened, which drops
// the SSE connection and surfaces to the user as "无法连接服务器". Gemini
// (overseas) ingests PDF natively, so this only runs on the domestic path.
// Strip every PDF part (images are kept), backfilling a marker so no message is
// left with zero parts (convertToModelMessages rejects empty content).
function stripPdfParts(
  uiMessages: UIMessage[],
  locale: string,
): { messages: UIMessage[]; removed: boolean } {
  let removed = false;
  const messages = uiMessages.map((m) => {
    const kept = m.parts.filter((p) => {
      const isPdf = p.type === "file" && p.mediaType === "application/pdf";
      if (isPdf) removed = true;
      return !isPdf;
    });
    if (kept.length === 0) {
      kept.push({
        type: "text",
        text:
          locale === "en"
            ? "(PDF attachment omitted — not readable on this assistant)"
            : "(已省略无法读取的 PDF 附件)",
      });
    }
    return { ...m, parts: kept };
  });
  return { messages, removed };
}

// System steer appended when a PDF was stripped on the domestic path, so the
// model tells the user how to get the drawing read instead of silently ignoring it.
function pdfDroppedInstruction(locale: string): string {
  if (locale === "en") {
    return "One or more PDF attachments could not be read here. Briefly tell the user that this assistant can't read PDF — they should upload the drawing as an image (PNG/JPG) or a screenshot, or use getfrp.com which reads PDF. Still answer what you can from any images and text provided.";
  }
  return "用户上传的 PDF 附件本助手无法读取。请在回答中简短告知:本站暂不支持读取 PDF,请把图纸导出为图片(PNG/JPG)或截图后上传,或使用海外站 getfrp.com(支持 PDF);同时就已有的图片与文字尽量作答。";
}

export async function POST(req: Request) {
  if (!isChatConfiguredForRequest(req)) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  // 匿名访客超过免费额度后引导注册;登录用户跳过。
  // 只看会话 cookie 是否有效(不查 DB,membership 已 neuter 为全直通)。
  let anonCookieToSet: string | null = null;
  try {
    const uid = await getSessionUid();
    if (!uid) {
      const gate = consumeAnonChatCredit(req);
      if (!gate.ok) {
        return Response.json(ANON_LIMIT_RESPONSE_BODY, { status: 401 });
      }
      anonCookieToSet = gate.cookieHeader;
    }
  } catch {
    // auth() 偶发抖动不应 hard-fail 聊天 — 失败时降级为"按匿名处理",
    // 即仍然走匿名计数,极小概率出现已登录用户被误计数。
    const gate = consumeAnonChatCredit(req);
    if (!gate.ok) {
      return Response.json(ANON_LIMIT_RESPONSE_BODY, { status: 401 });
    }
    anonCookieToSet = gate.cookieHeader;
  }

  try {
    const body = await req.json();
    const uiMessages = normalizeMessages(body.messages || []);
    // Host wins: getfrp.com → en, f1frp.com → zh, ignoring stale client locale.
    const locale = resolveServerLocale(req, body.locale);

    const ctx = body.context as
      | {
          standardCode?: string;
          standardTitle?: string;
          chapterNo?: string;
          chapterTitle?: string;
          chapterBody?: string;
        }
      | undefined;

    // Attachments → vision-capable model. Overseas (Gemini) is already
    // multimodal; domestic (DeepSeek) is text-only and routes to Qwen-VL via
    // DashScope. When the domestic vision model isn't provisioned we stream a
    // friendly message rather than 500-ing.
    // Client model-picker selection (domestic side). parseRequestedProvider +
    // the host invariant in getChatModel ensure this can only switch *within*
    // the domestic provider set — it can never pull f1frp.com onto Google.
    const requestedProvider = parseRequestedProvider(body.model);
    const withAttachments = hasFilePart(uiMessages);
    let model = getChatModelForRequest(req, requestedProvider);
    let chatMessages = uiMessages;
    let pdfDropped = false;
    if (withAttachments) {
      const vision = getVisionChatModelForRequest(req);
      if (!vision.ok || !vision.model) {
        const stream = createUIMessageStream({
          execute: ({ writer }) => {
            const id = "vision-unavailable";
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              id,
              delta: visionUnavailableText(locale),
            });
            writer.write({ type: "text-end", id });
          },
        });
        const resp = createUIMessageStreamResponse({ stream });
        if (anonCookieToSet) resp.headers.append("Set-Cookie", anonCookieToSet);
        return resp;
      }
      model = vision.model;

      // Only Gemini (overseas) ingests PDF natively. Qwen-VL (domestic) rejects
      // `file` parts mid-stream → dropped SSE connection. On non-Gemini vision
      // paths, strip PDFs (keep images) and steer the model to ask for an image.
      const modelHandlesPdf =
        vision.provider === "google" || vision.provider === "openrouter";
      if (!modelHandlesPdf) {
        const sanitized = stripPdfParts(uiMessages, locale);
        chatMessages = sanitized.messages;
        pdfDropped = sanitized.removed;
      }
    }

    const query = lastUserQuery(chatMessages);
    let retrieved: Retrieved[] = [];
    try {
      if (query) retrieved = await retrieveTopK(query, 8);
    } catch (e) {
      console.warn(
        "[chat] RAG retrieval failed:",
        e instanceof Error ? e.message : e
      );
    }

    const systemParts: string[] = [
      locale === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT,
      localeInstruction(locale),
      citationGuidance(locale),
    ];
    if (withAttachments) systemParts.push(visionInstruction(locale));
    if (pdfDropped) systemParts.push(pdfDroppedInstruction(locale));

    const ragBlock = buildRagContext(retrieved);
    if (ragBlock) systemParts.push(ragBlock);

    if (ctx?.standardCode) {
      const lines =
        locale === "en"
          ? [
              `You are currently helping the user interpret standard [${ctx.standardCode}]${ctx.standardTitle ? ` — ${ctx.standardTitle}` : ""}.`,
            ]
          : [
              `你当前正在协助用户解读标准【${ctx.standardCode}】${ctx.standardTitle ? ` — ${ctx.standardTitle}` : ""}。`,
            ];
      if (ctx.chapterNo || ctx.chapterTitle) {
        lines.push(
          locale === "en"
            ? `User is focused on: Chapter ${ctx.chapterNo ?? "?"} ${ctx.chapterTitle ?? ""}`.trim()
            : `用户聚焦章节：第 ${ctx.chapterNo ?? "?"} 章 ${ctx.chapterTitle ?? ""}`.trim()
        );
      }
      if (ctx.chapterBody) {
        lines.push(
          locale === "en"
            ? "Chapter highlights (for reference; do not quote verbatim):"
            : "该章要点（供你参考，不要逐字复述版权原文）："
        );
        lines.push(ctx.chapterBody);
      }
      lines.push(
        locale === "en"
          ? "When answering: ① cite the chapter number explicitly; ② if information is missing, tell the user to consult the original standard; ③ do not fabricate values."
          : "回答时：① 明确引用章节号；② 如缺信息，明确告知用户查阅原标准；③ 不要编造未列出的数值。"
      );
      systemParts.push(lines.join("\n"));
    }

    // Tools are disabled on attachment turns — the focus is reading the image,
    // and the vision models (Qwen-VL) have shakier tool support. So a drawing is
    // read on the attachment turn; Excel export happens on the NEXT
    // (attachment-free) turn when the user asks (visionInstruction primes them).
    //   - window_u_value: always on (pure local JG/T 571 table lookup, no env)
    //   - export_excel:   always on (BOM / 清单 → table echoed; the browser
    //                      builds the .xlsx on download — no OSS / storage)
    //   - web_search:     opt-in, gated on the per-host search provider's key
    // stopWhen is required so the model produces a final text answer AFTER a
    // tool call (and is capped so it can't recursion-loop tool calls).
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const tools = withAttachments
      ? undefined
      : {
          window_u_value: makeWindowUValueTool(),
          profile_mechanics: makeProfileCalcTool(),
          material_selector: makeMaterialSelectorTool(),
          export_excel: makeExportExcelTool(),
          ...(isWebSearchConfigured(host)
            ? { web_search: makeWebSearchTool(host) }
            : {}),
        };
    const toolsConfig = tools ? { tools, stopWhen: stepCountIs(3) } : {};

    const result = streamText({
      model,
      system: systemParts.join("\n\n"),
      messages: await convertToModelMessages(chatMessages),
      maxOutputTokens: 2000,
      ...toolsConfig,
    });

    const streamResponse = result.toUIMessageStreamResponse({
      messageMetadata: () => ({
        citations: retrieved.map((r, i) => ({
          n: i + 1,
          title: r.title,
          url: r.url,
          sourceType: r.sourceType,
          sourceId: r.sourceId,
        })),
      }),
    });
    if (anonCookieToSet) {
      streamResponse.headers.append("Set-Cookie", anonCookieToSet);
    }
    return streamResponse;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Chat API error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
