// ─────────────────────────────────────────────────────────────────────────────
// Anti-fabrication eval harness for the f1frp chat AI.
//
//   pnpm tsx --env-file=.env.local scripts/eval/run.ts
//   pnpm tsx --env-file=.env.local scripts/eval/run.ts --provider deepseek
//   pnpm tsx --env-file=.env.local scripts/eval/run.ts --side domestic
//   pnpm tsx scripts/eval/run.ts --dry-run        # validate golden-set, build chains, print plan
//
// WHAT THIS IS (and is NOT):
//   This is the trust precondition for deepening AI in the business: a golden
//   set of FRP questions with KNOWN-CORRECT answers, asked to the real chat AI
//   through the SAME gateway (provider.ts) the chat route uses, then scored by
//   a deterministic RULE-BASED check that catches fabricated numbers / standard
//   codes / specs. It is NOT the deterministic unit `run-evals.ts` gate (those
//   are pure functions, no LLM). It IS additive to it.
//
//   ★ The golden-set is itself held to the anti-fabrication standard: every
//     `expected` value comes from the repo's own curated data ("repo"), a
//     universally-verifiable fact ("universal"), or is marked "todo-verify".
//     See scripts/eval/README.md for the honesty rule.
//
// SCORING (rule-based, anti-fabrication focus — LLM-judge intentionally OFF):
//   PASS  if every `must_include` substring is present AND no `must_not_claim`
//         substring is present in the model's answer.
//   FAIL  if a `must_not_claim` appears (a fabrication / dangerous-claim signal)
//         OR a required `must_include` is missing.
//   A case with empty `must_include` passes the inclusion half automatically —
//         such cases are pure must_not_claim (anti-fabrication) tests.
//   Matching is case-insensitive and whitespace-insensitive for standard codes
//         (so "GB/T 1447" matches "GB/T1447" / "GB/T  1447").
//
// GFW / BRAND INVARIANT (★ respected, never broken):
//   We build models ONLY through getChatModelChain(host, requested). The host
//   invariant in provider.ts guarantees a domestic case is never routed to
//   Google and an overseas case never to a 国产 provider. Locally (Mac mini in
//   China): 国产 keys (Zhipu/DashScope/DeepSeek) are directly reachable; Google/
//   Gemini is GFW-blocked unless GOOGLE_AI_GATEWAY_URL is set. The overseas side
//   is therefore SKIPPED with a clear note when Gemini is unreachable rather
//   than failing the harness.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateText, type LanguageModel } from "ai";
import {
  getChatModelChain,
  chatProviderChain,
  type ChatModelInChain,
} from "@/lib/ai/provider";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_EN } from "@/lib/ai/knowledge";

