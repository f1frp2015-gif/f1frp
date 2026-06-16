// UGC ingestion — CLOSES THE DATA FLYWHEEL for enterprise-contributed content.
//
// Before this, an approved enterprise's structured products never reached the
// searchable libraries, and nothing live-embedded UGC into knowledge_chunks —
// the embed only ran via the offline scripts/embed-corpus.ts batch. So a newly
// verified factory's products were invisible to the AI until someone re-ran the
// script by hand. This module makes admin approval do the full loop:
//   enterprise.products[] → materials(source=ugc, status=verified)
//     → embed into knowledge_chunks (same format as embed-corpus)
//     → instantly RAG-retrievable & citable by the AI.
// Supplier listings linked to the enterprise are (re)embedded too.
//
// Chunk content format is kept identical to scripts/embed-corpus.ts so curated
// and UGC chunks are indistinguishable to retrieval.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { enterprises, materials, supplierListings } from "@/lib/db/schema";
import { embedAndUpsertChunks, type KbChunk } from "./knowledge-chunk";

type UgcChunk = KbChunk & { sourceType: "material" | "supplier" };

function formatProps(props: Record<string, string> | null | undefined): string {
  if (!props) return "";
  return Object.entries(props)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("；");
}

// Mirrors the "Materials" chunk in scripts/embed-corpus.ts.
function buildMaterialChunk(m: {
  id: string;
  name: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  subCategory?: string | null;
  properties?: Record<string, string> | null;
  applications?: string[] | null;
  description?: string | null;
  enterpriseName?: string | null;
}): UgcChunk {
  const parts: string[] = [];
  if (m.brand) parts.push(`品牌: ${m.brand}`);
  if (m.model) parts.push(`型号: ${m.model}`);
  if (m.subCategory) parts.push(`子类: ${m.subCategory}`);
  const props = formatProps(m.properties);
  if (props) parts.push(`参数: ${props}`);
  if (m.applications && m.applications.length) parts.push(`应用: ${m.applications.join("、")}`);
  if (m.enterpriseName) parts.push(`供应企业: ${m.enterpriseName}`);
  if (m.description) parts.push(m.description);
  return {
    id: `material:${m.id}`,
    sourceType: "material",
    sourceId: m.id,
    title: m.name,
    content: [m.name, ...parts].join("\n"),
    url: `/materials/${m.id}`,
    metadata: { category: m.category, source: "ugc" },
  };
}

// Mirrors the "Suppliers" chunk in scripts/embed-corpus.ts.
function buildSupplierChunk(s: typeof supplierListings.$inferSelect): UgcChunk {
  const parts: string[] = [];
  if (s.nameEn) parts.push(`英文名: ${s.nameEn}`);
  if (s.location) parts.push(`所在地: ${s.location}`);
  if (s.category) parts.push(`类别: ${s.category}`);
  if (s.products && s.products.length) parts.push(`产品: ${s.products.join("、")}`);
  if (s.processList && s.processList.length) parts.push(`工艺: ${s.processList.join("、")}`);
  if (s.certifications && s.certifications.length) parts.push(`认证: ${s.certifications.join("、")}`);
  if (s.established) parts.push(`成立: ${s.established}`);
  if (s.description) parts.push(s.description);
  return {
    id: `supplier:${s.id}`,
    sourceType: "supplier",
    sourceId: s.id,
    title: s.name,
    content: [s.name, ...parts].join("\n"),
    url: `/suppliers/${s.id}`,
    metadata: { category: s.category, province: s.province, verified: s.verified },
  };
}

export type IngestResult = { materials: number; embedded: number; errors: number };

// Ingest a just-approved enterprise: turn its structured products into verified
// UGC materials and (re)embed those + its supplier listings into the RAG index.
// Safe to call repeatedly (idempotent upserts). Throws only on a hard DB error;
// per-chunk embed failures are counted, not fatal, so one bad row can't block
// the rest of the ingest.
export async function ingestApprovedEnterprise(enterpriseId: string): Promise<IngestResult> {
  const [ent] = await db.select().from(enterprises).where(eq(enterprises.id, enterpriseId)).limit(1);
  if (!ent) return { materials: 0, embedded: 0, errors: 0 };

  const chunks: UgcChunk[] = [];
  const brand = (ent.shortName ?? ent.name).slice(0, 100);
  const products = (ent.products ?? []).filter((p): p is string => typeof p === "string" && p.trim() !== "");

  // 1) products[] → materials(ugc, verified)
  let materialsCount = 0;
  for (let i = 0; i < products.length; i++) {
    const name = products[i].trim().slice(0, 200);
    const id = `ugc-${enterpriseId}-${i}`;
    await db
      .insert(materials)
      .values({
        id,
        name,
        category: ent.category,
        brand,
        applications: ent.serviceAreas ?? null,
        description: ent.description ?? null,
        enterpriseId,
        source: "ugc",
        status: "verified",
      })
      .onConflictDoUpdate({
        target: materials.id,
        set: { name, category: ent.category, brand, status: "verified", updatedAt: new Date() },
      });
    materialsCount++;
    chunks.push(
      buildMaterialChunk({
        id,
        name,
        category: ent.category,
        brand,
        applications: ent.serviceAreas ?? null,
        description: ent.description ?? null,
        enterpriseName: ent.name,
      }),
    );
  }

  // 2) supplier listings linked to this enterprise
  const sups = await db.select().from(supplierListings).where(eq(supplierListings.enterpriseId, enterpriseId));
  for (const s of sups) chunks.push(buildSupplierChunk(s));

  // 3) embed + upsert (per-chunk failures counted, not fatal)
  const { embedded, errors } = await embedAndUpsertChunks(chunks);

  return { materials: materialsCount, embedded, errors };
}
