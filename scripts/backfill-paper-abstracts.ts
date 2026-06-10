// Backfill REAL English abstracts for papers that ship as thin content.
//
// Why this exists
// ───────────────
// getfrp.com noindexes (and sitemap-excludes) any paper whose English abstract
// is shorter than 80 chars — see papers/[id]/page.tsx + sitemap.ts. Those are
// the 152 "Excluded by noindex" pages in Search Console. translate-all-zh.ts
// can't help them: it only TRANSLATES an existing Chinese abstract, and these
// rows have no abstract in either language — they're bare bibliographic records
// (title + authors + DOI). The fix is to fetch the genuine abstract from the
// same public sources we ingest from (OpenAlex / CrossRef), keyed by DOI, with
// a title-search fallback. We deliberately do NOT LLM-generate abstracts: a
// synthesised "abstract" for a paper the model never read is exactly the thin /
// fabricated content the noindex gate is there to keep out.
//
// A paper with no findable real abstract stays noindex — that is correct.
//
// Run:
//   pnpm tsx --env-file=.env.local scripts/backfill-paper-abstracts.ts --dry-run
//   pnpm tsx --env-file=.env.local scripts/backfill-paper-abstracts.ts --limit=50
//   pnpm tsx --env-file=.env.local scripts/backfill-paper-abstracts.ts --concurrency=3
//   pnpm tsx --env-file=.env.local scripts/backfill-paper-abstracts.ts --min-len=120
//
// Flags:
//   --dry-run        fetch + report, write nothing
//   --limit=N        process at most N candidate rows (default: all)
//   --concurrency=N  parallel workers (default: 4 — stay polite to free APIs)
//   --min-len=N      only accept a fetched abstract this long (default: 120;
//                    must clear the 80-char index threshold with margin)
//   --no-title-fallback   only match by DOI; skip the title-search fallback
//                         (safest — title matching can mis-attach an abstract)

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(DATABASE_URL);

// Polite-pool contact, matching src/lib/ingest/sources.ts.
const MAILTO = "f1frp2015@gmail.com";
const UA = `f1frp-abstract-backfill/1.0 (mailto:${MAILTO})`;

const dryRun = process.argv.includes("--dry-run");
const noTitleFallback = process.argv.includes("--no-title-fallback");
const numArg = (name: string, def: number): number => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? Number(a.split("=")[1]) : def;
};
const limit = numArg("limit", Infinity);
const concurrency = numArg("concurrency", 4);
// 80 is the index threshold (sitemap.ts MIN_ABSTRACT_LEN + page.tsx). Require
// a margin so we only promote papers with a genuinely useful abstract.
const minLen = numArg("min-len", 120);

type Row = {
  id: string;
  doi: string | null;
  title: string;
  title_en: string | null;
  abstract: string | null;
  abstract_en: string | null;
};

// ── small fetch helper with backoff on 429/5xx (mirrors translate-all-zh) ──
async function getJson(url: string): Promise<unknown | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null; // not found in this source — not an error
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.min(30000, 800 * 2 ** attempt + Math.random() * 400));
        continue;
      }
      return null; // 4xx other than 404/429 — give up on this source quietly
    } catch {
      await sleep(Math.min(30000, 800 * 2 ** attempt));
    }
  }
  return null;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── abstract extraction (same logic as sources.ts, re-stated locally) ──
function reconstructInverted(idx?: Record<string, number[]> | null): string | null {
  if (!idx) return null;
  const pairs: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const p of positions) pairs.push([p, word]);
  }
  if (!pairs.length) return null;
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs.map((p) => p[1]).join(" ").replace(/\s+/g, " ").trim();
}
function stripJats(s?: string | null): string | null {
  if (!s) return null;
  const t = s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t || null;
}

// Looks like a real English abstract (not boilerplate / "No abstract available").
function looksUsable(abs: string | null): abs is string {
  if (!abs) return false;
  const t = abs.trim();
  if (t.length < minLen) return false;
  if (/^(no abstract|abstract not available|n\/a)\b/i.test(t)) return false;
  // Must be predominantly Latin script (these are EN-titled papers).
  const ascii = (t.match(/[\x00-\x7F]/g) ?? []).length;
  return ascii / t.length > 0.6;
}

// ── DOI-keyed lookups ──────────────────────────────────────────────
async function abstractFromOpenAlexDoi(doi: string): Promise<string | null> {
  const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?select=abstract_inverted_index&mailto=${MAILTO}`;
  const j = (await getJson(url)) as { abstract_inverted_index?: Record<string, number[]> } | null;
  return reconstructInverted(j?.abstract_inverted_index);
}
async function abstractFromCrossRefDoi(doi: string): Promise<string | null> {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${MAILTO}`;
  const j = (await getJson(url)) as { message?: { abstract?: string } } | null;
  return stripJats(j?.message?.abstract);
}

