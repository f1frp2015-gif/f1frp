// Bulk ingest pultrusion-heavy papers + patents using Claude Opus 4.7.
// Target: paper_count >= TARGET_PAPERS and patent_count >= TARGET_PATENTS.
// Idempotent: dedupes against existing DB (by DOI / source URL).
//
// Run: pnpm tsx --env-file=.env.local scripts/bulk-ingest-pultrusion.ts
//   Optional flags:
//     --target-papers=N    (default 100)
//     --target-patents=N   (default 100)
//     --concurrency=N      (default 3)

import { createHash } from "node:crypto";
import { db } from "../src/lib/db";
import { papers as papersTable, patents as patentsTable } from "../src/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { fetchCrossRef, fetchOpenAlex, fetchPatentsView } from "../src/lib/ingest/sources";
import type { FetchedPaper, FetchedPatent } from "../src/lib/ingest/sources";
import { paperSlug, patentSlug } from "../src/lib/slug";
import { translateToChinese } from "../src/lib/ingest/translate";
import { generatePaperCommentary } from "../src/lib/ingest/commentary";
import {
  PULTRUSION_PAPER_QUERIES,
  PULTRUSION_PATENT_QUERIES,
} from "../src/lib/ingest/pultrusion-pool";

type Args = {
  targetPapers: number;
  targetPatents: number;
  concurrency: number;
};
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const a: Args = { targetPapers: 100, targetPatents: 100, concurrency: 3 };
  for (const s of args) {
    if (s.startsWith("--target-papers=")) a.targetPapers = parseInt(s.slice(16), 10);
    else if (s.startsWith("--target-patents=")) a.targetPatents = parseInt(s.slice(17), 10);
    else if (s.startsWith("--concurrency="))
      a.concurrency = Math.max(1, parseInt(s.slice(14), 10) || 3);
  }
  return a;
}

function shortHash(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 10);
}

async function countPapers(): Promise<number> {
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(papersTable);
  return r.c;
}
async function countPatents(): Promise<number> {
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(patentsTable);
  return r.c;
}

async function paperExists(doi?: string, externalId?: string): Promise<boolean> {
  if (doi) {
    const r = await db
      .select({ id: papersTable.id })
      .from(papersTable)
      .where(eq(papersTable.doi, doi))
      .limit(1);
    if (r.length) return true;
  }
  if (externalId) {
    const id = `paper-${shortHash(externalId)}`;
    const r = await db
      .select({ id: papersTable.id })
      .from(papersTable)
      .where(eq(papersTable.id, id))
      .limit(1);
    if (r.length) return true;
  }
  return false;
}

async function patentExists(sourceUrl?: string, grantNo?: string, externalId?: string): Promise<boolean> {
  if (sourceUrl) {
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.sourceUrl, sourceUrl))
      .limit(1);
    if (r.length) return true;
  }
  if (grantNo) {
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.grantNo, grantNo))
      .limit(1);
    if (r.length) return true;
  }
  if (externalId) {
    const id = `pat-${shortHash(externalId)}`;
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.id, id))
      .limit(1);
    if (r.length) return true;
  }
  return false;
}

async function ingestOnePaper(fetched: FetchedPaper, categoryHint: string): Promise<"ok" | "skip" | "err"> {
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
          { domainHint: "FRP 纤维增强复合材料，尤其是拉挤工艺" }
        );
        titleZh = t.titleZh || titleZh;
        abstractZh = t.abstractZh || abstractZh;
        keywordsZh = t.keywordsZh;
      } catch (e) {
        console.warn(`  [translate] fail ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
      }
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
        category: categoryHint,
        language: (fetched.language ?? "en") as "zh" | "en",
        citationCount: fetched.citationCount ?? 0,
        sourceUrl: fetched.sourceUrl,
      })
      .onConflictDoNothing();
    return "ok";
  } catch (e) {
    console.warn(`  [ingest paper] ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
    return "err";
  }
}

