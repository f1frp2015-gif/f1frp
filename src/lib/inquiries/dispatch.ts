/**
 * dispatchToSuppliers — send RFQ notification emails to relevant suppliers.
 *
 * Strategy (P0-① implementation):
 * 1. Map material category → supplier categories
 * 2. SELECT top 3 verified, claimed suppliers (enterprise_id NOT NULL + enterprises.contact_email NOT NULL)
 *    ordered by brand_priority DESC, scale_tier (XL>L>M>S) DESC, view_count DESC
 * 3. Send Resend email to each claimed supplier's enterprise.contact_email; CC Doris
 * 4. Always also send to FALLBACK_RECIPIENT (operator visibility)
 * 5. Log every dispatch attempt to rfq_dispatches (status: sent / failed / fallback)
 *
 * If no claimed supplier matches, only the fallback gets the email — operator
 * routes manually until more suppliers claim. This preserves the past behavior
 * while enabling the real flywheel as suppliers come online.
 */

import { db } from "@/lib/db";
import { supplierListings, enterprises, rfqDispatches } from "@/lib/db/schema";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

export interface RfqPayload {
  id: string;
  materialId: string;
  materialName: string;
  company: string;
  name: string;
  email: string;
  phone?: string | null;
  quantity: string;
  application?: string | null;
  extraRequirements?: string | null;
  category: string;
}

const FALLBACK_RECIPIENT = "f1frp2015@gmail.com";
// 2026-05 simplification: single CC channel on both deploys.
// (Previously routed to a named sourcing-desk inbox on en side; consolidated
// to the tech mailbox after the anonymization policy made both sides
// surface the same email anyway.)
const CC_OPS = ["f1frp2015@gmail.com"];
const FROM = "f1frp RFQ <noreply@f1frp.com>";

const CATEGORY_TO_SUPPLIER: Record<string, string[]> = {
  resin: ["resin", "additive"],
  fiber: ["fiber"],
  "fiber-yarn": ["fiber"],
  "fiber-mat": ["fiber"],
  "fiber-fabric": ["fiber"],
  core: ["manufacturer"],
  gelcoat: ["resin"],
  auxiliary: ["additive", "resin"],
  composite: ["manufacturer"],
};

interface MatchedSupplier {
  supplierId: string;
  enterpriseId: string;
  email: string;
  name: string;
}

async function findClaimedSuppliers(supplierCats: string[]): Promise<MatchedSupplier[]> {
  if (supplierCats.length === 0) return [];

  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;

  // Learned relevance: how often this supplier was actually reached for an RFQ
  // in the last 90 days (status='sent' = a real supplier engagement, not a
  // fallback). Closes the rfq_dispatches feedback loop — matching now adapts to
  // who's genuinely active, instead of a purely static category map. Ranked
  // below paid brand priority but above scale/views.
  const historyScore = sql`(
    SELECT count(*) FROM rfq_dispatches d
    WHERE d.supplier_listing_id = ${supplierListings.id}
      AND d.status = 'sent'
      AND d.sent_at > now() - interval '90 days'
  )`;

  const rows = await db
    .select({
      supplierId: supplierListings.id,
      enterpriseId: enterprises.id,
      email: enterprises.contactEmail,
      name: supplierListings.name,
    })
    .from(supplierListings)
    .innerJoin(enterprises, eq(supplierListings.enterpriseId, enterprises.id))
    .where(
      and(
        eq(supplierListings.verified, true),
        isNotNull(supplierListings.enterpriseId),
        isNotNull(enterprises.contactEmail),
        sql`${supplierListings.category} = ANY(${supplierCats})`,
      ),
    )
    .orderBy(
      desc(supplierListings.brandPriority),
      desc(historyScore),
      desc(tierRank),
      desc(supplierListings.viewCount),
    )
    .limit(3);

  return rows
    .filter((r): r is MatchedSupplier =>
      r.enterpriseId != null && r.email != null && r.email.length > 0,
    );
}

