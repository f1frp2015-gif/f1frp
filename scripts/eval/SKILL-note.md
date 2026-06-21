# SKILL-style note — anti-fabrication eval (for an AI/agent maintaining this)

When asked to "run the AI eval", "check the chat AI for fabrication", "add a
golden case", or "is the AI inventing standard numbers/specs" → use this harness.

## Run
- `pnpm tsx --env-file=.env.local scripts/eval/run.ts` — runs every configured +
  reachable side. In China only the **domestic** (国产) side runs; **overseas**
  (Gemini) is skipped with a note unless `GOOGLE_AI_GATEWAY_URL` (or
  `EVAL_FORCE_OVERSEAS=1`) is set, or you run it on Vercel/CI.
- `pnpm tsx scripts/eval/run.ts --dry-run` — no keys, no calls: validate the
  golden-set + print the plan.
- Reports land in `scripts/eval/reports/eval-<ts>.{json,md}`.

## The one rule you must not break
The golden-set is an anti-fabrication tool, so it **must not itself fabricate**.
Every `expected` value is sourced:
- `repo` — from `src/lib/data/*` (standards/materials/crosswalk/trade-remedy/jgt571).
  Preferred. Self-consistent: test the AI against the platform's own curated truth.
- `universal` — a high-confidence, no-invented-precision fact.
- `todo-verify` (+ `needs_review`) — uncertain → assert NOTHING; `must_include`
  stays empty/non-asserting, only `must_not_claim` guards apply.

Never write a precise number / standard code into `must_include` unless you
opened the cited repo file or it's a universal fact. If unsure → `todo-verify`.
The `notes` field is the provenance trail; keep it truthful.

## How it scores
Deterministic rule-based (no LLM judge — a judge can hallucinate too):
PASS = all `must_include` present AND no `must_not_claim` present. Standard-code
matching is whitespace/case-insensitive. Exit code is non-zero only on a real
fabrication (`must_not_claim` hit) so it can gate CI; missing-include and
unreachable-provider are reported, not hard failures.

## Invariant you must respect
Models are only ever built via `getChatModelChain(host)` from
`src/lib/ai/provider.ts`. Never hand a domestic question to Google or an
overseas question to a 国产 provider — the host split enforces this; don't
bypass it.
