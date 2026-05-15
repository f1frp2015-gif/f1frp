// Translates all Chinese content surfaced on getfrp.com (English overseas site)
// to English and writes into *_en columns. Idempotent: rows with the primary
// _en field already populated are skipped.
//
// Tables: materials, papers, patents, standards, standard_sections,
//         processes, formulas, articles, cases, downloads.
// suppliers already covered by backfill-supplier-translations.ts.
// reports is zh-only (notFound on en) — skipped.
//
// Run:
//   pnpm tsx --env-file=.env.local scripts/translate-all-zh.ts
//   pnpm tsx --env-file=.env.local scripts/translate-all-zh.ts --table=materials
//   pnpm tsx --env-file=.env.local scripts/translate-all-zh.ts --dry-run
//   pnpm tsx --env-file=.env.local scripts/translate-all-zh.ts --limit=10
//   pnpm tsx --env-file=.env.local scripts/translate-all-zh.ts --concurrency=4

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(DATABASE_URL);

const provider = (() => {
  const a = process.argv.find((x) => x.startsWith("--provider="));
  return (a ? a.split("=")[1] : "gemini") as "openrouter" | "gemini";
})();

const OR_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (provider === "openrouter" && !OR_KEY) throw new Error("OPENROUTER_API_KEY not set");
if (provider === "gemini" && !GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

const OR_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4.5";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const MODEL = provider === "openrouter" ? OR_MODEL : GEMINI_MODEL;
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const dryRun = process.argv.includes("--dry-run");
const limit = (() => {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  return a ? Number(a.split("=")[1]) : Infinity;
})();
const concurrency = (() => {
  const a = process.argv.find((x) => x.startsWith("--concurrency="));
  return a ? Number(a.split("=")[1]) : 4;
})();
const onlyTable = (() => {
  const a = process.argv.find((x) => x.startsWith("--table="));
  return a ? a.split("=")[1] : null;
})();

const SYSTEM = `You translate Chinese composite-materials industry content into professional English for overseas B2B engineering buyers.

Rules:
- Be faithful — do not add, omit, or embellish.
- Preserve numeric specifications, units, and standard codes (ASTM/ISO/EN/GB/JIS) verbatim.
- Use industry-standard English: 拉挤=Pultrusion, 缠绕=Filament winding, 真空导入=Vacuum infusion, 手糊=Hand layup, 模压=Compression molding, RTM=RTM, 玻璃钢/玻纤=FRP/glass fiber, 碳纤维=Carbon fiber, 芳纶=Aramid, 树脂=Resin, 不饱和聚酯=Unsaturated polyester, 环氧=Epoxy, 乙烯基酯=Vinyl ester.
- Transliterate Chinese place / company / brand names (南通=Nantong, 苏州=Suzhou, 浙江=Zhejiang); transliterate person names as pinyin without tones; translate descriptive parts of company names.
- For status enums: 现行=Active, 废止=Withdrawn, 即将实施=Upcoming.
- For category labels: keep concise English nouns, e.g. 行业研究=Industry research, 技术=Technology, 政策=Policy, 公司=Company, 展会=Expo.
- For body fields longer than 100 chars: produce natural English prose; do NOT add headings or markdown not present in the source.
- For arrays / objects: maintain identical length and key structure.
- Return JSON ONLY, no markdown fence, no commentary.`;

interface Job<T> {
  table: string;
  primaryEnField: string; // skip row if this column already populated
  buildInput: (row: T) => Record<string, unknown> | null;
  // After receiving translated JSON, return columns to update
  buildUpdate: (translated: Record<string, unknown>, row: T) => Record<string, unknown>;
  schemaHint: string;
}

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OR_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://getfrp.com",
      "X-Title": "f1frp full zh-en backfill",
    },
    body: JSON.stringify({
      model: OR_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`openrouter ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  });

  // Retry on 429/503/500 with exponential backoff.
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      }
      const status = res.status;
      const errBody = await res.text().catch(() => "");
      if (status === 429 || status === 500 || status === 503) {
        const delay = Math.min(30000, 1000 * 2 ** attempt + Math.random() * 500);
        await new Promise((r) => setTimeout(r, delay));
        lastErr = new Error(`gemini ${status}: ${errBody.slice(0, 200)}`);
        continue;
      }
      throw new Error(`gemini ${status}: ${errBody.slice(0, 300)}`);
    } catch (e) {
      lastErr = e as Error;
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("gemini retry exhausted");
}

// Generic LLM call returning parsed JSON.
async function callLLM(systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
  const raw =
    provider === "openrouter"
      ? await callOpenRouter(systemPrompt, userPrompt)
      : await callGemini(systemPrompt, userPrompt);
  if (!raw) throw new Error("empty content");
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`json parse: ${(e as Error).message}; raw: ${raw.slice(0, 200)}`);
  }
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}
function asArray(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null;
}

function hasChinese(s: unknown): boolean {
  if (typeof s !== "string") return false;
  return /[㐀-鿿]/.test(s);
}

// ── Table-specific jobs ─────────────────────────────────────────────

type Row = Record<string, unknown>;

const STATUS_MAP: Record<string, string> = {
  现行: "Active",
  废止: "Withdrawn",
  即将实施: "Upcoming",
  作废: "Withdrawn",
  待实施: "Upcoming",
};

const jobs: Job<Row>[] = [
  // ── materials ────────────────────────────────────
  {
    table: "materials",
    primaryEnField: "description_en",
    schemaHint: `{"sub_category_en":string|null,"brand_en":string|null,"model_en":string|null,"properties_en":object|null,"applications_en":string[]|null,"description_en":string|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.sub_category)) payload.sub_category = r.sub_category;
      if (hasChinese(r.brand)) payload.brand = r.brand;
      if (hasChinese(r.model)) payload.model = r.model;
      if (r.properties && typeof r.properties === "object") payload.properties = r.properties;
      if (Array.isArray(r.applications) && r.applications.length) payload.applications = r.applications;
      if (hasChinese(r.description)) payload.description = r.description;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      sub_category_en: t.sub_category_en ?? (hasChinese(r.sub_category) ? null : r.sub_category) ?? null,
      brand_en: t.brand_en ?? (hasChinese(r.brand) ? null : r.brand) ?? null,
      model_en: t.model_en ?? (hasChinese(r.model) ? null : r.model) ?? null,
      properties_en: t.properties_en ?? null,
      applications_en: t.applications_en ?? null,
      description_en: t.description_en ?? null,
    }),
  },
  // ── papers ────────────────────────────────────
  {
    table: "papers",
    primaryEnField: "abstract_en",
    schemaHint: `{"affiliation_en":string|null,"journal_en":string|null,"abstract_en":string|null,"commentary_en":string|null,"keywords_en":string[]|null,"category_en":string|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.affiliation)) payload.affiliation = r.affiliation;
      if (hasChinese(r.journal)) payload.journal = r.journal;
      if (hasChinese(r.abstract)) payload.abstract = r.abstract;
      if (hasChinese(r.commentary)) payload.commentary = r.commentary;
      if (Array.isArray(r.keywords) && r.keywords.some(hasChinese)) payload.keywords = r.keywords;
      if (hasChinese(r.category)) payload.category = r.category;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      affiliation_en: t.affiliation_en ?? (hasChinese(r.affiliation) ? null : r.affiliation) ?? null,
      journal_en: t.journal_en ?? (hasChinese(r.journal) ? null : r.journal) ?? null,
      abstract_en: t.abstract_en ?? (hasChinese(r.abstract) ? null : r.abstract) ?? null,
      commentary_en: t.commentary_en ?? null,
      keywords_en: t.keywords_en ?? (Array.isArray(r.keywords) ? r.keywords : null),
      category_en: t.category_en ?? (hasChinese(r.category) ? null : r.category) ?? null,
    }),
  },
  // ── patents ────────────────────────────────────
  {
    table: "patents",
    primaryEnField: "abstract_en",
    schemaHint: `{"applicant_en":string|null,"inventors_en":string[]|null,"commentary_en":string|null,"country_en":string|null,"abstract_en":string|null,"claims_en":string|null,"category_en":string|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.applicant)) payload.applicant = r.applicant;
      if (Array.isArray(r.inventors) && r.inventors.some(hasChinese)) payload.inventors = r.inventors;
      if (hasChinese(r.commentary)) payload.commentary = r.commentary;
      if (hasChinese(r.country)) payload.country = r.country;
      if (hasChinese(r.abstract)) payload.abstract = r.abstract;
      if (hasChinese(r.claims)) payload.claims = r.claims;
      if (hasChinese(r.category)) payload.category = r.category;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      applicant_en: t.applicant_en ?? (hasChinese(r.applicant) ? null : r.applicant) ?? null,
      inventors_en: t.inventors_en ?? (Array.isArray(r.inventors) ? r.inventors : null),
      commentary_en: t.commentary_en ?? null,
      country_en: t.country_en ?? (hasChinese(r.country) ? null : r.country) ?? null,
      abstract_en: t.abstract_en ?? (hasChinese(r.abstract) ? null : r.abstract) ?? null,
      claims_en: t.claims_en ?? (hasChinese(r.claims) ? null : r.claims) ?? null,
      category_en: t.category_en ?? (hasChinese(r.category) ? null : r.category) ?? null,
    }),
  },
  // ── standards ────────────────────────────────────
  {
    table: "standards",
    primaryEnField: "description_en",
    schemaHint: `{"country_en":string|null,"category_en":string|null,"process_en":string[]|null,"status_en":string|null,"description_en":string|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.country)) payload.country = r.country;
      if (hasChinese(r.category)) payload.category = r.category;
      if (Array.isArray(r.process) && r.process.some(hasChinese)) payload.process = r.process;
      if (hasChinese(r.status)) payload.status = r.status;
      if (hasChinese(r.description)) payload.description = r.description;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      country_en: t.country_en ?? (hasChinese(r.country) ? null : r.country) ?? null,
      category_en: t.category_en ?? (hasChinese(r.category) ? null : r.category) ?? null,
      process_en: t.process_en ?? (Array.isArray(r.process) ? r.process : null),
      status_en:
        t.status_en ??
        (typeof r.status === "string" ? STATUS_MAP[r.status] ?? r.status : null),
      description_en: t.description_en ?? null,
    }),
  },
  // ── standard_sections ────────────────────────────────────
  {
    table: "standard_sections",
    primaryEnField: "body_en",
    schemaHint: `{"title_en":string|null,"body_en":string|null,"key_points_en":string[]|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.title)) payload.title = r.title;
      if (hasChinese(r.body)) payload.body = r.body;
      if (Array.isArray(r.key_points) && r.key_points.some(hasChinese)) payload.key_points = r.key_points;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      title_en: t.title_en ?? (hasChinese(r.title) ? null : r.title) ?? null,
      body_en: t.body_en ?? null,
      key_points_en: t.key_points_en ?? null,
    }),
  },
  // ── processes ────────────────────────────────────
  {
    table: "processes",
    primaryEnField: "description_en",
    schemaHint: `{"description_en":string|null,"advantages_en":string[]|null,"disadvantages_en":string[]|null,"applications_en":string[]|null,"key_parameters_en":string[]|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.description)) payload.description = r.description;
      if (Array.isArray(r.advantages) && r.advantages.some(hasChinese)) payload.advantages = r.advantages;
      if (Array.isArray(r.disadvantages) && r.disadvantages.some(hasChinese)) payload.disadvantages = r.disadvantages;
      if (Array.isArray(r.applications) && r.applications.some(hasChinese)) payload.applications = r.applications;
      if (Array.isArray(r.key_parameters) && r.key_parameters.some(hasChinese)) payload.key_parameters = r.key_parameters;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t) => ({
      description_en: t.description_en ?? null,
      advantages_en: t.advantages_en ?? null,
      disadvantages_en: t.disadvantages_en ?? null,
      applications_en: t.applications_en ?? null,
      key_parameters_en: t.key_parameters_en ?? null,
    }),
  },
  // ── formulas ────────────────────────────────────
  {
    table: "formulas",
    primaryEnField: "name_en",
    schemaHint: `{"name_en":string|null,"process_en":string|null,"application_en":string|null,"description_en":string|null,"resin_system_en":array|null,"reinforcement_en":array|null,"auxiliaries_en":array|null,"processing_en":array|null,"properties_en":array|null,"tips_en":string[]|null,"safety_notes_en":string[]|null}
For nested arrays (resin_system, reinforcement, auxiliaries), preserve each object's keys (name, role, amount, note) and translate values where Chinese.
For processing/properties arrays: each item has {name, value, ...}; translate string values, keep numeric ones.`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.name)) payload.name = r.name;
      if (hasChinese(r.process)) payload.process = r.process;
      if (hasChinese(r.application)) payload.application = r.application;
      if (hasChinese(r.description)) payload.description = r.description;
      if (Array.isArray(r.resin_system)) payload.resin_system = r.resin_system;
      if (Array.isArray(r.reinforcement)) payload.reinforcement = r.reinforcement;
      if (Array.isArray(r.auxiliaries)) payload.auxiliaries = r.auxiliaries;
      if (Array.isArray(r.processing)) payload.processing = r.processing;
      if (Array.isArray(r.properties)) payload.properties = r.properties;
      if (Array.isArray(r.tips) && r.tips.some(hasChinese)) payload.tips = r.tips;
      if (Array.isArray(r.safety_notes) && r.safety_notes.some(hasChinese)) payload.safety_notes = r.safety_notes;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t) => ({
      name_en: t.name_en ?? null,
      process_en: t.process_en ?? null,
      application_en: t.application_en ?? null,
      description_en: t.description_en ?? null,
      resin_system_en: t.resin_system_en ?? null,
      reinforcement_en: t.reinforcement_en ?? null,
      auxiliaries_en: t.auxiliaries_en ?? null,
      processing_en: t.processing_en ?? null,
      properties_en: t.properties_en ?? null,
      tips_en: t.tips_en ?? null,
      safety_notes_en: t.safety_notes_en ?? null,
    }),
  },
  // ── articles ────────────────────────────────────
  {
    table: "articles",
    primaryEnField: "body_en",
    schemaHint: `{"title_en":string|null,"excerpt_en":string|null,"body_en":string|null}
Body may be Markdown — preserve the markdown structure (headings, lists, links) faithfully in English.`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.title)) payload.title = r.title;
      if (hasChinese(r.excerpt)) payload.excerpt = r.excerpt;
      if (hasChinese(r.body)) payload.body = r.body;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      title_en: t.title_en ?? (hasChinese(r.title) ? null : r.title) ?? null,
      excerpt_en: t.excerpt_en ?? (hasChinese(r.excerpt) ? null : r.excerpt) ?? null,
      body_en: t.body_en ?? null,
    }),
  },
  // ── cases ────────────────────────────────────
  {
    table: "cases",
    primaryEnField: "description_en",
    schemaHint: `{"title_en":string|null,"description_en":string|null,"location_en":string|null,"industry_en":string|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.title)) payload.title = r.title;
      if (hasChinese(r.description)) payload.description = r.description;
      if (hasChinese(r.location)) payload.location = r.location;
      if (hasChinese(r.industry)) payload.industry = r.industry;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      title_en: t.title_en ?? (hasChinese(r.title) ? null : r.title) ?? null,
      description_en: t.description_en ?? null,
      location_en: t.location_en ?? (hasChinese(r.location) ? null : r.location) ?? null,
      industry_en: t.industry_en ?? (hasChinese(r.industry) ? null : r.industry) ?? null,
    }),
  },
  // ── downloads ────────────────────────────────────
  {
    table: "downloads",
    primaryEnField: "title_en",
    schemaHint: `{"title_en":string|null,"description_en":string|null}`,
    buildInput: (r) => {
      const payload: Record<string, unknown> = {};
      if (hasChinese(r.title)) payload.title = r.title;
      if (hasChinese(r.description)) payload.description = r.description;
      return Object.keys(payload).length ? payload : null;
    },
    buildUpdate: (t, r) => ({
      title_en: t.title_en ?? (hasChinese(r.title) ? null : r.title) ?? null,
      description_en: t.description_en ?? null,
    }),
  },
];

