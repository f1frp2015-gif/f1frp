// Ingest papers from public sources with auto-translation to Chinese.
//
// Usage:
//   pnpm tsx --env-file=.env.local scripts/ingest-papers.ts --query "carbon fiber recycling" --source crossref --rows 10 --category recycling
//   pnpm tsx --env-file=.env.local scripts/ingest-papers.ts --query "FRP fatigue wind blade" --source openalex --rows 15 --category durability
//   pnpm tsx --env-file=.env.local scripts/ingest-papers.ts --query "pultrusion" --source both --rows 20
//
// Flags:
//   --query    search query (required)
//   --source   crossref | openalex | both  (default: crossref)
//   --rows     max per source             (default: 10)
//   --category papers category id         (default: application)
//   --no-translate  skip AI translation (keeps English)

import { fetchCrossRef, fetchOpenAlex } from "../src/lib/ingest/sources";
import { ingestPaper } from "../src/lib/ingest";

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.findIndex((a) => a === `--${name}`);
  if (i === -1) return def;
  return process.argv[i + 1];
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const query = arg("query");
  const source = (arg("source", "crossref") ?? "crossref") as
    | "crossref"
    | "openalex"
    | "both";
  const rows = Number(arg("rows", "10"));
  const category = arg("category", "application");
  const noTranslate = flag("no-translate");

  if (!query) {
    console.error("Usage: --query <search> [--source crossref|openalex|both] [--rows N] [--category <id>] [--no-translate]");
    process.exit(1);
  }

  console.log(`🔎 query=${JSON.stringify(query)} source=${source} rows=${rows} category=${category} translate=${!noTranslate}`);
  const fetched = [];
  if (source === "crossref" || source === "both") {
    console.log("→ CrossRef …");
    fetched.push(...(await fetchCrossRef(query, rows)));
  }
  if (source === "openalex" || source === "both") {
    console.log("→ OpenAlex …");
    fetched.push(...(await fetchOpenAlex(query, rows)));
  }

  // de-dupe by DOI, keeping first (highest cited usually from crossref)
  const seen = new Set<string>();
  const unique = fetched.filter((p) => {
    const key = p.doi?.toLowerCase() ?? p.externalId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`✏️  fetched=${fetched.length} unique=${unique.length}`);

  let ok = 0;
  for (const p of unique) {
    if (!p.title || !p.abstract) {
      console.log("  skip (missing title/abstract):", p.externalId);
      continue;
    }
    try {
      const id = await ingestPaper(p, { category, translate: !noTranslate });
      ok++;
      console.log(`  ✓ ${id}  ${p.title.slice(0, 60)}…`);
    } catch (e) {
      console.log(
        `  ✗ ${p.externalId}:`,
        e instanceof Error ? e.message : e
      );
    }
  }
  console.log(`\n✅ inserted/updated: ${ok} / ${unique.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