// ── title-search fallback (only when no DOI), with similarity guard ──
function normTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
// token containment of the shorter title within the longer — robust to
// trailing subtitle truncation. Used only to reject wrong matches.
function titleSimilarity(a: string, b: string): number {
  const ta = new Set(normTitle(a).split(" ").filter((w) => w.length > 2));
  const tb = new Set(normTitle(b).split(" ").filter((w) => w.length > 2));
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const w of ta) if (tb.has(w)) overlap++;
  return overlap / Math.min(ta.size, tb.size);
}
async function abstractFromTitleSearch(title: string): Promise<string | null> {
  // OpenAlex full-text search, top 3 candidates, accept if title matches well.
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=3&select=title,abstract_inverted_index&mailto=${MAILTO}`;
  const j = (await getJson(url)) as
    | { results?: Array<{ title?: string; abstract_inverted_index?: Record<string, number[]> }> }
    | null;
  for (const cand of j?.results ?? []) {
    if (!cand.title) continue;
    if (titleSimilarity(title, cand.title) < 0.7) continue; // guard against wrong paper
    const abs = reconstructInverted(cand.abstract_inverted_index);
    if (looksUsable(abs)) return abs;
  }
  return null;
}

async function resolveAbstract(row: Row): Promise<{ abstract: string; via: string } | null> {
  if (row.doi) {
    const oa = await abstractFromOpenAlexDoi(row.doi);
    if (looksUsable(oa)) return { abstract: oa, via: "openalex:doi" };
    const cr = await abstractFromCrossRefDoi(row.doi);
    if (looksUsable(cr)) return { abstract: cr, via: "crossref:doi" };
  }
  if (!noTitleFallback && row.title_en) {
    const ts = await abstractFromTitleSearch(row.title_en);
    if (looksUsable(ts)) return { abstract: ts, via: "openalex:title" };
  }
  return null;
}

async function main() {
  console.log(
    `backfill-paper-abstracts — dryRun=${dryRun} limit=${limit} concurrency=${concurrency} minLen=${minLen} titleFallback=${!noTitleFallback}`,
  );

  // Candidates: English-facing papers (titleEn present → not 404 on getfrp.com)
  // whose English abstract is missing/too short to clear the index gate.
  const rows = (await sql.query(
    `SELECT id, doi, title, title_en, abstract, abstract_en
       FROM papers
      WHERE title_en IS NOT NULL AND btrim(title_en) <> ''
        AND (abstract_en IS NULL OR char_length(btrim(abstract_en)) < 80)
      ORDER BY citation_count DESC NULLS LAST`,
  )) as Row[];

  const todo = rows.slice(0, Math.min(rows.length, limit));
  console.log(`${rows.length} thin/abstract-less EN papers; processing ${todo.length}\n`);

  let cursor = 0;
  let filled = 0;
  let notFound = 0;
  let failed = 0;
  let done = 0;

  async function worker(workerId: number) {
    while (cursor < todo.length) {
      const row = todo[cursor++];
      try {
        const hit = await resolveAbstract(row);
        if (hit) {
          if (!dryRun) {
            // Write the real English abstract. Also seed `abstract` when empty
            // so the zh side isn't blank for an English-original paper; never
            // overwrite an existing Chinese abstract.
            await sql.query(
              `UPDATE papers
                  SET abstract_en = $1,
                      abstract = COALESCE(NULLIF(btrim(abstract), ''), $1),
                      updated_at = NOW()
                WHERE id = $2`,
              [hit.abstract, row.id],
            );
          }
          filled++;
          console.log(`  ✓ ${row.id} [${hit.via}] (${hit.abstract.length} ch) ${row.title_en?.slice(0, 55)}…`);
        } else {
          notFound++;
        }
      } catch (e) {
        failed++;
        console.error(`  ✗ ${row.id}:`, (e as Error).message);
      }
      done++;
      if (done % 25 === 0 || done === todo.length) {
        console.log(`  … ${done}/${todo.length}  filled=${filled} notFound=${notFound} failed=${failed}`);
      }
      await sleep(120 + workerId * 40); // polite spacing for free APIs
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));

  console.log(`\n==== DONE  filled=${filled}  notFound=${notFound}  failed=${failed}  (of ${todo.length})`);
  if (dryRun) console.log("(dry run — nothing written)");
  else if (filled) console.log("Next: redeploy so sitemap.ts re-emits these URLs, then Request Indexing in GSC.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
