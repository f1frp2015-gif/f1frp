// Thermoplastic-pultrusion wave. Same pipeline as bulk-expansion.ts but
// targets the THERMOPLASTIC_* query pools (PP/PA/PEEK/PPS/PEI/reactive, etc.).
//
// Run: pnpm tsx --env-file=.env.local scripts/bulk-thermoplastic.ts

import { createHash } from "node:crypto";
import { db } from "../src/lib/db";
import { papers as papersTable, patents as patentsTable } from "../src/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { fetchCrossRef, fetchOpenAlex, fetchGooglePatents } from "../src/lib/ingest/sources";
import type { FetchedPaper, FetchedPatent } from "../src/lib/ingest/sources";
import { paperSlug, patentSlug } from "../src/lib/slug";
import { translateToChinese } from "../src/lib/ingest/translate";
import { generatePaperCommentary } from "../src/lib/ingest/commentary";
import {
  THERMOPLASTIC_PAPER_QUERIES,
  THERMOPLASTIC_PATENT_QUERIES,
} from "../src/lib/ingest/pultrusion-pool";

const PER_QUERY = 30;
const CONCURRENCY = 2; // slightly lower since we may share capacity with the sibling job

function shortHash(s: string) {
  return createHash("sha1").update(s).digest("hex").slice(0, 10);
}
async function countPapers() {
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(papersTable);
  return r.c;
}
async function countPatents() {
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(patentsTable);
  return r.c;
}
async function paperExists(doi?: string, externalId?: string) {
  if (doi) {
    const r = await db.select({ id: papersTable.id }).from(papersTable).where(eq(papersTable.doi, doi)).limit(1);
    if (r.length) return true;
  }
  if (externalId) {
    const id = `paper-${shortHash(externalId)}`;
    const r = await db.select({ id: papersTable.id }).from(papersTable).where(eq(papersTable.id, id)).limit(1);
    if (r.length) return true;
  }
  return false;
}
async function patentExists(p: FetchedPatent) {
  if (p.publicationNo) {
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.publicationNo, p.publicationNo))
      .limit(1);
    if (r.length) return true;
  }
  if (p.sourceUrl) {
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.sourceUrl, p.sourceUrl))
      .limit(1);
    if (r.length) return true;
  }
  const id = `pat-${shortHash(p.externalId)}`;
  const r = await db.select({ id: patentsTable.id }).from(patentsTable).where(eq(patentsTable.id, id)).limit(1);
  return r.length > 0;
}