// ── env loading (mirror gen-article-bodies.ts so `pnpm tsx` works with or
//    without --env-file) ────────────────────────────────────────────────────
for (const envPath of [".env.local", ".env"]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    let value = raw.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// ── types ────────────────────────────────────────────────────────────────────
type Side = "domestic" | "overseas" | "both";
type SourceKind = "repo" | "universal" | "todo-verify";

interface GoldenCase {
  id: string;
  question: string;
  category: string;
  side?: Side;
  expected: {
    must_include?: string[];
    must_not_claim?: string[];
    notes?: string;
  };
  source: SourceKind;
  needs_review?: boolean;
}

interface GoldenSet {
  cases: GoldenCase[];
}

type ProviderId = "zhipu" | "qwen" | "deepseek" | "google" | "openrouter";

// A "synthetic host" per side that pickProviderForHost honours, so the gateway
// resolves the right provider chain WITHOUT us ever hand-picking a provider
// (keeps the host/GFW invariant authoritative).
const DOMESTIC_HOST = "f1frp.com";
const OVERSEAS_HOST = "getfrp.com";

// ── cli flags ──────────────────────────────────────────────────────────────
function parseArgs(argv: string[]) {
  const out: {
    provider?: ProviderId;
    side?: Side;
    dryRun: boolean;
    maxTokens: number;
  } = { dryRun: false, maxTokens: 700 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--provider") out.provider = argv[++i] as ProviderId;
    else if (a === "--side") out.side = argv[++i] as Side;
    else if (a === "--max-tokens") out.maxTokens = Number(argv[++i]) || 700;
  }
  return out;
}

// ── scoring (rule-based, deterministic) ──────────────────────────────────────
// Normalize for substring matching: lowercase + collapse all whitespace. This
// makes "GB/T 1447" match "gb/t1447" and "ISO 527-4" match "iso 527 4"→no (we
// keep '-'); standard codes are matched whitespace-insensitively only.
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function normTight(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}
// Present if the needle appears either with normal spacing or whitespace-tight
// (the latter catches "GB/T1447" vs "GB/T 1447").
function contains(haystack: string, needle: string): boolean {
  return (
    norm(haystack).includes(norm(needle)) ||
    normTight(haystack).includes(normTight(needle))
  );
}

interface ScoreResult {
  pass: boolean;
  missingInclude: string[];
  hitForbidden: string[];
}
function score(answer: string, c: GoldenCase): ScoreResult {
  const mustInclude = c.expected.must_include ?? [];
  const mustNot = c.expected.must_not_claim ?? [];
  const missingInclude = mustInclude.filter((n) => !contains(answer, n));
  const hitForbidden = mustNot.filter((n) => contains(answer, n));
  return {
    pass: missingInclude.length === 0 && hitForbidden.length === 0,
    missingInclude,
    hitForbidden,
  };
}

// ── side resolution ──────────────────────────────────────────────────────────
function casesForSide(c: GoldenCase, side: Side): boolean {
  const cs = c.side ?? "both";
  if (side === "both") return true;
  return cs === side || cs === "both";
}

function hostForSide(side: "domestic" | "overseas"): string {
  return side === "domestic" ? DOMESTIC_HOST : OVERSEAS_HOST;
}

// Which concrete sides do we actually run? `--side` narrows it; otherwise we run
// every side whose provider chain has at least one configured provider.
function configuredSides(
  forced?: Side,
): { side: "domestic" | "overseas"; chain: ChatModelInChain[] }[] {
  const sides: ("domestic" | "overseas")[] =
    forced === "domestic"
      ? ["domestic"]
      : forced === "overseas"
        ? ["overseas"]
        : ["domestic", "overseas"];
  const out: { side: "domestic" | "overseas"; chain: ChatModelInChain[] }[] = [];
  for (const side of sides) {
    const host = hostForSide(side);
    // chatProviderChain only lists CONFIGURED providers after the primary; the
    // primary itself may be unconfigured (build-time key check). We test the
    // primary's key explicitly so an unconfigured side is skipped, not failed.
    const providerIds = chatProviderChain(host);
    const anyConfigured = providerIds.some((p) => providerKeyPresent(p));
    if (!anyConfigured) continue;
    out.push({ side, chain: getChatModelChain(host) });
  }
  return out;
}

function providerKeyPresent(p: ProviderId): boolean {
  const map: Record<ProviderId, string | undefined> = {
    zhipu: process.env.ZHIPU_API_KEY,
    qwen: process.env.DASHSCOPE_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };
  return Boolean(map[p]);
}

// Is the overseas (Google/Gemini) side actually REACHABLE from where we run?
// On the user's Mac mini in China, Google's API is GFW-blocked unless a gateway
// URL is configured. We do NOT try to actually probe the network here (that
// would be slow/flaky); we treat "Google reachable" as: a gateway URL is set,
// OR the deployment is not the in-China profile. If unreachable we skip the
// overseas side with a clear note instead of failing the harness.
function overseasReachable(): { ok: boolean; reason: string } {
  if (process.env.GOOGLE_AI_GATEWAY_URL) {
    return { ok: true, reason: "GOOGLE_AI_GATEWAY_URL set (proxied past GFW)" };
  }
  if (process.env.EVAL_FORCE_OVERSEAS === "1") {
    return { ok: true, reason: "EVAL_FORCE_OVERSEAS=1 (assume reachable)" };
  }
  // AI_PROFILE=domestic explicitly marks the in-China ECS/local box.
  if (process.env.AI_PROFILE === "domestic") {
    return {
      ok: false,
      reason:
        "AI_PROFILE=domestic and no GOOGLE_AI_GATEWAY_URL — Google/Gemini is GFW-blocked here",
    };
  }
  // Default local dev (no gateway): assume in-China per the project's stated
  // environment reality. Overseas eval must run on Vercel/CI or with a gateway.
  return {
    ok: false,
    reason:
      "No GOOGLE_AI_GATEWAY_URL — overseas eval requires running on Vercel/CI or a Google AI gateway (assumed GFW-blocked locally). Set EVAL_FORCE_OVERSEAS=1 to override.",
  };
}

// ── reporting ────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, "reports");

function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

interface CaseOutcome {
  id: string;
  category: string;
  source: SourceKind;
  needsReview: boolean;
  provider: string;
  pass: boolean;
  missingInclude: string[];
  hitForbidden: string[];
  error?: string;
  answerExcerpt: string;
}

interface SideReport {
  side: "domestic" | "overseas";
  primaryProvider: string;
  outcomes: CaseOutcome[];
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function printSideTable(rep: SideReport) {
  console.log(
    `\n══ side: ${rep.side}  (provider chain primary: ${rep.primaryProvider}) ══`,
  );
  console.log(
    pad("RESULT", 8) +
      pad("CASE", 36) +
      pad("PROVIDER", 12) +
      "DETAIL",
  );
  for (const o of rep.outcomes) {
    let result: string;
    let detail = "";
    if (o.error) {
      result = "ERROR";
      detail = o.error.slice(0, 80);
    } else if (o.pass) {
      result = "PASS";
    } else {
      result = "FAIL";
      const bits: string[] = [];
      if (o.hitForbidden.length)
        bits.push(`fabricated/forbidden: ${o.hitForbidden.join(", ")}`);
      if (o.missingInclude.length)
        bits.push(`missing: ${o.missingInclude.join(", ")}`);
      detail = bits.join(" | ");
    }
    console.log(
      pad(result, 8) + pad(o.id, 36) + pad(o.provider, 12) + detail,
    );
  }
  const passed = rep.outcomes.filter((o) => o.pass).length;
  const errored = rep.outcomes.filter((o) => o.error).length;
  console.log(
    `  → ${passed}/${rep.outcomes.length} passed` +
      (errored ? `, ${errored} errored` : ""),
  );
}

function writeReport(
  reports: SideReport[],
  skipped: { side: string; reason: string }[],
  golden: GoldenSet,
) {
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = ts();
  const jsonPath = resolve(REPORTS_DIR, `eval-${stamp}.json`);
  const mdPath = resolve(REPORTS_DIR, `eval-${stamp}.md`);

  writeFileSync(
    jsonPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), reports, skipped }, null, 2),
  );

  const srcCounts = countSources(golden);
  const lines: string[] = [];
  lines.push(`# f1frp Anti-Fabrication Eval Report`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`## Golden-set honesty audit`);
  lines.push(
    `- repo-derived: ${srcCounts.repo}  ·  universal-fact: ${srcCounts.universal}  ·  todo-verify: ${srcCounts["todo-verify"]}  ·  needs_review flagged: ${srcCounts.needsReview}  ·  total: ${golden.cases.length}`,
  );
  lines.push(``);
  for (const rep of reports) {
    const passed = rep.outcomes.filter((o) => o.pass).length;
    const errored = rep.outcomes.filter((o) => o.error).length;
    lines.push(`## Side: ${rep.side} (primary provider: ${rep.primaryProvider})`);
    lines.push(`- ${passed}/${rep.outcomes.length} passed${errored ? `, ${errored} errored` : ""}`);
    lines.push(``);
    lines.push(`| Result | Case | Provider | Detail |`);
    lines.push(`|---|---|---|---|`);
    for (const o of rep.outcomes) {
      const result = o.error ? "ERROR" : o.pass ? "PASS" : "FAIL";
      const detail = o.error
        ? o.error.slice(0, 120)
        : [
            o.hitForbidden.length ? `forbidden: ${o.hitForbidden.join(", ")}` : "",
            o.missingInclude.length ? `missing: ${o.missingInclude.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join(" / ");
      lines.push(`| ${result} | ${o.id} | ${o.provider} | ${detail.replace(/\|/g, "\\|")} |`);
    }
    lines.push(``);
  }
  if (skipped.length) {
    lines.push(`## Skipped sides`);
    for (const s of skipped) lines.push(`- **${s.side}** — ${s.reason}`);
    lines.push(``);
  }
  writeFileSync(mdPath, lines.join("\n"));
  console.log(`\nReports written:\n  ${jsonPath}\n  ${mdPath}`);
}

function countSources(golden: GoldenSet) {
  const c = { repo: 0, universal: 0, "todo-verify": 0, needsReview: 0 } as Record<
    string,
    number
  >;
  for (const g of golden.cases) {
    c[g.source] = (c[g.source] ?? 0) + 1;
    if (g.needs_review) c.needsReview++;
  }
  return c as { repo: number; universal: number; "todo-verify": number; needsReview: number };
}

// ── main ─────────────────────────────────────────────────────────────────────
function loadGolden(): GoldenSet {
  const p = resolve(__dirname, "golden-set.json");
  const raw = JSON.parse(readFileSync(p, "utf-8")) as GoldenSet & Record<string, unknown>;
  if (!Array.isArray(raw.cases)) throw new Error("golden-set.json: missing `cases` array");
  // structural validation
  const ids = new Set<string>();
  for (const c of raw.cases) {
    if (!c.id) throw new Error("golden-set: a case has no id");
    if (ids.has(c.id)) throw new Error(`golden-set: duplicate id ${c.id}`);
    ids.add(c.id);
    if (!c.question) throw new Error(`golden-set: ${c.id} has no question`);
    if (!c.source) throw new Error(`golden-set: ${c.id} has no source`);
    if (!["repo", "universal", "todo-verify"].includes(c.source))
      throw new Error(`golden-set: ${c.id} invalid source ${c.source}`);
    if (!c.expected) throw new Error(`golden-set: ${c.id} has no expected`);
  }
  return { cases: raw.cases };
}

function systemFor(side: "domestic" | "overseas"): string {
  return side === "overseas" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT;
}

async function askOne(
  chain: ChatModelInChain[],
  question: string,
  system: string,
  maxTokens: number,
): Promise<{ answer: string; provider: string }> {
  // Walk the within-side chain ourselves so we can report WHICH provider
  // answered and surface the last error if every same-side provider fails.
  // (Same spirit as withChatFallback, but we want the provider id back.)
  let lastErr: unknown;
  for (const { provider, model } of chain) {
    try {
      const { text } = await generateText({
        model: model as LanguageModel,
        system,
        prompt: question,
        maxOutputTokens: maxTokens,
      });
      return { answer: text, provider };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("empty provider chain");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const golden = loadGolden();
  const srcCounts = countSources(golden);

  console.log("f1frp anti-fabrication eval harness");
  console.log(
    `golden-set: ${golden.cases.length} cases  (repo=${srcCounts.repo}, universal=${srcCounts.universal}, todo-verify=${srcCounts["todo-verify"]}, needs_review=${srcCounts.needsReview})`,
  );

  // Resolve which sides to run + their provider chains.
  let sides = configuredSides(args.side);

  // Overseas reachability gate (GFW). If a Google/OpenRouter chain is the only
  // thing on the overseas side and Google isn't reachable, skip it with a note.
  const skipped: { side: string; reason: string }[] = [];
  const reach = overseasReachable();
  if (!reach.ok) {
    const before = sides.length;
    sides = sides.filter((s) => {
      if (s.side === "overseas") {
        skipped.push({ side: "overseas", reason: reach.reason });
        return false;
      }
      return true;
    });
    if (before !== sides.length) {
      console.log(`\n[skip] overseas side: ${reach.reason}`);
    }
  }

  // If a specific provider override was requested, narrow each side's chain to
  // it (only if that provider is part of the side's within-side pool, to keep
  // the GFW/brand invariant). This never crosses sides.
  if (args.provider) {
    sides = sides.map((s) => ({
      ...s,
      chain: s.chain.filter((c) => c.provider === args.provider),
    }));
    sides = sides.filter((s) => {
      if (s.chain.length === 0) {
        skipped.push({
          side: s.side,
          reason: `--provider ${args.provider} not in this side's chain (invariant: cannot cross sides)`,
        });
        return false;
      }
      return true;
    });
  }

  // Plan print.
  console.log(`\nPlan:`);
  for (const s of sides) {
    const host = hostForSide(s.side);
    console.log(
      `  side=${s.side} host=${host} chain=[${chatProviderChain(host).join(" → ")}]  caseCount=${golden.cases.filter((c) => casesForSide(c, s.side)).length}`,
    );
  }
  for (const s of skipped) console.log(`  SKIP side=${s.side} — ${s.reason}`);

  if (args.dryRun) {
    console.log(
      `\n[dry-run] golden-set parsed OK, ${golden.cases.length} cases validated, provider chains built. No model calls made.`,
    );
    return;
  }

  if (sides.length === 0) {
    console.log(
      `\nNo runnable side (no configured+reachable provider). Run with a 国产 key in .env.local for the domestic side, or on Vercel/CI (or a Google gateway) for overseas. Use --dry-run to validate structure only.`,
    );
    return;
  }

  const reports: SideReport[] = [];
  for (const s of sides) {
    const system = systemFor(s.side);
    const primaryProvider = s.chain[0]?.provider ?? "(none)";
    const outcomes: CaseOutcome[] = [];
    const sideCases = golden.cases.filter((c) => casesForSide(c, s.side));
    console.log(
      `\nRunning ${sideCases.length} cases on side=${s.side} (primary=${primaryProvider})...`,
    );
    for (const c of sideCases) {
      process.stdout.write(`  · ${c.id} ... `);
      try {
        const { answer, provider } = await askOne(s.chain, c.question, system, args.maxTokens);
        const sc = score(answer, c);
        outcomes.push({
          id: c.id,
          category: c.category,
          source: c.source,
          needsReview: Boolean(c.needs_review),
          provider,
          pass: sc.pass,
          missingInclude: sc.missingInclude,
          hitForbidden: sc.hitForbidden,
          answerExcerpt: answer.slice(0, 400),
        });
        console.log(sc.pass ? "PASS" : "FAIL");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        outcomes.push({
          id: c.id,
          category: c.category,
          source: c.source,
          needsReview: Boolean(c.needs_review),
          provider: primaryProvider,
          pass: false,
          missingInclude: [],
          hitForbidden: [],
          error: msg,
          answerExcerpt: "",
        });
        console.log(`ERROR (${msg.slice(0, 60)})`);
      }
    }
    reports.push({ side: s.side, primaryProvider, outcomes });
  }

  for (const rep of reports) printSideTable(rep);
  writeReport(reports, skipped, golden);

  // Exit code: non-zero only if a real FABRICATION was caught (a must_not_claim
  // hit), so the harness is CI-usable as a fabrication gate. Missing-include
  // misses and provider errors are reported but do NOT hard-fail (a paraphrase
  // can legitimately miss a substring, and an unreachable provider must not
  // break the harness — that's the GFW reality).
  const fabricationCount = reports
    .flatMap((r) => r.outcomes)
    .filter((o) => !o.error && o.hitForbidden.length > 0).length;
  console.log(
    `\n${fabricationCount === 0 ? "✓ no fabrication caught" : `✗ ${fabricationCount} fabrication signal(s) caught`} (must_not_claim hits across all sides)`,
  );
  process.exit(fabricationCount === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
