/**
 * 编排:一份上传文件 → AI 抽取 → 映射打标 → 落库(supplier_documents +
 * supplier_document_tags),返回处理结果。这是「上传 → 自动结构化打标」管道的连接器。
 *
 * 复用既有 extractDoc(Qwen-VL 国内 / Gemini 海外,按 host;generateText→JSON→Zod,
 * 永不抛错)。低置信 / 有未映射 / 有模糊命中 / 无 tag → 落「needs_review」待人工。
 *
 * server-only(用 db + 视觉模型)。被 /api/qualifications 调用。
 */
import { eq } from "drizzle-orm";

import { getVisionChatModel } from "@/lib/ai/provider";
import { db } from "@/lib/db";
import { supplierDocumentTags, supplierDocuments } from "@/lib/db/schema";
import type { CertData, DocKind } from "@/lib/enterprise/doc-schema";
import { extractDoc } from "@/lib/enterprise/extract-doc";

import { deriveTagsFromExtraction } from "./map-tags";

export interface ProcessInput {
  kind: DocKind;
  ossKey: string;
  fileUrl: string; // 签名 GET URL,供模型 server 端拉取
  fileName?: string | null;
  contentType?: string | null;
  uploadedByUserId: string;
  supplierListingId?: string | null;
  enterpriseId?: string | null;
  host?: string | null;
}

export interface ProcessResult {
  documentId: string;
  status: "extracted" | "needs_review";
  confidence: number;
  tagCount: number;
  unmapped: string[];
  note?: string;
}

export async function processQualificationDoc(
  input: ProcessInput,
): Promise<ProcessResult> {
  // 1) 建文档行(extracting)
  const [doc] = await db
    .insert(supplierDocuments)
    .values({
      supplierListingId: input.supplierListingId ?? null,
      enterpriseId: input.enterpriseId ?? null,
      uploadedByUserId: input.uploadedByUserId,
      kind: input.kind,
      ossKey: input.ossKey,
      fileName: input.fileName ?? null,
      contentType: input.contentType ?? null,
      status: "extracting",
    })
    .returning({ id: supplierDocuments.id });

  // 插入成功后的所有步骤都包在 try/catch 里:抽取/落库任一环节抛错(Neon 抖动、
  // 跨境延迟、超时被杀前的 DB 写失败等),都把该行落到可复核终态,绝不让它永远卡在
  // 'extracting'(否则用户看到永久"识别中",后台审核流也取不到它)。
  try {
    // 2) AI 抽取 + 映射
    const outcome = await extractDoc(input.kind, input.fileUrl, input.host);
    const { tags, unmapped } = deriveTagsFromExtraction(input.kind, outcome.data);

    // 3) cert 字段提升(便于索引 / 去重 / 到期扫描)
    const cert = input.kind === "cert" ? (outcome.data as CertData) : null;
    const certNo = cert?.certNo?.trim() || null;
    const issuer = cert?.issuer?.trim() || null;
    const validTo = tags.find((t) => t.validTo)?.validTo ?? null;

    // 4) 状态裁决
    const needsReview =
      !outcome.ok ||
      outcome.confidence < 60 ||
      unmapped.length > 0 ||
      tags.some((t) => t.fuzzy) ||
      tags.length === 0;
    const status: ProcessResult["status"] = needsReview ? "needs_review" : "extracted";

    await db
      .update(supplierDocuments)
      .set({
        status,
        extractedData: { ...outcome, unmapped },
        extractionModel: getVisionChatModel(input.host).provider,
        extractionConfidence: outcome.confidence,
        certNo,
        issuer,
        validTo,
        updatedAt: new Date(),
      })
      .where(eq(supplierDocuments.id, doc.id));

    // 5) 写 tag 实例(unique(document_id, tag_id) 兜底去重)
    if (tags.length) {
      await db
        .insert(supplierDocumentTags)
        .values(
          tags.map((t) => ({
            documentId: doc.id,
            supplierListingId: input.supplierListingId ?? null,
            tagId: t.tagId,
            facet: t.facet,
            trust: t.trust,
            source: "ai" as const,
            certNo: t.certNo ?? null,
            validTo: t.validTo ?? null,
          })),
        )
        .onConflictDoNothing();
    }

    return {
      documentId: doc.id,
      status,
      confidence: outcome.confidence,
      tagCount: tags.length,
      unmapped,
      note: outcome.note,
    };
  } catch (e) {
    console.warn(
      "[process-doc] failed:",
      e instanceof Error ? e.message : e,
    );
    // 落到可复核终态。恢复写本身也兜一层 try,DB 真的不可用时至少不再二次抛错。
    try {
      await db
        .update(supplierDocuments)
        .set({
          status: "needs_review",
          reviewNote: "自动识别失败，请人工复核后手动补全。",
          updatedAt: new Date(),
        })
        .where(eq(supplierDocuments.id, doc.id));
    } catch {
      // ignore — 行可能仍停留在 extracting,由后续到期/清理流兜底
    }
    return {
      documentId: doc.id,
      status: "needs_review",
      confidence: 0,
      tagCount: 0,
      unmapped: [],
      note: "自动识别失败，请人工复核。",
    };
  }
}
