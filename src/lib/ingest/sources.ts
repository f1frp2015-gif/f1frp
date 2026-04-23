// Fetch adapters for public metadata sources.
// Each adapter returns a normalized FetchedPaper or FetchedPatent record.
// No API keys required for the sources used here.

export type FetchedPaper = {
  externalId: string; // source:uid, e.g. "crossref:10.1016/..."
  doi?: string;
  title: string;
  titleEn?: string;
  abstract?: string;
  authors: string[];
  affiliation?: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  citationCount?: number;
  language?: "zh" | "en";
  sourceUrl?: string;
  category?: string; // caller will override if needed
};

export type FetchedPatent = {
  externalId: string;
  title: string;
  titleEn?: string;
  abstract?: string;
  applicationNo?: string;
  publicationNo?: string;
  grantNo?: string;
  applicant?: string;
  inventors?: string[];
  filingDate?: string;
  publicationDate?: string;
  grantDate?: string;
  classification?: string[];
  status?: "pending" | "granted" | "expired" | "withdrawn";
  country?: string;
  countryCode?: string;
  sourceUrl?: string;
};

// ─── CrossRef ──────────────────────────────────────────
// https://api.crossref.org/works?query=...&rows=10
export async function fetchCrossRef(
  query: string,
  rows = 10
): Promise<FetchedPaper[]> {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("rows", String(rows));
  url.searchParams.set(
    "filter",
    "type:journal-article,has-abstract:true"
  );
  url.searchParams.set("select", [
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
  ].join(","));

  const res = await fetch(url, {
    headers: {
      "User-Agent": "f1frp-ingest/1.0 (mailto:f1frp2015@gmail.com)",
    },
  });
  if (!res.ok) throw new Error(`CrossRef ${res.status}`);
  const json = (await res.json()) as {
    message: { items: CrossRefItem[] };
  };
  return json.message.items.map((it) => normalizeCrossRef(it));
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
  // CrossRef abstracts contain JATS XML — strip basic tags.
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

// ─── OpenAlex ──────────────────────────────────────────
// https://api.openalex.org/works?search=...&per-page=10
export async function fetchOpenAlex(
  query: string,
  rows = 10
): Promise<FetchedPaper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(rows));
  url.searchParams.set(
    "select",
    "id,doi,title,authorships,primary_location,publication_year,biblio,abstract_inverted_index,cited_by_count,language"
  );

  const res = await fetch(url, {
    headers: { "User-Agent": "f1frp-ingest/1.0 (mailto:f1frp2015@gmail.com)" },
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const json = (await res.json()) as { results: OpenAlexWork[] };
  return json.results.map(normalizeOpenAlex);
}

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

// ─── USPTO PatentsView ─────────────────────────────────
// TODO: PatentsView is deprecated (410 Gone as of 2024/2025).
// Migrate to USPTO Open Data Portal at https://data.uspto.gov
// (see https://data.uspto.gov/support/transition-guidance/patentsview).
// For now this function returns the 410 error and the cron handles it gracefully.
// https://search.patentsview.org/api/v1/patent/?q=...
export async function fetchPatentsView(
  query: string,
  rows = 10
): Promise<FetchedPatent[]> {
  const apiKey = process.env.PATENTSVIEW_API_KEY;
  const url = "https://search.patentsview.org/api/v1/patent/";
  const body = {
    q: { _text_phrase: { patent_abstract: query } },
    f: [
      "patent_id",
      "patent_number",
      "patent_title",
      "patent_abstract",
      "patent_date",
      "assignees.assignee_organization",
      "inventors.inventor_name_first",
      "inventors.inventor_name_last",
      "cpc_current.cpc_group_id",
    ],
    o: { size: rows },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "f1frp-ingest/1.0 (mailto:f1frp2015@gmail.com)",
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `PatentsView ${res.status}: ${await res.text().catch(() => "")}`
    );
  }
  const json = (await res.json()) as {
    patents?: Array<{
      patent_id: string;
      patent_number: string;
      patent_title: string;
      patent_abstract?: string;
      patent_date?: string;
      assignees?: Array<{ assignee_organization?: string }>;
      inventors?: Array<{ inventor_name_first?: string; inventor_name_last?: string }>;
      cpc_current?: Array<{ cpc_group_id?: string }>;
    }>;
  };
  return (json.patents ?? []).map((p) => ({
    externalId: `uspto:${p.patent_number}`,
    title: p.patent_title,
    titleEn: p.patent_title,
    abstract: p.patent_abstract,
    grantNo: `US${p.patent_number}`,
    publicationNo: `US${p.patent_number}B2`,
    applicant: p.assignees?.[0]?.assignee_organization,
    inventors: (p.inventors ?? [])
      .map((i) =>
        [i.inventor_name_first, i.inventor_name_last].filter(Boolean).join(" ")
      )
      .filter(Boolean),
    grantDate: p.patent_date,
    classification: (p.cpc_current ?? [])
      .map((c) => c.cpc_group_id)
      .filter((x): x is string => Boolean(x))
      .slice(0, 5),
    status: "granted" as const,
    country: "美国",
    countryCode: "US",
    sourceUrl: `https://patents.google.com/patent/US${p.patent_number}`,
  }));
}

