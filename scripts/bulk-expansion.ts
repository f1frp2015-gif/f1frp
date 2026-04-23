// One-shot expansion: window/door + automotive HP-RTM + profile-apps queries.
// Fetches both papers (CrossRef/OpenAlex) and patents (Google Patents) through
// the EXPANSION_* query pools, so this run ONLY adds content in the requested
// themes without re-running the full pultrusion pool.
//
// Run: pnpm tsx --env-file=.env.local scripts/bulk-expansion.ts
//   Optional: --concurrency=N (default 3), --per-query=N (default 30 for patents)

import { createHash } from "node:crypto";
import { db } from "../src/lib/db";
import { papers as papersTable, patents as patentsTable } from "../src/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import {
  fetchCrossRef,
  fetchOpenAlex,
  fetchGooglePatents,
} from "../src/lib/ingest/sources";
import type { FetchedPaper, FetchedPatent } from "../src/lib/ingest/sources";
import { paperSlug, patentSlug } from "../src/lib/slug";
import { translateToChinese } from "../src/lib/ingest/translate";
import { generatePaperCommentary } from "../src/lib/ingest/commentary";
import {
  EXPANSION_PAPER_QUERIES,
  EXPANSION_PATENT_QUERIES,
} from "../src/lib/ingest/pultrusion-pool";

type Args = { concurrency: number; perQuery: number };
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const a: Args = { concurrency: 3, perQuery: 30 };
  for (const s of args) {
    if (s.startsWith("--concurrency="))
      a.concurrency = Math.max(1, parseInt(s.slice(14), 10) || 3);
    else if (s.startsWith("--per-query="))
      a.perQuery = Math.max(5, parseInt(s.slice(12), 10) || 30);
  }
  return a;
}
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

function paperCategory(q: string) {
  if (/window|door|frame|门窗|断桥|curtain|sliding|mullion/i.test(q)) return "application";
  if (/HP-RTM|HPRTM|high-pressure|高压 RTM/i.test(q)) return "process";
  if (/railway|sleeper|aerospace|antenna|marine|offshore|walkway|charging|utility|bridge|hvac|platform/i.test(q))
    return "application";
  return "application";
}
function patentCategory(q: string) {
  if (/window|door|frame|门窗|断桥|curtain|sliding|mullion/i.test(q)) return "product";
  if (/HP-RTM|高压 RTM/i.test(q)) return "process";
  if (/apparatus|mold|injection|preform|模具|注胶/i.test(q)) return "process";
  if (/railway|sleeper|aerospace|antenna|marine|offshore|walkway|utility|pole|bridge|hvac|floor|boat|建筑|桥梁|基站|车厢/i.test(q))
    return "product";
  return "product";
}

async function ingestPaper(fetched: FetchedPaper, category: string) {
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
          { domainHint: "FRP 复合材料，拉挤/HP-RTM/门窗/汽车 方向" }
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
        category,
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

async function ingestPatent(p: FetchedPatent, category: string) {
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
          { domainHint: "FRP 复合材料专利（拉挤/HP-RTM/门窗/汽车 方向）" }
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
        category,
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
  const { concurrency, perQuery } = parseArgs();

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY not set");
    process.exit(1);
  }

  const startPapers = await countPapers();
  const startPatents = await countPatents();
  console.log(
    `🚀 Expansion start: papers=${startPapers}, patents=${startPatents}, concurrency=${concurrency}, perQuery=${perQuery}`
  );

  // ─── Papers phase ─────────────────────────────────────
  console.log(`\n📄 Phase 1: papers (${EXPANSION_PAPER_QUERIES.length} queries)`);
  for (let i = 0; i < EXPANSION_PAPER_QUERIES.length; i++) {
    const q = EXPANSION_PAPER_QUERIES[i];
    console.log(`\n🔍 [paper ${i + 1}/${EXPANSION_PAPER_QUERIES.length}] "${q}"`);
    const category = paperCategory(q);
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
    await pool(unique, concurrency, async (p) => {
      const r = await ingestPaper(p, category);
      stats[r as "ok" | "skip" | "err"]++;
      if (r === "ok") console.log(`  ✓ ${p.title?.slice(0, 60)}`);
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  const midPapers = await countPapers();
  console.log(`\n📊 Papers: ${startPapers} → ${midPapers} (+${midPapers - startPapers})`);

  // ─── Patents phase ────────────────────────────────────
  console.log(`\n🔖 Phase 2: patents (${EXPANSION_PATENT_QUERIES.length} queries)`);
  for (let i = 0; i < EXPANSION_PATENT_QUERIES.length; i++) {
    const q = EXPANSION_PATENT_QUERIES[i];
    console.log(`\n🔍 [patent ${i + 1}/${EXPANSION_PATENT_QUERIES.length}] "${q}"`);
    const category = patentCategory(q);
    const fetched = await fetchGooglePatents(q, perQuery).catch(() => [] as FetchedPatent[]);
    const seen = new Set<string>();
    const unique = fetched.filter((p) => {
      const k = p.publicationNo ?? p.externalId;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log(`  fetched=${fetched.length} unique=${unique.length}`);
    const stats = { ok: 0, skip: 0, err: 0 };
    await pool(unique, concurrency, async (p) => {
      const r = await ingestPatent(p, category);
      stats[r as "ok" | "skip" | "err"]++;
      if (r === "ok") {
        const cc = p.countryCode ? `[${p.countryCode}]` : "";
        console.log(`  ✓ ${cc} ${p.title?.slice(0, 60)}`);
      }
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  const endPatents = await countPatents();
  const endPapers = await countPapers();
  console.log(`\n📊 Final: papers ${startPapers} → ${endPapers} (+${endPapers - startPapers})`);
  console.log(`📊 Final: patents ${startPatents} → ${endPatents} (+${endPatents - startPatents})`);
  console.log(`\n🎉 Expansion done.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