export async function dispatchToSuppliers(rfq: RfqPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const supplierCats = CATEGORY_TO_SUPPLIER[rfq.category] ?? ["manufacturer"];

  // 1. Look up claimed suppliers (best-effort)
  let matches: MatchedSupplier[] = [];
  try {
    matches = await findClaimedSuppliers(supplierCats);
  } catch (err) {
    console.error("[dispatch] supplier lookup failed:", err);
  }

  // 2. Build recipient list — always include fallback for operator visibility
  type Recipient = {
    email: string;
    isFallback: boolean;
    supplierId: string | null;
    enterpriseId: string | null;
    name: string | null;
  };
  const recipients: Recipient[] = matches.map((m) => ({
    email: m.email,
    isFallback: false,
    supplierId: m.supplierId,
    enterpriseId: m.enterpriseId,
    name: m.name,
  }));
  recipients.push({
    email: FALLBACK_RECIPIENT,
    isFallback: true,
    supplierId: null,
    enterpriseId: null,
    name: null,
  });

  console.info(
    `[dispatch] rfq=${rfq.id} cats=${supplierCats.join(",")} matched=${matches.length} → recipients=${recipients.length}`,
  );

  const subject = `New RFQ from f1frp.com — ${rfq.materialName}`;
  const html = buildEmailHtml(rfq);

  // 3. Dispatch + log each
  for (const r of recipients) {
    let status: "pending" | "sent" | "failed" | "fallback" = "pending";
    let errorMessage: string | null = null;

    if (apiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: FROM,
            // 收件人若已是 f1frp2015 fallback，避免重复，把 CC 中相同地址过滤掉
            to: r.email,
            cc: CC_OPS.filter((c) => c.toLowerCase() !== r.email.toLowerCase()),
            subject,
            html,
          }),
        });
        if (res.ok) {
          status = r.isFallback ? "fallback" : "sent";
        } else {
          status = "failed";
          errorMessage = `Resend ${res.status}: ${await res.text()}`;
          console.error(`[dispatch] ${errorMessage}`);
        }
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[dispatch] fetch failed:", err);
      }
    } else {
      console.warn("[dispatch] RESEND_API_KEY not set — logging only");
      status = "failed";
      errorMessage = "RESEND_API_KEY missing";
    }

    // Log every attempt (best-effort; do not block on log failures)
    try {
      await db.insert(rfqDispatches).values({
        rfqId: rfq.id,
        materialId: rfq.materialId,
        category: rfq.category,
        supplierListingId: r.supplierId,
        enterpriseId: r.enterpriseId,
        recipientEmail: r.email,
        isFallback: r.isFallback,
        status,
        errorMessage,
      });
    } catch (logErr) {
      console.error("[dispatch] log insert failed:", logErr);
    }
  }
}

function buildEmailHtml(rfq: RfqPayload): string {
  const materialUrl = `https://f1frp.com/zh/materials/${rfq.materialId}`;
  return `
<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><title>New RFQ</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#0070f3">新询价单 / New RFQ</h2>
  <p>您好，f1frp.com 收到一份关于 <strong>${rfq.materialName}</strong> 的询价单。</p>
  <p>Hello, a new RFQ for <strong>${rfq.materialName}</strong> has been submitted on f1frp.com.</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <tr style="background:#f5f5f5">
      <th style="padding:8px;text-align:left;border:1px solid #ddd">字段 / Field</th>
      <th style="padding:8px;text-align:left;border:1px solid #ddd">内容 / Value</th>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #ddd">材料 / Material</td>
      <td style="padding:8px;border:1px solid #ddd"><a href="${materialUrl}">${rfq.materialName}</a></td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:8px;border:1px solid #ddd">公司 / Company</td>
      <td style="padding:8px;border:1px solid #ddd">${rfq.company}</td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #ddd">联系人 / Contact</td>
      <td style="padding:8px;border:1px solid #ddd">${rfq.name}</td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:8px;border:1px solid #ddd">邮箱 / Email</td>
      <td style="padding:8px;border:1px solid #ddd"><a href="mailto:${rfq.email}">${rfq.email}</a></td>
    </tr>
    ${rfq.phone ? `<tr><td style="padding:8px;border:1px solid #ddd">电话 / Phone</td><td style="padding:8px;border:1px solid #ddd">${rfq.phone}</td></tr>` : ""}
    <tr style="background:#f9f9f9">
      <td style="padding:8px;border:1px solid #ddd">数量 / Quantity</td>
      <td style="padding:8px;border:1px solid #ddd">${rfq.quantity}</td>
    </tr>
    ${rfq.application ? `<tr><td style="padding:8px;border:1px solid #ddd">应用场景 / Application</td><td style="padding:8px;border:1px solid #ddd">${rfq.application}</td></tr>` : ""}
    ${rfq.extraRequirements ? `<tr style="background:#f9f9f9"><td style="padding:8px;border:1px solid #ddd">附加要求 / Extra</td><td style="padding:8px;border:1px solid #ddd">${rfq.extraRequirements}</td></tr>` : ""}
  </table>

  <p style="margin-top:24px">
    <a href="${materialUrl}" style="display:inline-block;padding:10px 20px;background:#0070f3;color:#fff;border-radius:6px;text-decoration:none">
      查看材料详情 / View Material
    </a>
  </p>
  <p style="color:#888;font-size:12px;margin-top:32px">
    此邮件由 f1frp.com 自动发出。如需回复，请直接回复采购方邮箱。<br>
    Sent by f1frp.com. Reply directly to the buyer&apos;s email.
  </p>
</body>
</html>
`;
}
