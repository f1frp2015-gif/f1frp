// Backfill papers + patents (2020-2026) from OpenAlex / CrossRef / Google Patents.
// Reuses paperQueryPool / patentQueryPool keywords. Generates Chinese commentary
// inline (papers via ingestPaper, patents via inline ingestPatentWithCommentary).
//
// Run: pnpm tsx --env-file=.env.local scripts/backfill-2020-2026.ts
//   Optional flags:
//     --paper-target=N         papers per keyword (default 125)
//     --patent-target=N        patents per keyword (default 80)
//     --concurrency=N          per-keyword ingest concurrency (default 4)
//     --year-min=YYYY          default 2020
//     --year-max=YYYY          default 2026
//     --skip=papers|patents    skip one phase

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { papers as papersTable, patents as patentsTable } from "../src/lib/db/schema";
import { paperQueryPool, patentQueryPool } from "../src/lib/ingest/query-pool";
import {
  generatePaperCommentaryOR,
  generatePatentCommentaryOR,
} from "../src/lib/ingest/openrouter-commentary";
import { paperSlug, patentSlug } from "../src/lib/slug";
import type { FetchedPaper, FetchedPatent } from "../src/lib/ingest/sources";

type Args = {
  paperTarget: number;
  patentTarget: number;
  concurrency: number;
  yearMin: number;
  yearMax: number;
  skip: Set<"papers" | "patents">;
};

function parseArgs(): Args {
  const a: Args = {
    paperTarget: 125,
    patentTarget: 80,
    concurrency: 4,
    yearMin: 2020,
    yearMax: 2026,
    skip: new Set(),
  };
  for (const s of process.argv.slice(2)) {
    if (s.startsWith("--paper-target=")) a.paperTarget = parseInt(s.slice(15), 10);
    else if (s.startsWith("--patent-target=")) a.patentTarget = parseInt(s.slice(16), 10);
    else if (s.startsWith("--concurrency=")) a.concurrency = Math.max(1, parseInt(s.slice(14), 10));
    else if (s.startsWith("--year-min=")) a.yearMin = parseInt(s.slice(11), 10);
    else if (s.startsWith("--year-max=")) a.yearMax = parseInt(s.slice(11), 10);
    else if (s === "--skip=papers") a.skip.add("papers");
    else if (s === "--skip=patents") a.skip.add("patents");
  }
  return a;
}

function shortHash(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 10);
}

// ─── Year-windowed fetchers ─────────────────────────────────────────

type OpenAlexWork = {
  id: string;
  doi?: string;
  title?: string;
  authorships?: Array<{
    author?: { display_name?: string };
    institutions?: Array<{ display_name?: string }>;
  }>;
  primary_location?: { source?: { display_name?: string } };
  publication_year?: number;
  biblio?: { volume?: string; issue?: string; first_page?: string; last_page?: string };
  abstract_inverted_index?: Record<string, number[]>;
  cited_by_count?: number;
  language?: string;
};

function reconstructAbstract(idx?: Record<string, number[]>): string | undefined {
  if (!idx) return undefined;
  const pairs: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const p of positions) pairs.push([p, word]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs.map((p) => p[1]).join(" ");
}

function normalizeOpenAlex(w: OpenAlexWork): FetchedPaper {
  const authors = (w.authorships ?? [])
    .map((a) => a.author?.display_name)
    .filter((x): x is string => Boolean(x));
  const affiliation = w.authorships?.[0]?.institutions?.[0]?.display_name;
  const journal = w.primary_location?.source?.display_name;
  const pages = w.biblio
    ? [w.biblio.first_page, w.biblio.last_page].filter(Boolean).join("-")
    : undefined;
  const cleanDoi = w.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  return {
    externalId: `openalex:${w.id.split("/").pop() ?? w.id}`,
    doi: cleanDoi,
    title: w.title ?? "",
    titleEn: w.title ?? "",
    abstract: reconstructAbstract(w.abstract_inverted_index),
    authors,
    affiliation,
    journal,
    year: w.publication_year,
    volume: w.biblio?.volume,
    issue: w.biblio?.issue,
    pages: pages || undefined,
    citationCount: w.cited_by_count,
    language: w.language?.toLowerCase().startsWith("zh") ? "zh" : "en",
    sourceUrl: cleanDoi ? `https://doi.org/${cleanDoi}` : w.id,
  };
}

