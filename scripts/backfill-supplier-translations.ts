// Translates supplier_listings rows where name_en IS NULL using Claude Haiku
// via OpenRouter. Idempotent — re-running only re-translates rows still
// missing name_en. Cost: ~$0.05 total for ~70 rows.
//
// Run: pnpm tsx --env-file=.env.local scripts/backfill-supplier-translations.ts
// Add --dry-run to preview translations without writing.
// Add --limit=N to translate only the first N rows.

import { isNull, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";

const dryRun = process.argv.includes("--dry-run");
const limit = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : Infinity;
})();

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4.5";

const TranslationSchema = z.object({
  nameEn: z.string(),
  locationEn: z.string(),
  descriptionEn: z.string(),
  productsEn: z.array(z.string()),
  processListEn: z.array(z.string()),
  certificationsEn: z.array(z.string()),
});
type Translation = z.infer<typeof TranslationSchema>;

const SYSTEM_PROMPT = `You translate Chinese composite-materials supplier records into professional English for foreign B2B buyers.

Rules:
- Be faithful — do not add or omit information.
- Preserve numeric specifications and standards verbatim.
- For nameEn: transliterate Chinese place names (南通 → Nantong, 苏州 → Suzhou, 浙江 → Zhejiang) and translate the descriptive part (复合材料有限公司 → Composite Materials Co., Ltd., 玻璃钢 → FRP, 拉挤型材厂 → Pultrusion Co., Ltd.). Keep brand/family names as pinyin without tones (恒新 → Hengxin, 长信 → Changxin).
- For locationEn: format as "City, Province, China" (e.g. "Nantong, Jiangsu, China"). Use standard English province spellings.
- For descriptionEn: faithful English translation, no embellishment, no facts not in the source.
- For productsEn / processListEn: one-to-one mapping with the input arrays. Use industry-standard English names (拉挤成型 → Pultrusion, 缠绕成型 → Filament winding, 真空导入 → Vacuum infusion, 手糊成型 → Hand layup, RTM → RTM, 模压成型 → Compression molding, 玻璃钢格栅 → FRP grating, 玻璃钢储罐 → FRP tank, 玻璃钢管道 → FRP pipe).
- For certificationsEn: keep ISO/ASTM/CE/API/ASME codes verbatim. Translate Chinese-specific certifications (中国国家强制认证 → CCC certification).

Return JSON ONLY — no commentary, no markdown fence. Output schema:
{
  "nameEn": string,
  "locationEn": string,
  "descriptionEn": string,
  "productsEn": string[],
  "processListEn": string[],
  "certificationsEn": string[]
}`;

function buildUserPrompt(row: typeof supplierListings.$inferSelect): string {
  return [
    `Translate this record:`,
    ``,
    `name: ${row.name}`,
    `location: ${row.location ?? ""}`,
    `description: ${row.description ?? ""}`,
    `products: ${JSON.stringify(row.products ?? [])}`,
    `processList: ${JSON.stringify(row.processList ?? [])}`,
    `certifications: ${JSON.stringify(row.certifications ?? [])}`,
  ].join("\n");
}

async function translateOne(
  row: typeof supplierListings.$inferSelect,
): Promise<Translation> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://getfrp.com",
      "X-Title": "f1frp supplier translation backfill",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(row) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`openrouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("Empty content from OpenRouter");

  // Some models wrap JSON in fences despite response_format. Strip them.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `JSON parse failed: ${err instanceof Error ? err.message : err}\nRaw: ${raw.slice(0, 200)}`,
    );
  }
  return TranslationSchema.parse(parsed);
}

async function main() {
  const pending = await db
    .select()
    .from(supplierListings)
    .where(isNull(supplierListings.nameEn));

  const todo = pending.slice(0, Math.min(pending.length, limit));
  console.log(
    `Found ${pending.length} rows missing nameEn; translating ${todo.length} via ${MODEL}…`,
  );
  if (dryRun) console.log("DRY RUN — no DB writes will happen.");

  let ok = 0;
  let fail = 0;
  for (const [i, row] of todo.entries()) {
    try {
      const t = await translateOne(row);
      console.log(
        `  [${i + 1}/${todo.length}] ${row.id}  ${row.name}  →  ${t.nameEn}`,
      );

      if (!dryRun) {
        await db
          .update(supplierListings)
          .set({
            nameEn: t.nameEn,
            locationEn: t.locationEn,
            descriptionEn: t.descriptionEn,
            productsEn: t.productsEn,
            processListEn: t.processListEn,
            certificationsEn: t.certificationsEn,
            updatedAt: new Date(),
          })
          .where(eq(supplierListings.id, row.id));
      }
      ok++;
    } catch (err) {
      console.error(
        `  [${i + 1}/${todo.length}] ${row.id} FAILED:`,
        err instanceof Error ? err.message : err,
      );
      fail++;
    }
    // OpenRouter has generous rate limits; small spacing keeps load gentle.
    if (i < todo.length - 1) await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`Done. Translated ${ok}, failed ${fail}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
