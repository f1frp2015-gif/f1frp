// Live embedding for the daily paper/patent cron — item 3 of the flywheel.
// Before this, the cron inserted new papers/patents but they only became
// RAG-retrievable after someone manually re-ran scripts/embed-corpus.ts. Now
// the cron calls embedNewRecords(...) right after insert, so fresh literature
// is citable by the AI the same day. Chunk format mirrors embed-corpus exactly.

import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { papers, patents } from "@/lib/db/schema";
import { embedAndUpsertChunks, type KbChunk } from "./knowledge-chunk";

function paperChunk(p: typeof papers.$inferSelect): KbChunk {
  const authors = (p.authors ?? []).join(", ");
  const keywords = (p.keywords ?? []).join("、");
  const parts: string[] = [];
  if (authors) parts.push(`作者: ${authors}`);
  if (p.journal) parts.push(`期刊: ${p.journal}`);
  if (p.year) parts.push(`年份: ${p.year}`);
  if (keywords) parts.push(`关键词: ${keywords}`);
  if (p.abstract) parts.push(p.abstract);
  return {
    id: `paper:${p.id}`,
    sourceType: "paper",
    sourceId: p.id,
    title: p.title,
    content: [p.title, p.titleEn ?? "", ...parts].filter(Boolean).join("\n"),
    url: `/papers/${p.slug ?? p.id}`,
    metadata: { doi: p.doi, year: p.year },
  };
}

function patentChunk(p: typeof patents.$inferSelect): KbChunk {
  const parts: string[] = [];
  if (p.applicant) parts.push(`申请人: ${p.applicant}`);
  if (p.publicationNo) parts.push(`公开号: ${p.publicationNo}`);
  if (p.grantNo) parts.push(`授权号: ${p.grantNo}`);
  if (p.filingDate) parts.push(`申请日: ${p.filingDate}`);
  if (p.country) parts.push(`国家: ${p.country}`);
  if (p.abstract) parts.push(p.abstract);
  return {
    id: `patent:${p.id}`,
    sourceType: "patent",
    sourceId: p.id,
    title: p.title,
    content: [p.title, p.titleEn ?? "", ...parts].filter(Boolean).join("\n"),
    url: `/patents/${p.slug ?? p.id}`,
    metadata: { country: p.countryCode, status: p.status },
  };
}

export async function embedNewRecords(opts: {
  paperIds?: string[];
  patentIds?: string[];
}): Promise<{ papers: number; patents: number; errors: number }> {
  let paperCount = 0;
  let patentCount = 0;
  let errors = 0;

  const paperIds = opts.paperIds?.filter(Boolean) ?? [];
  if (paperIds.length) {
    const rows = await db.select().from(papers).where(inArray(papers.id, paperIds));
    const res = await embedAndUpsertChunks(rows.map(paperChunk));
    paperCount = res.embedded;
    errors += res.errors;
  }

  const patentIds = opts.patentIds?.filter(Boolean) ?? [];
  if (patentIds.length) {
    const rows = await db.select().from(patents).where(inArray(patents.id, patentIds));
    const res = await embedAndUpsertChunks(rows.map(patentChunk));
    patentCount = res.embedded;
    errors += res.errors;
  }

  return { papers: paperCount, patents: patentCount, errors };
}