async function fetchOpenAlexWindow(
  query: string,
  yearMin: number,
  yearMax: number,
  limit: number
): Promise<FetchedPaper[]> {
  const out: FetchedPaper[] = [];
  let cursor = "*";
  while (out.length < limit) {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("search", query);
    url.searchParams.set("per-page", String(Math.min(200, limit - out.length)));
    url.searchParams.set("cursor", cursor);
    url.searchParams.set(
      "filter",
      `from_publication_date:${yearMin}-01-01,to_publication_date:${yearMax}-12-31,has_abstract:true`
    );
    url.searchParams.set(
      "select",
      "id,doi,title,authorships,primary_location,publication_year,biblio,abstract_inverted_index,cited_by_count,language"
    );
    const res = await fetch(url, {
      headers: { "User-Agent": "f1frp-backfill/1.0 (mailto:f1frp2015@gmail.com)" },
    });
    if (!res.ok) {
      console.warn(`  [openalex] ${res.status}`);
      break;
    }
    const json = (await res.json()) as {
      results: OpenAlexWork[];
      meta?: { next_cursor?: string | null };
    };
    if (!json.results?.length) break;
    for (const w of json.results) {
      const n = normalizeOpenAlex(w);
      if (n.title && n.abstract) out.push(n);
    }
    const next = json.meta?.next_cursor;
    if (!next) break;
    cursor = next;
    await new Promise((r) => setTimeout(r, 250));
  }
  return out.slice(0, limit);
}

type CrossRefItem = {
  DOI: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; affiliation?: Array<{ name?: string }> }>;
  "container-title"?: string[];
  issued?: { "date-parts"?: number[][] };
  abstract?: string;
  volume?: string;
  issue?: string;
  page?: string;
  "is-referenced-by-count"?: number;
  URL?: string;
  language?: string;
};

function normalizeCrossRef(it: CrossRefItem): FetchedPaper {
  const authors = (it.author ?? [])
    .map((a) => [a.given, a.family].filter(Boolean).join(" "))
    .filter(Boolean);
  const affiliation = it.author?.[0]?.affiliation?.[0]?.name;
  const year = it.issued?.["date-parts"]?.[0]?.[0];
  const abstractClean = it.abstract
    ? it.abstract.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : undefined;
  return {
    externalId: `crossref:${it.DOI}`,
    doi: it.DOI,
    title: (it.title ?? [""])[0],
    titleEn: (it.title ?? [""])[0],
    abstract: abstractClean,
    authors,
    affiliation,
    journal: (it["container-title"] ?? [""])[0] || undefined,
    year,
    volume: it.volume,
    issue: it.issue,
    pages: it.page,
    citationCount: it["is-referenced-by-count"],
    language: it.language?.toLowerCase().startsWith("zh") ? "zh" : "en",
    sourceUrl: it.URL ?? `https://doi.org/${it.DOI}`,
  };
}

