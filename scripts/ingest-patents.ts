// Ingest patents from public sources with auto-translation to Chinese.
//
// Usage:
//   pnpm tsx --env-file=.env.local scripts/ingest-patents.ts --query "carbon fiber reinforced polymer" --source uspto --rows 10 --category process
//
// Flags:
//   --query    search query (required)
//   --source   uspto | epo  (default: uspto)
//   --rows     max per source   (default: 10)
//   --category patents category (default: application)
//   --no-translate  skip AI translation

import { fetchPatentsView, fetchEpoOps } from "../src/lib/ingest/sources";
import { ingestPatent } from "../src/lib/ingest";

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
  const source = (arg("source", "uspto") ?? "uspto") as "uspto" | "epo";
  const rows = Number(arg("rows", "10"));
  const category = arg("category", "application");
  const noTranslate = flag("no-translate");

  if (!query) {
    console.error("Usage: --query <search> [--source uspto|epo] [--rows N] [--category <id>] [--no-translate]");
    process.exit(1);
  }

  console.log(`🔎 query=${JSON.stringify(query)} source=${source} rows=${rows} translate=${!noTranslate}`);
  let fetched: Awaited<ReturnType<typeof fetchPatentsView>> = [];
  if (source === "uspto") fetched = await fetchPatentsView(query, rows);
  else if (source === "epo") fetched = await fetchEpoOps(query, rows);

  console.log(`✏️  fetched=${fetched.length}`);
  let ok = 0;
  for (const p of fetched) {
    if (!p.title || !p.abstract) {
      console.log("  skip (missing fields):", p.externalId);
      continue;
    }
    try {
      const id = await ingestPatent(p, { category, translate: !noTranslate });
      ok++;
      console.log(`  ✓ ${id}  ${p.title.slice(0, 60)}…`);
    } catch (e) {
      console.log(
        `  ✗ ${p.externalId}:`,
        e instanceof Error ? e.message : e
      );
    }
  }
  console.log(`\n✅ inserted/updated: ${ok} / ${fetched.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
