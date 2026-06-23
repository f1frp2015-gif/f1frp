import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { papers, patents } from "@/lib/db/schema";
import { fetchCrossRef, fetchOpenAlex, fetchPatentsView } from "@/lib/ingest/sources";
import { ingestPaper, ingestPatent } from "@/lib/ingest";
import { fanOutSearchPush } from "@/lib/ingest/search-push";
import { notifyTelegram } from "@/lib/ingest/telegram-notify";
import { embedNewRecords } from "@/lib/ingest/embed-records";
import { isCompositeRelevant } from "@/lib/ingest/relevance";
import { refreshDemandDigest } from "@/lib/ingest/demand-digest";
import {
  paperQueryPool,
  patentQueryPool,
  pickForDay,
} from "@/lib/ingest/query-pool";

export const runtime = "nodejs";
export const maxDuration = 300; // allow up to 5 min for translation chain
export const dynamic = "force-dynamic";

const DAILY_TARGET = 5;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail-closed
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Vercel Cron sends this header automatically when CRON_SECRET matches,
  // but also expose query param fallback for manual invocation.
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}

async function paperExistsByDoi(doi?: string): Promise<boolean> {
  if (!doi) return false;
  const rows = await db
    .select({ id: papers.id })
    .from(papers)
    .where(eq(papers.doi, doi))
    .limit(1);
  return rows.length > 0;
}

async function patentExistsBy(sourceUrl?: string, grantNo?: string): Promise<boolean> {
  if (sourceUrl) {
    const r = await db
      .select({ id: patents.id })
      .from(patents)
      .where(eq(patents.sourceUrl, sourceUrl))
      .limit(1);
    if (r.length) return true;
  }
  if (grantNo) {
    const r = await db
      .select({ id: patents.id })
      .from(patents)
      .where(eq(patents.grantNo, grantNo))
      .limit(1);
    if (r.length) return true;
  }
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const results: {
    papers: { inserted: string[]; skipped: string[]; errors: string[] };
    patents: { inserted: string[]; skipped: string[]; errors: string[] };
    query: { paper: string; patent: string };
  } = {
    papers: { inserted: [], skipped: [], errors: [] },
    patents: { inserted: [], skipped: [], errors: [] },
    query: { paper: "", patent: "" },
  };

  // ─── Papers ────────────────────────────────────────────
  const paperPick = pickForDay(paperQueryPool, today);
  results.query.paper = paperPick.query;
  try {
    // Try CrossRef first (more abstracts available); fall back to OpenAlex.
    const fetched = [
      ...(await fetchCrossRef(paperPick.query, 12).catch(() => [])),
      ...(await fetchOpenAlex(paperPick.query, 8).catch(() => [])),
    ];
    const seen = new Set<string>();
    const unique = fetched.filter((p) => {
      const key = (p.doi ?? p.externalId).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    for (const p of unique) {
      if (results.papers.inserted.length >= DAILY_TARGET) break;
      if (!p.title || !p.abstract) {
        results.papers.skipped.push(`${p.externalId}: missing fields`);
        continue;
      }
      if (await paperExistsByDoi(p.doi)) {
        results.papers.skipped.push(`${p.externalId}: duplicate DOI`);
        continue;
      }
      const relP = await isCompositeRelevant({
        title: p.title,
        titleEn: p.titleEn,
        abstract: p.abstract,
      });
      if (!relP.relevant) {
        results.papers.skipped.push(`${p.externalId}: non-composite (${relP.reason})`);
        continue;
      }
      try {
        const id = await ingestPaper(p, { category: paperPick.category });
        results.papers.inserted.push(id);
      } catch (e) {
        results.papers.errors.push(
          `${p.externalId}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  } catch (e) {
    results.papers.errors.push(
      `paper-pipeline: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  // ─── Patents (best-effort; USPTO API may rate-limit without key) ──
  const patentPick = pickForDay(patentQueryPool, today);
  results.query.patent = patentPick.query;
  try {
    const fetched = await fetchPatentsView(patentPick.query, 10).catch((e) => {
      results.patents.errors.push(
        `uspto-fetch: ${e instanceof Error ? e.message : String(e)}`
      );
      return [];
    });
    for (const p of fetched) {
      if (results.patents.inserted.length >= DAILY_TARGET) break;
      if (!p.title || !p.abstract) {
        results.patents.skipped.push(`${p.externalId}: missing fields`);
        continue;
      }
      if (await patentExistsBy(p.sourceUrl, p.grantNo)) {
        results.patents.skipped.push(`${p.externalId}: duplicate`);
        continue;
      }
      const relP = await isCompositeRelevant({
        title: p.title,
        titleEn: p.titleEn,
        abstract: p.abstract,
      });
      if (!relP.relevant) {
        results.patents.skipped.push(`${p.externalId}: non-composite (${relP.reason})`);
        continue;
      }
      try {
        const id = await ingestPatent(p, {
          category: patentPick.patentCategory ?? patentPick.category,
        });
        results.patents.inserted.push(id);
      } catch (e) {
        results.patents.errors.push(
          `${p.externalId}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  } catch (e) {
    results.patents.errors.push(
      `patent-pipeline: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  // Fan-out new URLs to Baidu + IndexNow (Bing/Yandex) + Sogou + 360 + Google.
  // Each engine no-ops when its credentials are absent.
  const pushUrls = [
    ...results.papers.inserted.map((id) => `https://f1frp.com/papers/${id}`),
    ...results.patents.inserted.map((id) => `https://f1frp.com/patents/${id}`),
  ];
  const searchPush = await fanOutSearchPush(pushUrls);

  // Telegram channel notify — no-ops when env vars are absent.
  await notifyTelegram([
    ...results.papers.inserted.map((id) => ({
      title: id,
      url: `https://f1frp.com/papers/${id}`,
      kind: "paper" as const,
    })),
    ...results.patents.inserted.map((id) => ({
      title: id,
      url: `https://f1frp.com/patents/${id}`,
      kind: "patent" as const,
    })),
  ]);

  // Live-embed the newly-ingested papers/patents into knowledge_chunks, and
  // refresh the demand digest — so fresh literature + market demand are
  // RAG-citable the same day (no manual embed-corpus run). Non-blocking.
  let embed: { papers: number; patents: number; errors: number } | null = null;
  let demand: Awaited<ReturnType<typeof refreshDemandDigest>> | null = null;
  try {
    embed = await embedNewRecords({
      paperIds: results.papers.inserted,
      patentIds: results.patents.inserted,
    });
  } catch (e) {
    console.warn("[cron] embed new records failed:", e instanceof Error ? e.message : e);
  }
  try {
    demand = await refreshDemandDigest(today);
  } catch (e) {
    console.warn("[cron] demand digest failed:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({
    ok: true,
    day: today.toISOString().slice(0, 10),
    target: DAILY_TARGET,
    searchPush,
    embed,
    demand,
    ...results,
  });
}