async function ingestPaper(fetched: FetchedPaper) {
  try {
    if (!fetched.title) return "skip";
    if (await paperExists(fetched.doi, fetched.externalId)) return "skip";
    const shouldTranslate = fetched.language !== "zh" && (fetched.title || fetched.abstract);
    let titleZh = fetched.title;
    let abstractZh = fetched.abstract;
    let keywordsZh: string[] = [];
    if (shouldTranslate) {
      try {
        const t = await translateToChinese(
          { title: fetched.title, abstract: fetched.abstract },
          { domainHint: "FRP 复合材料，热塑拉挤方向" }
        );
        titleZh = t.titleZh || titleZh;
        abstractZh = t.abstractZh || abstractZh;
        keywordsZh = t.keywordsZh;
      } catch {}
    }
    const commentary = await generatePaperCommentary({
      title: titleZh,
      titleEn: fetched.titleEn ?? fetched.title,
      abstract: abstractZh,
      journal: fetched.journal,
      year: fetched.year,
      keywords: keywordsZh,
    });
    const id = `paper-${shortHash(fetched.externalId)}`;
    const slug = paperSlug(titleZh, id);
    await db
      .insert(papersTable)
      .values({
        id,
        slug,
        title: titleZh,
        titleEn: fetched.titleEn ?? fetched.title,
        authors: fetched.authors,
        affiliation: fetched.affiliation,
        journal: fetched.journal,
        year: fetched.year,
        volume: fetched.volume,
        issue: fetched.issue,
        pages: fetched.pages,
        doi: fetched.doi,
        abstract: abstractZh,
        commentary,
        keywords: keywordsZh.length ? keywordsZh : undefined,
        category: "process",
        language: (fetched.language ?? "en") as "zh" | "en",
        citationCount: fetched.citationCount ?? 0,
        sourceUrl: fetched.sourceUrl,
      })
      .onConflictDoNothing();
    return "ok";
  } catch (e) {
    console.warn(`  [paper] ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
    return "err";
  }
}
async function ingestPatent(p: FetchedPatent) {
  try {
    if (!p.title) return "skip";
    if (await patentExists(p)) return "skip";
    const shouldTranslate = p.countryCode !== "CN" && (p.title || p.abstract);
    let titleZh = p.title;
    let abstractZh = p.abstract;
    if (shouldTranslate) {
      try {
        const t = await translateToChinese(
          { title: p.title, abstract: p.abstract ?? "" },
          { domainHint: "FRP 复合材料专利（热塑拉挤方向）" }
        );
        titleZh = t.titleZh || titleZh;
        abstractZh = t.abstractZh || abstractZh;
      } catch {}
    }
    const id = `pat-${shortHash(p.externalId)}`;
    const slug = patentSlug(titleZh, id);
    await db
      .insert(patentsTable)
      .values({
        id,
        slug,
        title: titleZh,
        titleEn: p.titleEn ?? p.title,
        applicationNo: p.applicationNo,
        publicationNo: p.publicationNo,
        grantNo: p.grantNo,
        applicant: p.applicant,
        inventors: p.inventors,
        filingDate: p.filingDate,
        publicationDate: p.publicationDate,
        grantDate: p.grantDate,
        classification: p.classification,
        status: p.status ?? "pending",
        country: p.country,
        countryCode: p.countryCode,
        abstract: abstractZh,
        category: "process",
        sourceUrl: p.sourceUrl,
      })
      .onConflictDoNothing();
    return "ok";
  } catch (e) {
    console.warn(`  [patent] ${p.externalId}: ${e instanceof Error ? e.message : e}`);
    return "err";
  }
}

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY not set");
    process.exit(1);
  }
  const startPapers = await countPapers();
  const startPatents = await countPatents();
  console.log(
    `🚀 Thermoplastic start: papers=${startPapers}, patents=${startPatents}, concurrency=${CONCURRENCY}`
  );

  console.log(`\n📄 Phase 1: papers (${THERMOPLASTIC_PAPER_QUERIES.length} queries)`);
  for (let i = 0; i < THERMOPLASTIC_PAPER_QUERIES.length; i++) {
    const q = THERMOPLASTIC_PAPER_QUERIES[i];
    console.log(`\n🔍 [paper ${i + 1}/${THERMOPLASTIC_PAPER_QUERIES.length}] "${q}"`);
    const fetched = [
      ...(await fetchCrossRef(q, 10).catch(() => [] as FetchedPaper[])),
      ...(await fetchOpenAlex(q, 10).catch(() => [] as FetchedPaper[])),
    ];
    const seen = new Set<string>();
    const unique = fetched.filter((p) => {
      const k = (p.doi ?? p.externalId).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log(`  fetched=${fetched.length} unique=${unique.length}`);
    const stats = { ok: 0, skip: 0, err: 0 };
    await pool(unique, CONCURRENCY, async (p) => {
      const r = await ingestPaper(p);
      stats[r as "ok" | "skip" | "err"]++;
      if (r === "ok") console.log(`  ✓ ${p.title?.slice(0, 60)}`);
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  console.log(`\n🔖 Phase 2: patents (${THERMOPLASTIC_PATENT_QUERIES.length} queries)`);
  for (let i = 0; i < THERMOPLASTIC_PATENT_QUERIES.length; i++) {
    const q = THERMOPLASTIC_PATENT_QUERIES[i];
    console.log(`\n🔍 [patent ${i + 1}/${THERMOPLASTIC_PATENT_QUERIES.length}] "${q}"`);
    const fetched = await fetchGooglePatents(q, PER_QUERY).catch(() => [] as FetchedPatent[]);
    const seen = new Set<string>();
    const unique = fetched.filter((p) => {
      const k = p.publicationNo ?? p.externalId;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log(`  fetched=${fetched.length} unique=${unique.length}`);
    const stats = { ok: 0, skip: 0, err: 0 };
    await pool(unique, CONCURRENCY, async (p) => {
      const r = await ingestPatent(p);
      stats[r as "ok" | "skip" | "err"]++;
      if (r === "ok") {
        const cc = p.countryCode ? `[${p.countryCode}]` : "";
        console.log(`  ✓ ${cc} ${p.title?.slice(0, 60)}`);
      }
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  const endPapers = await countPapers();
  const endPatents = await countPatents();
  console.log(`\n📊 Final: papers ${startPapers} → ${endPapers} (+${endPapers - startPapers})`);
  console.log(`📊 Final: patents ${startPatents} → ${endPatents} (+${endPatents - startPatents})`);
  console.log(`\n🎉 Thermoplastic wave done.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