async function fetchCrossRefWindow(
  query: string,
  yearMin: number,
  yearMax: number,
  limit: number
): Promise<FetchedPaper[]> {
  const out: FetchedPaper[] = [];
  let cursor = "*";
  while (out.length < limit) {
    const url = new URL("https://api.crossref.org/works");
    url.searchParams.set("query", query);
    url.searchParams.set("rows", String(Math.min(100, limit - out.length)));
    url.searchParams.set("cursor", cursor);
    url.searchParams.set(
      "filter",
      `type:journal-article,has-abstract:true,from-pub-date:${yearMin}-01-01,until-pub-date:${yearMax}-12-31`
    );
    url.searchParams.set(
      "select",
      [
        "DOI",
        "title",
        "author",
        "container-title",
        "issued",
        "abstract",
        "volume",
        "issue",
        "page",
        "is-referenced-by-count",
        "URL",
      ].join(",")
    );
    const res = await fetch(url, {
      headers: { "User-Agent": "f1frp-backfill/1.0 (mailto:f1frp2015@gmail.com)" },
    });
    if (!res.ok) {
      console.warn(`  [crossref] ${res.status}`);
      break;
    }
    const json = (await res.json()) as {
      message: { items: CrossRefItem[]; "next-cursor"?: string };
    };
    const items = json.message?.items ?? [];
    if (!items.length) break;
    for (const it of items) {
      const n = normalizeCrossRef(it);
      if (n.title && n.abstract) out.push(n);
    }
    const next = json.message?.["next-cursor"];
    if (!next || next === cursor) break;
    cursor = next;
    await new Promise((r) => setTimeout(r, 250));
  }
  return out.slice(0, limit);
}

// Google Patents with date filter (priority date window).
type GooglePatentResult = {
  id: string;
  patent?: {
    title?: string;
    snippet?: string;
    priority_date?: string;
    filing_date?: string;
    grant_date?: string;
    publication_date?: string;
    inventor?: string;
    assignee?: string;
    publication_number?: string;
    language?: string;
  };
};

type GooglePatentsResponse = {
  results?: { cluster?: Array<{ result?: GooglePatentResult[] }> };
};

function normalizeGooglePatent(r: GooglePatentResult): FetchedPatent | null {
  const p = r.patent;
  if (!p || !p.publication_number || !p.title) return null;
  const pubNo = p.publication_number;
  const cc = pubNo.slice(0, 2).toUpperCase();
  const countryMap: Record<string, string> = {
    CN: "中国", US: "美国", EP: "欧洲", JP: "日本", KR: "韩国",
    DE: "德国", WO: "PCT", FR: "法国", GB: "英国", CA: "加拿大",
  };
  const cleanSnippet = (p.snippet ?? "")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const isChinese = cc === "CN" || p.language === "zh";
  return {
    externalId: `gpatents:${pubNo}`,
    title: p.title.trim(),
    titleEn: isChinese ? undefined : p.title.trim(),
    abstract: cleanSnippet || undefined,
    publicationNo: pubNo,
    grantNo: p.grant_date ? pubNo : undefined,
    applicant: p.assignee,
    inventors: p.inventor
      ? p.inventor.split(/[,，;；]/).map((s) => s.trim()).filter(Boolean)
      : undefined,
    filingDate: p.filing_date,
    publicationDate: p.publication_date,
    grantDate: p.grant_date,
    status: (p.grant_date ? "granted" : "pending") as "granted" | "pending",
    country: countryMap[cc] ?? cc,
    countryCode: cc,
    sourceUrl: `https://patents.google.com/${r.id}`,
  };
}

async function fetchGooglePatentsWindow(
  query: string,
  yearMin: number,
  yearMax: number,
  limit: number,
  pagesMax = 10
): Promise<FetchedPatent[]> {
  // Google Patents XHR: date filter is an independent URL param, not part of q.
  const results: FetchedPatent[] = [];
  for (let page = 0; page < pagesMax && results.length < limit; page++) {
    const innerUrl = `q=${encodeURIComponent(query)}&oq=${encodeURIComponent(query)}&before=priority:${yearMax}1231&after=priority:${yearMin}0101&page=${page}`;
    const url = `https://patents.google.com/xhr/query?url=${encodeURIComponent(innerUrl)}&exp=`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; f1frp-backfill/1.0; +https://f1frp.com)",
          Accept: "application/json, text/plain, */*",
        },
      });
      if (!res.ok) {
        console.warn(`  [gpatents] page=${page} ${res.status}`);
        break;
      }
      const json = (await res.json()) as GooglePatentsResponse;
      const hits = json.results?.cluster?.[0]?.result ?? [];
      if (!hits.length) break;
      for (const h of hits) {
        const n = normalizeGooglePatent(h);
        if (n) results.push(n);
        if (results.length >= limit) break;
      }
    } catch (e) {
      console.warn(`  [gpatents] page=${page} ${e instanceof Error ? e.message : e}`);
      break;
    }
    if (page < pagesMax - 1) await new Promise((r) => setTimeout(r, 500));
  }
  return results.slice(0, limit);
}

