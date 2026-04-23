// Embed all existing DB rows into knowledge_chunks.
// Idempotent: upserts by id. Re-run after adding new content.
//
// Usage: pnpm tsx --env-file=.env.local scripts/embed-corpus.ts
//        pnpm tsx --env-file=.env.production.local scripts/embed-corpus.ts  (prod DB)

import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  materials,
  standards,
  papers,
  patents,
  formulas,
  articles,
} from "../src/lib/db/schema";
import { embedBatch } from "../src/lib/ai/embed";

type Chunk = {
  id: string;
  sourceType:
    | "material"
    | "standard"
    | "paper"
    | "patent"
    | "formula"
    | "article"
    | "supplier";
  sourceId: string;
  title: string;
  content: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

function formatProps(props: Record<string, string> | null | undefined): string {
  if (!props) return "";
  return Object.entries(props)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("；");
}

async function buildChunks(): Promise<Chunk[]> {
  const chunks: Chunk[] = [];

  // Materials
  const matRows = await db.select().from(materials);
  for (const m of matRows) {
    const parts: string[] = [];
    if (m.nameEn) parts.push(`英文名: ${m.nameEn}`);
    if (m.brand) parts.push(`品牌: ${m.brand}`);
    if (m.model) parts.push(`型号: ${m.model}`);
    if (m.subCategory) parts.push(`子类: ${m.subCategory}`);
    const props = formatProps(m.properties as Record<string, string> | null);
    if (props) parts.push(`参数: ${props}`);
    if (m.applications && (m.applications as string[]).length) {
      parts.push(`应用: ${(m.applications as string[]).join("、")}`);
    }
    if (m.description) parts.push(m.description);
    chunks.push({
      id: `material:${m.id}`,
      sourceType: "material",
      sourceId: m.id,
      title: m.name,
      content: [m.name, ...parts].join("\n"),
      url: `/materials/${m.id}`,
      metadata: { category: m.category },
    });
  }
  console.log(`  materials: ${matRows.length}`);

  // Standards
  const stdRows = await db.select().from(standards);
  for (const s of stdRows) {
    const parts: string[] = [s.code];
    if (s.titleEn) parts.push(`EN: ${s.titleEn}`);
    if (s.country) parts.push(`国家: ${s.country}`);
    if (s.category) parts.push(`类别: ${s.category}`);
    if (s.year) parts.push(`年份: ${s.year}`);
    if (s.description) parts.push(s.description);
    chunks.push({
      id: `standard:${s.id}`,
      sourceType: "standard",
      sourceId: s.id,
      title: `${s.code} ${s.title}`,
      content: [s.title, ...parts].join("\n"),
      url: `/standards/${s.id}`,
      metadata: { country: s.countryCode, category: s.category },
    });
  }
  console.log(`  standards: ${stdRows.length}`);

  // Papers
  const paperRows = await db.select().from(papers);
  for (const p of paperRows) {
    const authors = ((p.authors as string[]) ?? []).join(", ");
    const keywords = ((p.keywords as string[]) ?? []).join("、");
    const parts: string[] = [];
    if (authors) parts.push(`作者: ${authors}`);
    if (p.journal) parts.push(`期刊: ${p.journal}`);
    if (p.year) parts.push(`年份: ${p.year}`);
    if (keywords) parts.push(`关键词: ${keywords}`);
    if (p.abstract) parts.push(p.abstract);
    chunks.push({
      id: `paper:${p.id}`,
      sourceType: "paper",
      sourceId: p.id,
      title: p.title,
      content: [p.title, p.titleEn ?? "", ...parts].filter(Boolean).join("\n"),
      url: `/papers/${p.slug ?? p.id}`,
      metadata: { doi: p.doi, year: p.year },
    });
  }
  console.log(`  papers: ${paperRows.length}`);

  // Patents
  const patRows = await db.select().from(patents);
  for (const p of patRows) {
    const parts: string[] = [];
    if (p.applicant) parts.push(`申请人: ${p.applicant}`);
    if (p.publicationNo) parts.push(`公开号: ${p.publicationNo}`);
    if (p.grantNo) parts.push(`授权号: ${p.grantNo}`);
    if (p.filingDate) parts.push(`申请日: ${p.filingDate}`);
    if (p.country) parts.push(`国家: ${p.country}`);
    if (p.abstract) parts.push(p.abstract);
    chunks.push({
      id: `patent:${p.id}`,
      sourceType: "patent",
      sourceId: p.id,
      title: p.title,
      content: [p.title, p.titleEn ?? "", ...parts].filter(Boolean).join("\n"),
      url: `/patents/${p.slug ?? p.id}`,
      metadata: { country: p.countryCode, status: p.status },
    });
  }
  console.log(`  patents: ${patRows.length}`);

  // Formulas
  const fRows = await db.select().from(formulas);
  for (const f of fRows) {
    type Ing = { name?: string; role?: string; amount?: string };
    const ingList = (arr: Ing[] | null, label: string) => {
      if (!arr?.length) return "";
      return (
        label +
        ": " +
        arr
          .map((i) =>
            [i.name, i.role, i.amount].filter(Boolean).join(" ")
          )
          .join("；")
      );
    };
    const parts: string[] = [];
    if (f.process) parts.push(`工艺: ${f.process}`);
    if (f.application) parts.push(`应用: ${f.application}`);
    if (f.difficulty) parts.push(`难度: ${f.difficulty}`);
    if (f.description) parts.push(f.description);
    const resinStr = ingList(f.resinSystem as Ing[] | null, "树脂体系");
    const reinfStr = ingList(f.reinforcement as Ing[] | null, "增强");
    const auxStr = ingList(f.auxiliaries as Ing[] | null, "辅材");
    if (resinStr) parts.push(resinStr);
    if (reinfStr) parts.push(reinfStr);
    if (auxStr) parts.push(auxStr);
    chunks.push({
      id: `formula:${f.id}`,
      sourceType: "formula",
      sourceId: f.id,
      title: f.name,
      content: [f.name, ...parts].join("\n"),
      url: `/formulas#${f.id}`,
      metadata: { processId: f.processId, category: f.category },
    });
  }
  console.log(`  formulas: ${fRows.length}`);

  // Articles
  const artRows = await db.select().from(articles);
  for (const a of artRows) {
    const body = a.body ?? a.excerpt ?? "";
    chunks.push({
      id: `article:${a.id}`,
      sourceType: "article",
      sourceId: a.id,
      title: a.title,
      content: [a.title, a.excerpt ?? "", body.slice(0, 3000)].filter(Boolean).join("\n"),
      url: `/articles/${a.slug}`,
      metadata: { category: a.category, publishedAt: a.publishedAt },
    });
  }
  console.log(`  articles: ${artRows.length}`);

  return chunks;
}

async function upsert(chunks: Chunk[], embeddings: number[][]) {
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const emb = embeddings[i];
    // pgvector literal as '[0.1,0.2,...]' — use array_to_string for safe serialization.
    const embStr = `[${emb.join(",")}]`;
    await db.execute(sql`
      INSERT INTO knowledge_chunks (id, source_type, source_id, title, content, url, metadata, embedding, updated_at)
      VALUES (${c.id}, ${c.sourceType}::knowledge_source, ${c.sourceId}, ${c.title}, ${c.content},
              ${c.url ?? null}, ${c.metadata ?? null}, ${embStr}::vector, now())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        url = EXCLUDED.url,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        updated_at = now();
    `);
  }
}

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
  }
  console.log("🔎 building chunks…");
  const chunks = await buildChunks();
  console.log(`✏️  total chunks: ${chunks.length}, embedding…`);
  const texts = chunks.map((c) => `${c.title}\n${c.content}`.slice(0, 2000));
  const t0 = Date.now();
  const embeddings = await embedBatch(texts);
  console.log(`   embedded in ${Math.round((Date.now() - t0) / 1000)}s`);
  console.log(`💾 upserting…`);
  const step = Math.max(1, Math.floor(chunks.length / 20));
  for (let i = 0; i < chunks.length; i += step) {
    const slice = chunks.slice(i, i + step);
    const embSlice = embeddings.slice(i, i + step);
    await upsert(slice, embSlice);
    process.stdout.write(`  ${Math.min(i + step, chunks.length)}/${chunks.length}\r`);
  }
  console.log(`\n✅ corpus embed complete: ${chunks.length} chunks`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