// ─── Google Patents (keyless XHR) ──────────────────────
// Google Patents exposes a JSON XHR endpoint that backs the /search results.
// No auth, CN/US/EP/JP/KR aggregated. Rate-limit friendly: we space pages.
// Abstract returned here is a snippet (~1 sentence) — good enough for ingest;
// individual patent pages carry full abstract if deeper enrichment is needed.

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
  results?: {
    total_num_results?: number;
    cluster?: Array<{
      result?: GooglePatentResult[];
    }>;
  };
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

  // Google Patents `snippet` contains &hellip; and <b> tags — clean it.
  const cleanSnippet = (p.snippet ?? "")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Patents whose language tag indicates Chinese — trust the Chinese title.
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

export async function fetchGooglePatents(
  query: string,
  limit = 30,
  opts?: { pagesMax?: number; delayMs?: number }
): Promise<FetchedPatent[]> {
  const pagesMax = opts?.pagesMax ?? 4;
  const delayMs = opts?.delayMs ?? 400;
  const results: FetchedPatent[] = [];

  for (let page = 0; page < pagesMax && results.length < limit; page++) {
    const innerUrl = `q=${encodeURIComponent(query)}&oq=${encodeURIComponent(query)}&page=${page}`;
    const url = `https://patents.google.com/xhr/query?url=${encodeURIComponent(innerUrl)}&exp=`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; f1frp-ingest/1.0; +https://f1frp.com)",
          Accept: "application/json, text/plain, */*",
        },
      });
      if (!res.ok) {
        console.warn(`[gpatents] ${query} page=${page} ${res.status}`);
        break;
      }
      const json = (await res.json()) as GooglePatentsResponse;
      const hits = json.results?.cluster?.[0]?.result ?? [];
      if (hits.length === 0) break;
      for (const h of hits) {
        const normalized = normalizeGooglePatent(h);
        if (normalized) results.push(normalized);
        if (results.length >= limit) break;
      }
    } catch (e) {
      console.warn(
        `[gpatents] ${query} page=${page} ${e instanceof Error ? e.message : e}`
      );
      break;
    }
    // Space requests to stay polite and avoid rate-limit.
    if (page < pagesMax - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}

// ─── EPO OPS (Open Patent Services) placeholder ────────
// OPS requires OAuth — skeleton for future expansion.
export async function fetchEpoOps(
  _query: string,
  _rows = 10
): Promise<FetchedPatent[]> {
  if (!process.env.EPO_OPS_KEY || !process.env.EPO_OPS_SECRET) {
    console.warn(
      "[epo-ops] Skipped: set EPO_OPS_KEY and EPO_OPS_SECRET to enable."
    );
    return [];
  }
  // TODO: implement OAuth2 client_credentials grant + published-data REST.
  return [];
}