async function processJob(job: Job<Row>): Promise<{ ok: number; skip: number; fail: number }> {
  // Select rows where primary en field is null AND there is at least some Chinese in any source field.
  const rows = (await sql.query(
    `SELECT * FROM ${job.table} WHERE ${job.primaryEnField} IS NULL`
  )) as Row[];

  console.log(`\n[${job.table}] ${rows.length} rows missing ${job.primaryEnField}; concurrency=${concurrency}`);

  let processed = 0;
  let ok = 0;
  let skip = 0;
  let fail = 0;
  const todo = rows.slice(0, Math.min(rows.length, limit));

  // Worker pool
  let cursor = 0;
  async function worker(workerId: number) {
    while (cursor < todo.length) {
      const i = cursor++;
      const row = todo[i];
      const id = row.id as string;
      try {
        const input = job.buildInput(row);
        if (!input) {
          // Nothing Chinese to translate — copy zh fields straight to _en where applicable.
          const update = job.buildUpdate({}, row);
          if (!dryRun) await applyUpdate(job.table, id, update);
          skip++;
        } else {
          const userPrompt = `Translate the following ${job.table} fields to English. Schema:\n${job.schemaHint}\n\nInput:\n${JSON.stringify(input, null, 2)}\n\nReturn JSON only.`;
          const translated = await callLLM(SYSTEM, userPrompt);
          const update = job.buildUpdate(translated, row);
          if (!dryRun) await applyUpdate(job.table, id, update);
          ok++;
        }
      } catch (e) {
        fail++;
        console.error(`  [${job.table}:${id}] FAIL:`, (e as Error).message);
      }
      processed++;
      if (processed % 25 === 0 || processed === todo.length) {
        console.log(
          `  [${job.table}] ${processed}/${todo.length}  ok=${ok} skip=${skip} fail=${fail}`
        );
      }
      // Tiny per-worker delay to spread requests
      await new Promise((r) => setTimeout(r, 50 + workerId * 30));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));
  console.log(`[${job.table}] DONE  ok=${ok} skip=${skip} fail=${fail}`);
  return { ok, skip, fail };
}

