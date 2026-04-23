import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { embedText } from "./embed";

export type Retrieved = {
  id: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  url: string | null;
  score: number;
};

export async function retrieveTopK(
  query: string,
  k = 8
): Promise<Retrieved[]> {
  if (!query.trim()) return [];
  const embedding = await embedText(query);
  const vec = `[${embedding.join(",")}]`;
  const rows = await db.execute<{
    id: string;
    source_type: string;
    source_id: string;
    title: string;
    content: string;
    url: string | null;
    distance: number;
  }>(
    sql`SELECT id, source_type, source_id, title, content, url,
               embedding <=> ${vec}::vector AS distance
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vec}::vector
        LIMIT ${k}`
  );
  const list = (
    Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? []
  ) as Array<{
    id: string;
    source_type: string;
    source_id: string;
    title: string;
    content: string;
    url: string | null;
    distance: number;
  }>;
  return list.map((r) => ({
    id: r.id,
    sourceType: r.source_type,
    sourceId: r.source_id,
    title: r.title,
    content: r.content,
    url: r.url,
    score: 1 - Number(r.distance),
  }));
}

export function buildRagContext(items: Retrieved[]): string {
  if (!items.length) return "";
  const blocks = items.map((it, i) => {
    const n = i + 1;
    const label = LABELS[it.sourceType] ?? it.sourceType;
    return `[#${n}] (${label}) ${it.title}\n${it.content.slice(0, 900)}`;
  });
  return (
    "以下是从复材站官方数据库检索到的相关资料，回答时务必引用对应编号：\n\n" +
    blocks.join("\n\n---\n\n")
  );
}

const LABELS: Record<string, string> = {
  material: "材料",
  standard: "标准",
  paper: "论文",
  patent: "专利",
  formula: "配方",
  article: "资讯",
  supplier: "供应商",
};
