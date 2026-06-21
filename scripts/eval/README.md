# f1frp Anti-Fabrication Eval Harness

A golden-set of FRP questions with **known-correct answers**, asked to the real
f1frp chat AI through the same gateway the chat route uses (`src/lib/ai/provider.ts`),
then scored by a deterministic **rule-based** check that catches when the model
**fabricates numbers / standard codes / specs**.

This is the trust precondition for deepening AI in the business: before we lean
harder on the AI, we need a repeatable signal that it isn't inventing a
plausible-but-wrong ASTM number, duty rate, or material property.

It is **additive** to the existing deterministic unit gate
(`scripts/run-evals.ts` → `src/lib/ai/evals/*` — those are pure functions, no
LLM). This harness actually calls the model.

---

## ★ The honesty rule (the anti-fabrication tool must not itself fabricate)

Every `expected` value in `golden-set.json` MUST come from one of:

1. **`source: "repo"`** — the repo's own curated/authoritative data
   (`src/lib/data/standards.ts`, `materials.ts`, `china-standards-crosswalk.ts`,
   `trade-remedy.ts`, `jgt571.ts`, …). This is self-consistent: we test the AI
   against the platform's own curated truth. **Preferred source.**
2. **`source: "universal"`** — a universally-verifiable, high-confidence fact
   with no invented precision (e.g. "ASTM E84 measures surface burning
   characteristics"; "E-glass density is ~2.5–2.6 g/cm³"; "MEKP must never be
   pre-mixed directly with cobalt accelerator").
3. **`source: "todo-verify"`** + `needs_review: true` — uncertain; assert **no**
   value. `must_include` is left empty or non-asserting; only `must_not_claim`
   (anti-fabrication guardrails) may be used.

**Never invent a precise number / standard code and label it "correct."** If
unsure, mark `todo-verify` + `needs_review`.

The runner prints the count of `repo` / `universal` / `todo-verify` /
`needs_review` cases on every run, and writes it into the report — so the
honesty audit is always visible.

---

## How to run

```bash
# Domestic side (国产 providers — directly reachable in China). Picks up keys
# from .env.local automatically (or pass --env-file).
pnpm tsx --env-file=.env.local scripts/eval/run.ts

# Narrow to one side or one provider (stays within the GFW/brand invariant):
pnpm tsx --env-file=.env.local scripts/eval/run.ts --side domestic
pnpm tsx --env-file=.env.local scripts/eval/run.ts --provider deepseek

# Structure/dry-run validation only — parses golden-set, builds provider
# chains, prints the plan. No model calls, no keys needed.
pnpm tsx scripts/eval/run.ts --dry-run
```

Flags:
- `--side domestic|overseas|both` — which deployment side(s) to run. Default:
  every configured + reachable side.
- `--provider zhipu|qwen|deepseek|google|openrouter` — pin one provider (must be
  in that side's pool; never crosses sides).
- `--max-tokens N` — output cap per answer (default 700).
- `--dry-run` — validate + plan, no calls.

Reports are written timestamped to `scripts/eval/reports/eval-<ts>.{json,md}`.

### Environment reality (China / GFW)

- **Domestic side** (`f1frp.com`) → 国产 providers (智谱 GLM / 通义 Qwen /
  DeepSeek). Directly reachable on the user's Mac mini in China. Runs whenever a
  国产 key is present in `.env.local`.
- **Overseas side** (`getfrp.com`) → Google Gemini (+ OpenRouter→Gemini). **GFW-
  blocked locally** unless `GOOGLE_AI_GATEWAY_URL` is set. The harness **skips**
  the overseas side with a clear note ("overseas eval requires running on
  Vercel/CI or a Google gateway") rather than failing — set
  `EVAL_FORCE_OVERSEAS=1` to force an attempt anyway.
- The harness only ever builds models via `getChatModelChain(host)`, so the
  host invariant in `provider.ts` guarantees a domestic case is **never** routed
  to Google and an overseas case **never** to a 国产 provider. We never break the
  GFW/brand boundary.

---

## How scoring works (rule-based, anti-fabrication focus)

For each case:
- **PASS** = every `must_include` substring present **AND** no `must_not_claim`
  substring present.
- **FAIL** = a `must_not_claim` appears (a fabrication / dangerous-claim signal)
  **OR** a required `must_include` is missing.
- Matching is case-insensitive and whitespace-insensitive for standard codes
  (so `GB/T 1447` matches `GB/T1447`).

The **LLM-judge is intentionally OFF**. A judge model can hallucinate too;
deterministic exact-match on standard codes / numbers is the reliable
anti-fabrication signal.

**Exit code**: non-zero only when a real fabrication is caught (a
`must_not_claim` hit), so the harness is usable as a CI fabrication gate.
Missing-`must_include` misses and unreachable-provider errors are reported but
do **not** hard-fail (a valid paraphrase can miss a substring; an unreachable
provider is the GFW reality, not a model failure).

---

## How to add a case

Append to `golden-set.json` → `cases[]`:

```jsonc
{
  "id": "unique-kebab-id",
  "question": "the question to ask the AI (zh for domestic, en for overseas)",
  "category": "standards|materials|trade-compliance|safety|scope-discipline|...",
  "side": "domestic" | "overseas" | "both",   // optional; default both
  "expected": {
    "must_include": ["GB/T 1447", "ASTM D3039"],   // codes/values that MUST appear
    "must_not_claim": ["ASTM D638"],               // known-WRONG specifics = fabrication
    "notes": "WHERE the truth comes from — cite the repo file/row or the universal fact"
  },
  "source": "repo" | "universal" | "todo-verify",
  "needs_review": true   // required when source is todo-verify or the check is heuristic
}
```

Before you commit a new `repo`/`universal` case, **open the cited source file**
and confirm the value. If you can't confirm it, mark it `todo-verify` +
`needs_review` and leave `must_include` non-asserting. The `notes` field is the
provenance trail — keep it honest.