// ─── Existence checks ───────────────────────────────────────────────

async function paperExists(p: FetchedPaper): Promise<boolean> {
  if (p.doi) {
    const r = await db.select({ id: papersTable.id }).from(papersTable).where(eq(papersTable.doi, p.doi)).limit(1);
    if (r.length) return true;
  }
  const id = `paper-${shortHash(p.externalId)}`;
  const r = await db.select({ id: papersTable.id }).from(papersTable).where(eq(papersTable.id, id)).limit(1);
  return r.length > 0;
}

async function patentExists(p: FetchedPatent): Promise<boolean> {
  if (p.publicationNo) {
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.publicationNo, p.publicationNo))
      .limit(1);
    if (r.length) return true;
  }
  if (p.sourceUrl) {
    const r = await db
      .select({ id: patentsTable.id })
      .from(patentsTable)
      .where(eq(patentsTable.sourceUrl, p.sourceUrl))
      .limit(1);
    if (r.length) return true;
  }
  const id = `pat-${shortHash(p.externalId)}`;
  const r = await db.select({ id: patentsTable.id }).from(patentsTable).where(eq(patentsTable.id, id)).limit(1);
  return r.length > 0;
}

// ─── OpenRouter-backed translator (replaces Gemini translateToChinese) ─────

type Translation = { titleZh: string; abstractZh: string; keywordsZh: string[] };