async function applyUpdate(table: string, id: string, update: Record<string, unknown>) {
  const keys = Object.keys(update);
  if (keys.length === 0) return;
  const setParts: string[] = [];
  const values: unknown[] = [];
  let p = 1;
  for (const k of keys) {
    const v = update[k];
    if (v === undefined) continue;
    setParts.push(`${k} = $${p}`);
    // jsonb columns need stringified JSON
    if (Array.isArray(v) || (v !== null && typeof v === "object")) {
      values.push(JSON.stringify(v));
    } else {
      values.push(v);
    }
    p++;
  }
  if (!setParts.length) return;
  const setClause = setParts.join(", ");
  // updated_at maintained where present; ignored in tables without it (cases, downloads).
  const hasUpdatedAt = !["cases", "download_logs"].includes(table);
  const finalSet = hasUpdatedAt ? `${setClause}, updated_at = NOW()` : setClause;
  values.push(id);
  await sql.query(`UPDATE ${table} SET ${finalSet} WHERE id = $${p}`, values);
}

async function main() {
  console.log(`Translator — model=${MODEL}, dryRun=${dryRun}, limit=${limit}, concurrency=${concurrency}, table=${onlyTable ?? "ALL"}`);
  const targets = onlyTable ? jobs.filter((j) => j.table === onlyTable) : jobs;
  if (!targets.length) throw new Error(`Unknown table: ${onlyTable}`);

  const totals = { ok: 0, skip: 0, fail: 0 };
  for (const job of targets) {
    const r = await processJob(job);
    totals.ok += r.ok;
    totals.skip += r.skip;
    totals.fail += r.fail;
  }
  console.log(`\n==== TOTAL  ok=${totals.ok}  skip=${totals.skip}  fail=${totals.fail}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