async function ingestOnePatent(fetched: FetchedPatent, categoryHint: string): Promise<"ok" | "skip" | "err"> {
  try {
    if (!fetched.title) return "skip";
    if (await patentExists(fetched.sourceUrl, fetched.grantNo, fetched.externalId)) return "skip";

    const shouldTranslate = fetched.countryCode !== "CN" && (fetched.title || fetched.abstract);
    let titleZh = fetched.title;
    let abstractZh = fetched.abstract;

    if (shouldTranslate) {
      try {
        const t = await translateToChinese(
          { title: fetched.title, abstract: fetched.abstract },
          { domainHint: "FRP 拉挤工艺专利" }
        );
        titleZh = t.titleZh || titleZh;
        abstractZh = t.abstractZh || abstractZh;
      } catch (e) {
        console.warn(`  [translate] fail ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
      }
    }

    const id = `pat-${shortHash(fetched.externalId)}`;
    const slug = patentSlug(titleZh, id);
    await db
      .insert(patentsTable)
      .values({
        id,
        slug,
        title: titleZh,
        titleEn: fetched.titleEn ?? fetched.title,
        applicationNo: fetched.applicationNo,
        publicationNo: fetched.publicationNo,
        grantNo: fetched.grantNo,
        applicant: fetched.applicant,
        inventors: fetched.inventors,
        filingDate: fetched.filingDate,
        publicationDate: fetched.publicationDate,
        grantDate: fetched.grantDate,
        classification: fetched.classification,
        status: fetched.status ?? "pending",
        country: fetched.country,
        countryCode: fetched.countryCode,
        abstract: abstractZh,
        category: categoryHint,
        sourceUrl: fetched.sourceUrl,
      })
      .onConflictDoNothing();
    return "ok";
  } catch (e) {
    console.warn(`  [ingest patent] ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
    return "err";
  }
}

// Round-robin worker pool
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
  const { targetPapers, targetPatents, concurrency } = parseArgs();

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY not set");
    process.exit(1);
  }

  const startPapers = await countPapers();
  const startPatents = await countPatents();
  console.log(`🚀 Start: papers=${startPapers}, patents=${startPatents}`);
  console.log(`🎯 Target: papers=${targetPapers}, patents=${targetPatents}`);
  console.log(`   concurrency=${concurrency}\n`);

  // ─── Phase 1: Papers ───
  console.log("📄 Phase 1: papers");
  const categoryFor = (q: string): string => {
    if (/die|heating|pull|curing|impregnation|simulation|void|tension|speed/.test(q)) return "process";
    if (/resin|epoxy|vinyl|polyurethane|thermoplastic|UV/i.test(q)) return "matrix";
    if (/carbon|glass|basalt|aramid|fiber/.test(q)) return "fiber";
    if (/rebar|beam|cable|grating|window|blade|pole|bridge|sandwich|solar|wind/.test(q))
      return "application";
    if (/fatigue|creep|shear|bolt|fire/.test(q)) return "durability";
    return "process";
  };

  for (const q of PULTRUSION_PAPER_QUERIES) {
    if ((await countPapers()) >= targetPapers) {
      console.log(`✅ Reached paper target, stopping.`);
      break;
    }
    console.log(`\n🔍 Query: "${q}"`);
    const category = categoryFor(q);
    const fetched = [
      ...(await fetchCrossRef(q, 10).catch((e) => {
        console.warn(`  [crossref] ${e instanceof Error ? e.message : e}`);
        return [] as FetchedPaper[];
      })),
      ...(await fetchOpenAlex(q, 10).catch((e) => {
        console.warn(`  [openalex] ${e instanceof Error ? e.message : e}`);
        return [] as FetchedPaper[];
      })),
    ];
    // Dedupe within batch by DOI
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
      if ((await countPapers()) >= targetPapers) return;
      const r = await ingestOnePaper(p, category);
      stats[r]++;
      if (r === "ok") {
        console.log(`  ✓ ${p.title?.slice(0, 60)}`);
      }
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  const afterPapers = await countPapers();
  console.log(`\n📊 Papers: ${startPapers} → ${afterPapers} (+${afterPapers - startPapers})`);

  // ─── Phase 2: Patents ───
  console.log("\n🔖 Phase 2: patents");
  const patentCategoryFor = (q: string): string => {
    if (/die|pulling|heating|impregnation|curing|inspection/.test(q)) return "process";
    if (/resin|thermoplastic|UV|epoxy/i.test(q)) return "resin";
    if (/rebar|window|cable|grating|blade|pole|frame|deck|tubular/.test(q)) return "product";
    if (/fiber|carbon|glass/.test(q)) return "fiber";
    return "process";
  };

  for (const q of PULTRUSION_PATENT_QUERIES) {
    if ((await countPatents()) >= targetPatents) {
      console.log(`✅ Reached patent target, stopping.`);
      break;
    }
    console.log(`\n🔍 Query: "${q}"`);
    const category = patentCategoryFor(q);
    const fetched = await fetchPatentsView(q, 15).catch((e) => {
      console.warn(`  [uspto] ${e instanceof Error ? e.message : e}`);
      return [] as FetchedPatent[];
    });
    console.log(`  fetched=${fetched.length}`);

    const stats = { ok: 0, skip: 0, err: 0 };
    await pool(fetched, concurrency, async (p) => {
      if ((await countPatents()) >= targetPatents) return;
      const r = await ingestOnePatent(p, category);
      stats[r]++;
      if (r === "ok") {
        console.log(`  ✓ ${p.title?.slice(0, 60)}`);
      }
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  const afterPatents = await countPatents();
  console.log(`\n📊 Patents: ${startPatents} → ${afterPatents} (+${afterPatents - startPatents})`);

  console.log("\n🎉 Bulk ingest done.");
  console.log(`   papers:  ${afterPapers}`);
  console.log(`   patents: ${afterPatents}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
