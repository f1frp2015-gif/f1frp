import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { papers, patents } from "@/lib/db/schema";
import { translateToChinese } from "./translate";
import { generatePaperCommentary } from "./commentary";
import { paperSlug, patentSlug } from "@/lib/slug";
import type { FetchedPaper, FetchedPatent } from "./sources";

function shortHash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 10);
}

export type IngestOpts = {
  category?: string;
  translate?: boolean; // default true
};

export async function ingestPaper(
  fetched: FetchedPaper,
  opts: IngestOpts = {}
) {
  const translate = opts.translate ?? true;
  const shouldTranslate =
    translate && fetched.language !== "zh" && (fetched.title || fetched.abstract);

  let titleZh = fetched.title;
  let abstractZh = fetched.abstract;
  let keywordsZh: string[] = [];

  if (shouldTranslate) {
    try {
      const t = await translateToChinese(
        { title: fetched.title, abstract: fetched.abstract },
        { domainHint: "FRP 纤维增强复合材料" }
      );
      titleZh = t.titleZh || titleZh;
      abstractZh = t.abstractZh || abstractZh;
      keywordsZh = t.keywordsZh;
    } catch (e) {
      console.warn(
        "[ingest/paper] translation failed:",
        e instanceof Error ? e.message : e
      );
    }
  }

  const id = `paper-${shortHash(fetched.externalId)}`;
  const slug = paperSlug(titleZh, id);

  // Produce engineer-facing Chinese commentary so the content is worth
  // something beyond the raw abstract. Null-tolerant — a missing LLM key
  // simply leaves commentary unset.
  const commentary = await generatePaperCommentary({
    title: titleZh,
    titleEn: fetched.titleEn ?? fetched.title,
    abstract: abstractZh,
    journal: fetched.journal,
    year: fetched.year,
    keywords: keywordsZh,
  });

  const values = {
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
    category: opts.category ?? "application",
    language: (fetched.language ?? "en") as "zh" | "en",
    citationCount: fetched.citationCount ?? 0,
    sourceUrl: fetched.sourceUrl,
  };

  await db
    .insert(papers)
    .values(values)
    .onConflictDoUpdate({
      target: papers.id,
      set: { ...values, updatedAt: new Date() },
    });
  return slug;
}

export async function ingestPatent(
  fetched: FetchedPatent,
  opts: IngestOpts = {}
) {
  const translate = opts.translate ?? true;
  const shouldTranslate =
    translate && fetched.countryCode !== "CN" && (fetched.title || fetched.abstract);

  let titleZh = fetched.title;
  let abstractZh = fetched.abstract;

  if (shouldTranslate) {
    try {
      const t = await translateToChinese(
        { title: fetched.title, abstract: fetched.abstract },
        { domainHint: "FRP 复合材料专利" }
      );
      titleZh = t.titleZh || titleZh;
      abstractZh = t.abstractZh || abstractZh;
    } catch (e) {
      console.warn(
        "[ingest/patent] translation failed:",
        e instanceof Error ? e.message : e
      );
    }
  }

  const id = `pat-${shortHash(fetched.externalId)}`;
  const slug = patentSlug(titleZh, id);
  const values = {
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
    category: opts.category ?? "application",
    sourceUrl: fetched.sourceUrl,
  };

  await db
    .insert(patents)
    .values(values)
    .onConflictDoUpdate({
      target: patents.id,
      set: { ...values, updatedAt: new Date() },
    });
  return slug;
}
