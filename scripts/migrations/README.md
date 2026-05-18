# Migrations (reference SQL)

The repo's drizzle/ folder is gitignored — the project uses `pnpm db:push`
to sync schema directly. This folder keeps hand-written SQL versions of
non-trivial schema additions as a reviewable record + a fallback for any
environment where db:push is unavailable.

## How to apply

Option 1 (recommended) — schema-driven via Drizzle Kit:

```bash
pnpm db:push
```

This compares `src/lib/db/schema.ts` against the live DB and emits the
diff. Safe on Neon under live traffic for additive changes (new tables /
columns / indexes). Destructive changes prompt confirmation.

Option 2 — apply SQL directly (use only if `db:push` is unavailable):

```bash
psql "$DATABASE_URL" -f scripts/migrations/0001_factory_product.sql
```

## Files

| File | Adds | Notes |
|---|---|---|
| `0001_factory_product.sql` | `factory_waitlist` + `factory_inquiries` + `factory_inquiry_drafts` tables, plus 4 enums | S2 AI 询盘助手 product MVP. Additive only — safe to apply on live DB. |