async function translateWithOR(
  input: { title: string; abstract?: string },
  domainHint: string
): Promise<Translation | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4.5";
  const system = `你是 ${domainHint} 领域的资深技术编辑，把英文文献翻译成中文。
要求：
1. 标题翻译遵循行业惯例（CFRP=碳纤维增强复合材料、RTM=树脂传递模塑、GFRP=玻纤增强复合材料）
2. 摘要保留关键技术指标（数值、温度、工艺参数），300-600 字
3. 关键词 4-8 个，覆盖材料/工艺/应用
4. 原文若为中文，直接整理润色
5. 严禁编造原文不存在的数据
仅输出 JSON，形如 {"titleZh":"...","abstractZh":"...","keywordsZh":["...","..."]}`;
  const user = `原文标题：${input.title}\n\n原文摘要：${input.abstract ?? "（无）"}`;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://f1frp.com",
        "X-Title": "f1frp backfill-2020-2026",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      console.warn(`  [tr-or] ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    // Haiku sometimes emits trailing prose; extract the first balanced {...} block.
    const m = stripped.match(/\{[\s\S]*\}/);
    const cleaned = m ? m[0] : stripped;
    const parsed = JSON.parse(cleaned) as Translation;
    if (!parsed.titleZh || !parsed.abstractZh) return null;
    return {
      titleZh: parsed.titleZh,
      abstractZh: parsed.abstractZh,
      keywordsZh: Array.isArray(parsed.keywordsZh) ? parsed.keywordsZh.slice(0, 8) : [],
    };
  } catch (e) {
    console.warn(`  [tr-or] ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// ─── Paper ingest (OpenRouter translate + commentary) ───────────────

async function ingestPaperWithOR(
  fetched: FetchedPaper,
  category: string
): Promise<"ok" | "skip" | "err"> {
  try {
    if (!fetched.title || !fetched.abstract) return "skip";
    if (await paperExists(fetched)) return "skip";

    let titleZh = fetched.title;
    let abstractZh = fetched.abstract;
    let keywordsZh: string[] = [];

    if (fetched.language !== "zh") {
      const t = await translateWithOR(
        { title: fetched.title, abstract: fetched.abstract },
        "FRP 纤维增强复合材料"
      );
      if (t) {
        titleZh = t.titleZh;
        abstractZh = t.abstractZh;
        keywordsZh = t.keywordsZh;
      }
    }

    const commentary = await generatePaperCommentaryOR({
      title: titleZh,
      titleEn: fetched.titleEn ?? fetched.title,
      abstract: abstractZh,
      journal: fetched.journal,
      year: fetched.year,
      keywords: keywordsZh,
    });

    const id = `paper-${shortHash(fetched.externalId)}`;
    const slug = paperSlug(titleZh, id);
    await db
      .insert(papersTable)
      .values({
        id,
        slug,
        title: titleZh,
        titleEn: fetched.titleEn ?? fetched.title,
        authors: fetched.authors,
        affiliation: fetched.affiliation,
        journal: fetched.journal,
        year: fetched.year,
        volume: fetched.volume,
        issue: fetched.issue,
        pages: fetched.pages,
        doi: fetched.doi,
        abstract: abstractZh,
        commentary,
        keywords: keywordsZh.length ? keywordsZh : undefined,
        category,
        language: (fetched.language ?? "en") as "zh" | "en",
        citationCount: fetched.citationCount ?? 0,
        sourceUrl: fetched.sourceUrl,
      })
      .onConflictDoNothing();
    return "ok";
  } catch (e) {
    console.warn(`  [ingest-paper] ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
    return "err";
  }
}

// ─── Patent ingest with commentary (OpenRouter) ─────────────────────

async function ingestPatentWithCommentary(
  fetched: FetchedPatent,
  category: string
): Promise<"ok" | "skip" | "err"> {
  try {
    if (!fetched.title) return "skip";
    if (await patentExists(fetched)) return "skip";

    let titleZh = fetched.title;
    let abstractZh = fetched.abstract;

    if (fetched.countryCode !== "CN" && (fetched.title || fetched.abstract)) {
      const t = await translateWithOR(
        { title: fetched.title, abstract: fetched.abstract ?? "" },
        "FRP 复合材料专利"
      );
      if (t) {
        titleZh = t.titleZh;
        abstractZh = t.abstractZh;
      }
    }

    const commentary = await generatePatentCommentaryOR({
      title: titleZh,
      titleEn: fetched.titleEn ?? fetched.title,
      abstract: abstractZh,
      applicant: fetched.applicant,
      country: fetched.country,
      filingDate: fetched.filingDate,
      grantDate: fetched.grantDate,
    });

    const id = `pat-${shortHash(fetched.externalId)}`;
    const slug = patentSlug(titleZh, id);
    await db
      .insert(patentsTable)
      .values({
        id,
        slug,
        title: titleZh,
        titleEn: fetched.titleEn ?? fetched.title,
        applicationNo: fetched.applicationNo,
        publicationNo: fetched.publicationNo,
        grantNo: fetched.grantNo,
        applicant: fetched.applicant,
        inventors: fetched.inventors,
        filingDate: fetched.filingDate,
        publicationDate: fetched.publicationDate,
        grantDate: fetched.grantDate,
        classification: fetched.classification,
        status: fetched.status ?? "pending",
        country: fetched.country,
        countryCode: fetched.countryCode,
        abstract: abstractZh,
        commentary,
        category,
        sourceUrl: fetched.sourceUrl,
      })
      .onConflictDoNothing();
    return "ok";
  } catch (e) {
    console.warn(`  [ingest-patent] ${fetched.externalId}: ${e instanceof Error ? e.message : e}`);
    return "err";
  }
}

// ─── Concurrency pool ───────────────────────────────────────────────

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not set (translate + commentary both go via OpenRouter)");
    process.exit(1);
  }

  console.log(
    `🚀 backfill ${args.yearMin}-${args.yearMax} | papers/kw=${args.paperTarget} patents/kw=${args.patentTarget} concurrency=${args.concurrency}`
  );
  console.log(
    `📋 paperQueryPool=${paperQueryPool.length} patentQueryPool=${patentQueryPool.length}\n`
  );

  // ─── Papers ───────────────────────────────────────────────────────
  if (!args.skip.has("papers")) {
    let pIdx = 0;
    let totalOk = 0;
    let totalSkip = 0;
    let totalErr = 0;
    for (const entry of paperQueryPool) {
      pIdx++;
      console.log(`\n📄 [paper ${pIdx}/${paperQueryPool.length}] "${entry.query}" → ${entry.category}`);

      // Pull from both OpenAlex and CrossRef, then dedupe by DOI.
      const half = Math.ceil(args.paperTarget / 2);
      const [oa, cr] = await Promise.all([
        fetchOpenAlexWindow(entry.query, args.yearMin, args.yearMax, half + 20).catch((e) => {
          console.warn(`  [openalex-fetch] ${e instanceof Error ? e.message : e}`);
          return [] as FetchedPaper[];
        }),
        fetchCrossRefWindow(entry.query, args.yearMin, args.yearMax, half + 20).catch((e) => {
          console.warn(`  [crossref-fetch] ${e instanceof Error ? e.message : e}`);
          return [] as FetchedPaper[];
        }),
      ]);
      const seen = new Set<string>();
      const merged: FetchedPaper[] = [];
      for (const p of [...oa, ...cr]) {
        const k = (p.doi ?? p.externalId).toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        merged.push(p);
      }
      const candidates = merged.slice(0, args.paperTarget);
      console.log(`  fetched openalex=${oa.length} crossref=${cr.length} unique=${candidates.length}`);

      const stats = { ok: 0, skip: 0, err: 0 };
      await pool(candidates, args.concurrency, async (p) => {
        const r = await ingestPaperWithOR(p, entry.category);
        stats[r]++;
      });
      totalOk += stats.ok;
      totalSkip += stats.skip;
      totalErr += stats.err;
      console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err} (total ok=${totalOk})`);
    }
    console.log(`\n📊 papers done: ok=${totalOk} skip=${totalSkip} err=${totalErr}`);
  }

  // ─── Patents ──────────────────────────────────────────────────────
  if (!args.skip.has("patents")) {
    let qIdx = 0;
    let totalOk = 0;
    let totalSkip = 0;
    let totalErr = 0;
    for (const entry of patentQueryPool) {
      qIdx++;
      const cat = entry.patentCategory ?? entry.category;
      console.log(`\n🛡️  [patent ${qIdx}/${patentQueryPool.length}] "${entry.query}" → ${cat}`);

      const fetched = await fetchGooglePatentsWindow(
        entry.query,
        args.yearMin,
        args.yearMax,
        args.patentTarget + 20
      );
      const seen = new Set<string>();
      const unique = fetched.filter((p) => {
        const k = p.publicationNo ?? p.externalId;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const candidates = unique.slice(0, args.patentTarget);
      console.log(`  fetched=${fetched.length} unique=${candidates.length}`);

      const stats = { ok: 0, skip: 0, err: 0 };
      await pool(candidates, args.concurrency, async (p) => {
        const r = await ingestPatentWithCommentary(p, cat);
        stats[r]++;
      });
      totalOk += stats.ok;
      totalSkip += stats.skip;
      totalErr += stats.err;
      console.log(`  → ok=${stats.ok} skip=${stats.skip} err=${stats.err} (total ok=${totalOk})`);
    }
    console.log(`\n📊 patents done: ok=${totalOk} skip=${totalSkip} err=${totalErr}`);
  }

  console.log(`\n🎉 backfill complete`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
