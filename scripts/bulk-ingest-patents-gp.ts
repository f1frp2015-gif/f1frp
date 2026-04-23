// Bulk ingest patents from Google Patents, focus on pultrusion + RTM,
// glass + carbon fiber. Runs until target_patents or queries exhausted.
//
// Run: pnpm tsx --env-file=.env.local scripts/bulk-ingest-patents-gp.ts
//   Optional flags:
//     --target=N           default 200
//     --concurrency=N      default 3
//     --per-query=N        max results per query page, default 30

import { createHash } from "node:crypto";
import { db } from "../src/lib/db";
import { patents as patentsTable } from "../src/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { fetchGooglePatents } from "../src/lib/ingest/sources";
import type { FetchedPatent } from "../src/lib/ingest/sources";
import { patentSlug } from "../src/lib/slug";
import { translateToChinese } from "../src/lib/ingest/translate";
import { GP_PATENT_QUERIES } from "../src/lib/ingest/pultrusion-pool";

type Args = { target: number; concurrency: number; perQuery: number };
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const a: Args = { target: 200, concurrency: 3, perQuery: 30 };
  for (const s of args) {
    if (s.startsWith("--target=")) a.target = parseInt(s.slice(9), 10);
    else if (s.startsWith("--concurrency="))
      a.concurrency = Math.max(1, parseInt(s.slice(14), 10) || 3);
    else if (s.startsWith("--per-query="))
      a.perQuery = Math.max(5, parseInt(s.slice(12), 10) || 30);
  }
  return a;
}

function shortHash(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 10);
}

async function countPatents(): Promise<number> {
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(patentsTable);
  return r.c;
}

async function patentExists(p: FetchedPatent): Promise<boolean> {
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
  const r = await db
    .select({ id: patentsTable.id })
    .from(patentsTable)
    .where(eq(patentsTable.id, id))
    .limit(1);
  return r.length > 0;
}

function categoryFor(q: string): string {
  if (/die|pulling|heating|impregnation|injection|curing|mold|tool|preform/i.test(q))
    return "process";
  if (/resin|thermoplastic|UV|RTM/i.test(q)) return "process";
  if (/rebar|window|cable|grating|spar|pole|frame|deck|tubular|solar/i.test(q))
    return "product";
  if (/fiber|carbon|glass|E-glass|玻纤|碳纤维/i.test(q)) return "fiber";
  if (/拉挤|树脂传递/i.test(q)) return "process";
  return "process";
}

async function ingestOne(p: FetchedPatent, category: string): Promise<"ok" | "skip" | "err"> {
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
          { domainHint: "FRP 复合材料专利（拉挤 / RTM 工艺优先）" }
        );
        titleZh = t.titleZh || titleZh;
        abstractZh = t.abstractZh || abstractZh;
      } catch (e) {
        // Keep original if translation fails
        console.warn(`  [tr] ${p.externalId}: ${e instanceof Error ? e.message : e}`);
      }
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
    console.warn(`  [ingest] ${p.externalId}: ${e instanceof Error ? e.message : e}`);
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
  const { target, concurrency, perQuery } = parseArgs();

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY not set");
    process.exit(1);
  }

  const start = await countPatents();
  console.log(`🚀 start=${start} target=${target} concurrency=${concurrency} perQuery=${perQuery}`);
  console.log(`📋 queries=${GP_PATENT_QUERIES.length}\n`);

  let qIdx = 0;
  for (const q of GP_PATENT_QUERIES) {
    qIdx++;
    const current = await countPatents();
    if (current >= target) {
      console.log(`✅ reached target, stopping.`);
      break;
    }
    console.log(`\n🔍 [${qIdx}/${GP_PATENT_QUERIES.length}] "${q}" (now=${current}/${target})`);
    const category = categoryFor(q);

    const fetched = await fetchGooglePatents(q, perQuery).catch((e) => {
      console.warn(`  [fetch] ${e instanceof Error ? e.message : e}`);
      return [] as FetchedPatent[];
    });
    // Dedupe within batch
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
      if ((await countPatents()) >= target) return;
      const r = await ingestOne(p, category);
      stats[r]++;
      if (r === "ok") {
        const cc = p.countryCode ? `[${p.countryCode}]` : "";
        console.log(`  ✓ ${cc} ${p.title?.slice(0, 60)}`);
      }
    });
    console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err}`);
  }

  const end = await countPatents();
  console.log(`\n🎉 done: ${start} → ${end} (+${end - start})`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
