// AI "DataManager" — structures a messy uploaded enterprise document
// (business license / product brochure / test report / certificate) into the
// Zod-validated fields the libraries expect. This is the Citrine-style
// "把没整理好的数据快速结构化" front-end of the UGC flywheel: the human
// reviews/edits the extracted fields, submits them as enterprise registration
// data, and admin approval then materializes + embeds them (see lib/ingest/ugc).
//
// Provider: the host's multimodal model (Qwen-VL domestic / Gemini overseas via
// getVisionChatModel). Uses the codebase's proven generateText → JSON → Zod
// pattern (see lib/quote/extract) rather than generateObject, which is shaky on
// the OpenAI-compatible vision endpoints. Degrades gracefully — never throws to
// the caller; a failure returns confidence 0 + empty data + a note.

import { generateText } from "ai";
import { getVisionChatModel } from "@/lib/ai/provider";
import {
  SCHEMA_BY_KIND,
  DOC_KIND_LABELS,
  type DocKind,
} from "@/lib/enterprise/doc-schema";

// 单文件大小上限(与前端提示一致)。签名直传 PUT 无法在 OSS 侧限大小,
// 这里是 server 拉取入内存前的最后一道闸:超限直接拒绝,避免把巨型对象
// 读进 Uint8Array 撑爆函数内存(OOM/超时)+ 浪费视觉模型调用。
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
// 抽取整体软超时:留在平台硬超时(maxDuration=60s)之前优雅中断,让上游
// catch 能把文档落到可复核终态,而不是被硬杀后卡在 'extracting'。
const EXTRACT_TIMEOUT_MS = 45_000;

const FIELD_HINTS: Record<DocKind, string> = {
  license:
    '{ "companyName": 名称, "creditCode": 统一社会信用代码, "legalRep": 法定代表人, "address": 住所, "businessScope": 经营范围, "establishedDate": 成立日期(YYYY-MM-DD), "registeredCapital": 注册资本 }',
  product:
    '{ "products": [ { "name": 产品名(必填), "category": 型材/格栅/管材/树脂/纤维…, "model": 型号, "properties": {"拉伸强度":"320 MPa","密度":"1.9 g/cm³"}, "applications": ["应用场景"] } ] }',
  test:
    '{ "productName": 产品名, "standard": 检测依据(如 GB/T 1447), "lab": 检测机构, "reportDate": 报告日期, "items": [ { "name": 检测项, "value": 结果, "method": 方法 } ] }',
  cert:
    '{ "certType": ISO9001/ISO14001/CE/IATF16949…, "certNo": 证书编号, "issuer": 发证机构, "scope": 认证范围, "validUntil": 有效期至(YYYY-MM-DD) }',
};

export type ExtractDocOutcome = {
  kind: DocKind;
  confidence: number; // 0–100
  data: unknown; // validated against SCHEMA_BY_KIND[kind], or the kind's empty default
  ok: boolean;
  note?: string;
};

function emptyData(kind: DocKind): unknown {
  // Zod .default()s give product/test their empty arrays; others → {}.
  const parsed = SCHEMA_BY_KIND[kind].safeParse({});
  return parsed.success ? parsed.data : {};
}

// Pull the first balanced JSON object out of a model reply (handles ```json fences).
function parseJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function extractDoc(
  kind: DocKind,
  fileUrl: string,
  host?: string | null,
): Promise<ExtractDocOutcome> {
  const fail = (note: string): ExtractDocOutcome => ({
    kind,
    confidence: 0,
    data: emptyData(kind),
    ok: false,
    note,
  });

  const vision = getVisionChatModel(host);
  if (!vision.ok || !vision.model) {
    return fail("本站图片识别暂未开通(缺视觉模型 key)，请手动填写。");
  }

  let bytes: Uint8Array;
  let mediaType: string;
  try {
    const res = await fetch(fileUrl, { signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS) });
    if (!res.ok) return fail(`文档下载失败(${res.status})。`);
    // Content-Length 是可信的 OSS GET 响应头 → 在缓冲前就挡掉超大对象。
    const declaredLen = Number(res.headers.get("content-length") || 0);
    if (declaredLen > MAX_FILE_BYTES) {
      return fail(`文档过大(超过 ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB)，请压缩或导出后重试。`);
    }
    mediaType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    bytes = new Uint8Array(await res.arrayBuffer());
    // 兜底:个别情况下 Content-Length 缺失,落地后再核一次实际字节数。
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return fail(`文档过大(超过 ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB)，请压缩或导出后重试。`);
    }
  } catch {
    return fail("文档下载失败，请重试或手动填写。");
  }

  // PDF only works on Gemini (overseas). Qwen-VL (domestic) rejects PDF parts —
  // same constraint as the chat route; ask for an image instead.
  const isPdf = mediaType === "application/pdf";
  const providerHandlesPdf = vision.provider === "google" || vision.provider === "openrouter";
  if (isPdf && !providerHandlesPdf) {
    return fail("本站暂不支持读取 PDF，请将文档导出为图片(PNG/JPG)后上传，或手动填写。");
  }

  const prompt =
    `你是复材行业的资料结构化助手。请识别这份「${DOC_KIND_LABELS[kind].zh}」，` +
    `把信息抽取成严格的 JSON，字段格式：\n${FIELD_HINTS[kind]}\n\n` +
    `要求：① 只输出一个 JSON 对象，外层为 {"confidence": 0-100, "data": <上面的结构>}；` +
    `② confidence 是你对识别准确度的估计；③ 看不清/没有的字段就省略或留空，绝不编造；` +
    `④ 不要输出 JSON 以外的任何解释文字。`;

  try {
    const { text } = await generateText({
      model: vision.model,
      maxOutputTokens: 1500,
      abortSignal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            isPdf
              ? { type: "file", data: bytes, mediaType }
              : { type: "image", image: bytes, mediaType },
          ],
        },
      ],
    });

    const obj = parseJsonObject(text);
    if (!obj) return fail("识别结果无法解析，请手动填写。");

    const rawConfidence = typeof obj.confidence === "number" ? obj.confidence : 50;
    const confidence = Math.max(0, Math.min(100, Math.round(rawConfidence)));
    const parsed = SCHEMA_BY_KIND[kind].safeParse(obj.data ?? {});
    if (!parsed.success) {
      // Partial — return empty default at low confidence so the UI falls to manual.
      return { kind, confidence: Math.min(confidence, 40), data: emptyData(kind), ok: false, note: "部分字段未通过校验，请人工补全。" };
    }
    return { kind, confidence, data: parsed.data, ok: true };
  } catch (e) {
    console.warn("[extract-doc] failed:", e instanceof Error ? e.message : e);
    return fail("识别服务异常，请稍后重试或手动填写。");
  }
}
