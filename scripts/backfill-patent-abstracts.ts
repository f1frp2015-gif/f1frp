// Backfill REAL English abstracts for patents that ship as thin content.
//
// Why this exists
// ───────────────
// Same indexing gate as papers: patents/[id]/page.tsx noindexes (and sitemap.ts
// excludes) any patent whose English abstract is < 80 chars. Patents have no
// DOI, so the paper backfill can't reach them. Instead we fetch each patent's
// individual Google Patents page (`/patent/{pubNo}/en`) and read the full
// abstract from <meta name="description"> — for CN patents Google serves an
// English machine translation there, which is real, attributable content
// (far better than fabricating one). fetchGooglePatents() only returns a
// 1-sentence search snippet, so we go to the patent page directly.
//
// Complements translate-all-zh.ts (which covers patents that DO have a Chinese
// abstract to translate). This one handles the bare bibliographic records.
// A patent with no findable abstract stays noindex — that is correct.
//
// Run:
//   pnpm tsx --env-file=.env.local scripts/backfill-patent-abstracts.ts --dry-run --limit=30
//   pnpm tsx --env-file=.env.local scripts/backfill-patent-abstracts.ts --concurrency=3
//   pnpm tsx --env-file=.env.local scripts/backfill-patent-abstracts.ts --min-len=120
//
// Flags:
//   --dry-run        fetch + report, write nothing
//   --limit=N        process at most N candidate rows (default: all)
//   --concurrency=N  parallel workers (default: 3 — Google Patents is HTML, be gentle)
//   --min-len=N      only accept an abstract this long (default: 120; must clear
//                    the 80-char index threshold with margin)

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(DATABASE_URL);

// Browser-ish UA — Google Patents serves the full page to a normal client.
// Matches the gpatents adapter in src/lib/ingest/sources.ts.
const UA = "Mozilla/5.0 (compatible; f1frp-abstract-backfill/1.0; +https://f1frp.com)";

const dryRun = process.argv.includes("--dry-run");
const numArg = (name: string, def: number): number => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? Number(a.split("=")[1]) : def;
};
const limit = numArg("limit", Infinity);
const concurrency = numArg("concurrency", 3);
const minLen = numArg("min-len", 120);

type Row = {
  id: string;
  publication_no: string | null;
  grant_no: string | null;
  source_url: string | null;
  title_en: string | null;
  abstract: string | null;
  abstract_en: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      });
      if (res.ok) return await res.text();
      if (res.status === 404) return null; // patent page not on Google Patents
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.min(30000, 1000 * 2 ** attempt + Math.random() * 500));
        continue;
      }
      return null;
    } catch {
      await sleep(Math.min(30000, 1000 * 2 ** attempt));
    }
  }
  return null;
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
}

// Pull the abstract out of a Google Patents /patent/{pubNo}/en page.
// Primary: <meta name="description"> (full abstract, clean, no inner tags).
// Fallback: <section itemprop="abstract"> with the leading "Abstract" stripped.
function abstractFromPatentHtml(html: string): string | null {
  const meta = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (meta?.[1]) {
    const t = unescapeHtml(meta[1]).replace(/\s+/g, " ").trim();
    if (t) return t;
  }
  const sec = html.match(/itemprop="abstract"[^>]*>([\s\S]*?)<\/section>/i);
  if (sec?.[1]) {
    const t = unescapeHtml(sec[1].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .replace(/^\s*Abstract\s*/i, "")
      .trim();
    if (t) return t;
  }
  return null;
}

function looksUsable(abs: string | null): abs is string {
  if (!abs) return false;
  const t = abs.trim();
  if (t.length < minLen) return false;
  if (/^(no abstract|abstract not available|n\/a)\b/i.test(t)) return false;
  // These are EN-facing patents — require a Latin-majority abstract so we don't
  // store an untranslated CN block (the /en page should already be English).
  const ascii = (t.match(/[\x00-\x7F]/g) ?? []).length;
  return ascii / t.length > 0.6;
}

// Publication number, in Google Patents form (e.g. CN108859304B, US9499928B2).
function pubNumber(row: Row): string | null {
  const direct = (row.publication_no ?? row.grant_no ?? "").replace(/\s+/g, "");
  if (direct) return direct;
  // Fallback: extract from source_url like https://patents.google.com/patent/CN108859304B/en
  const m = row.source_url?.match(/\/patent\/([A-Z0-9]+)/i);
  return m?.[1] ?? null;
}

async function main() {
  console.log(
    `backfill-patent-abstracts — dryRun=${dryRun} limit=${limit} concurrency=${concurrency} minLen=${minLen}`,
  );

  // English-facing patents (title_en present → not 404 on getfrp.com, ASCII id
  // → emitted by sitemap.ts) whose English abstract can't clear the index gate.
  const allRows = (await sql.query(
    `SELECT id, publication_no, grant_no, source_url, title_en, abstract, abstract_en
       FROM patents
      WHERE title_en IS NOT NULL AND btrim(title_en) <> ''
        AND (abstract_en IS NULL OR char_length(btrim(abstract_en)) < 80)
      ORDER BY updated_at DESC NULLS LAST`,
  )) as Row[];

  // Only ASCII-id patents are emitted by sitemap.ts / served on getfrp.com;
  // skip the rest so we don't spend fetches on URLs Google never sees.
  const rows = allRows.filter((r) => /^[\x00-\x7F]+$/.test(r.id));
  const todo = rows.slice(0, Math.min(rows.length, limit));
  console.log(`${rows.length} thin/abstract-less EN patents; processing ${todo.length}\n`);

  let cursor = 0;
  let filled = 0;
  let noPub = 0;
  let notFound = 0;
  let failed = 0;
  let done = 0;

  async function worker(workerId: number) {
    while (cursor < todo.length) {
      const row = todo[cursor++];
      try {
        const pub = pubNumber(row);
        if (!pub) {
          noPub++;
        } else {
          const html = await getHtml(`https://patents.google.com/patent/${pub}/en`);
          const abs = html ? abstractFromPatentHtml(html) : null;
          if (looksUsable(abs)) {
            if (!dryRun) {
              await sql.query(
                `UPDATE patents
                    SET abstract_en = $1,
                        abstract = COALESCE(NULLIF(btrim(abstract), ''), $1),
                        updated_at = NOW()
                  WHERE id = $2`,
                [abs, row.id],
              );
            }
            filled++;
            console.log(`  ✓ ${row.id} [${pub}] (${abs.length} ch) ${row.title_en?.slice(0, 50)}…`);
          } else {
            notFound++;
          }
        }
      } catch (e) {
        failed++;
        console.error(`  ✗ ${row.id}:`, (e as Error).message);
      }
      done++;
      if (done % 25 === 0 || done === todo.length) {
        console.log(`  … ${done}/${todo.length}  filled=${filled} noPub=${noPub} notFound=${notFound} failed=${failed}`);
      }
      // Google Patents is HTML, not an API — space requests politely.
      await sleep(500 + workerId * 150);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));

  console.log(
    `\n==== DONE  filled=${filled}  noPub=${noPub}  notFound=${notFound}  failed=${failed}  (of ${todo.length})`,
  );
  if (dryRun) console.log("(dry run — nothing written)");
  else if (filled) console.log("Next: redeploy so sitemap.ts re-emits these URLs, then Request Indexing in GSC.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
