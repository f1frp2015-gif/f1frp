// Demand digest — items 1 & 4 of the flywheel.
//
// Item 1: factory_inquiries.parsedProduct (buyer demand) + quote_logs specs
//   were write-only dead-ends. This aggregates them into ONE evergreen
//   knowledge_chunks row ("近期复材采购需求脉搏") so the AI can cite what the
//   market is actually asking for ("近期 N 个买家在问 X").
// Item 4: it CONSUMES the previously-ignored feedback signals —
//   - factory_inquiries.aiConfidence: low-confidence/spam inquiries are filtered out
//   - quote_logs.extractConfidence: noisy NL extracts are filtered out
//   - quote_logs.conversion: quotes that became real RFQs are flagged (★) and
//     surfaced as validated demand.
//
// Refreshed by the daily cron. One chunk, upserted (id = article:demand-pulse).

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { embedAndUpsertChunk } from "./knowledge-chunk";

const GEOM_LABELS: Record<string, string> = {
  round: "圆管",
  square: "方管",
  rect: "矩管",
  angle: "角型",
  channel: "槽型",
  i_beam: "工字/H型",
  custom: "异形",
};
const FIBER_LABELS: Record<string, string> = {
  e_glass: "E-玻纤",
  ecr_glass: "ECR-玻纤",
  carbon: "碳纤维",
  hybrid: "混杂纤维",
};

function rows<T>(res: unknown): T[] {
  return (Array.isArray(res) ? res : (res as { rows?: unknown[] }).rows ?? []) as T[];
}

export type DemandDigestResult = { updated: boolean; inquiryTopics: number; quoteSpecs: number };

export async function refreshDemandDigest(now: Date = new Date()): Promise<DemandDigestResult> {
  // 1) Buyer inquiry demand (confidence-filtered)
  const inqRes = await db.execute(sql`
    SELECT parsed_product AS product,
           count(*)::int AS cnt,
           count(DISTINCT parsed_target_country)::int AS countries
    FROM factory_inquiries
    WHERE parsed_product IS NOT NULL AND parsed_product <> ''
      AND (ai_confidence IS NULL OR ai_confidence >= 50)
      AND created_at > now() - interval '60 days'
    GROUP BY parsed_product
    ORDER BY cnt DESC
    LIMIT 10
  `);
  const inquiries = rows<{ product: string; cnt: number; countries: number }>(inqRes);

  // 2) Quote-tool spec demand (extract-confidence-filtered, conversion-marked)
  const quoteRes = await db.execute(sql`
    SELECT input->'geometry'->>'type' AS gtype,
           input->>'fiber' AS fiber,
           count(*)::int AS cnt,
           count(*) FILTER (WHERE conversion = 'rfq_created')::int AS converted
    FROM quote_logs
    WHERE created_at > now() - interval '60 days'
      AND (extract_confidence IS NULL OR extract_confidence >= 50)
      AND input->'geometry'->>'type' IS NOT NULL
    GROUP BY gtype, fiber
    ORDER BY cnt DESC
    LIMIT 10
  `);
  const quotes = rows<{ gtype: string; fiber: string; cnt: number; converted: number }>(quoteRes);

  if (inquiries.length === 0 && quotes.length === 0) {
    return { updated: false, inquiryTopics: 0, quoteSpecs: 0 };
  }

  const asOf = now.toISOString().slice(0, 10);
  const lines: string[] = [`近期复材采购需求脉搏（截至 ${asOf}，滚动 60 天，仅统计高置信度记录）`];

  if (inquiries.length) {
    lines.push("\n一、买家询盘热门产品 TOP：");
    inquiries.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.product} — ${r.cnt} 次询盘${r.countries > 1 ? `，覆盖 ${r.countries} 个目标国` : ""}`);
    });
  }

  if (quotes.length) {
    lines.push("\n二、报价工具热门规格 TOP（★ = 有转成正式 RFQ 的验证需求）：");
    quotes.forEach((r, i) => {
      const g = GEOM_LABELS[r.gtype] ?? r.gtype;
      const f = FIBER_LABELS[r.fiber] ?? r.fiber ?? "";
      const star = r.converted > 0 ? ` ★转化${r.converted}` : "";
      lines.push(`${i + 1}. ${g}${f ? "·" + f : ""} — ${r.cnt} 次询价${star}`);
    });
  }

  lines.push("\n（数据来源：复材站询盘与 AI 报价器，用于反映近期市场需求热度，不代表成交价。）");

  await embedAndUpsertChunk({
    id: "article:demand-pulse",
    sourceType: "article",
    sourceId: "demand-pulse",
    title: "近期复材采购需求脉搏（滚动 60 天）",
    content: lines.join("\n"),
    url: "/rfq",
    metadata: { kind: "demand-trend", asOf },
  });

  return { updated: true, inquiryTopics: inquiries.length, quoteSpecs: quotes.length };
}
