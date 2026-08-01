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
import { CURRENT_SITE_URL } from "@/lib/sites";

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
  targetSupplierId?: string | null;
  destinationCountry?: string | null;
  deliveryDate?: string | null;
  incoterm?: string | null;
  standards?: string | null;
  targetPrice?: string | null;
  sampleRequired?: boolean;
  ndaRequired?: boolean;
  attachment?: { filename: string; content: string };
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
  raw: ["resin", "fiber", "additive"],
  equipment: ["equipment"],
  tooling: ["tooling"],
  molds: ["mold"],
  finished: ["manufacturer"],
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

async function findTargetSupplier(supplierId: string): Promise<MatchedSupplier[]> {
  const rows = await db
    .select({
      supplierId: supplierListings.id,
      enterpriseId: enterprises.id,
      email: enterprises.contactEmail,
      name: supplierListings.nameEn,
    })
    .from(supplierListings)
    .innerJoin(enterprises, eq(supplierListings.enterpriseId, enterprises.id))
    .where(
      and(
        eq(supplierListings.id, supplierId),
        eq(supplierListings.verified, true),
        isNotNull(supplierListings.enterpriseId),
        isNotNull(enterprises.contactEmail),
      ),
    )
    .limit(1);

  return rows.filter(
    (row): row is MatchedSupplier =>
      row.enterpriseId != null &&
      row.email != null &&
      row.email.length > 0 &&
      row.name != null &&
      row.name.length > 0,
  );
}

async function findPublishedTargetName(supplierId: string): Promise<string | null> {
  const [row] = await db
    .select({ nameEn: supplierListings.nameEn, name: supplierListings.name })
    .from(supplierListings)
    .where(
      and(
        eq(supplierListings.id, supplierId),
        eq(supplierListings.profilePublished, true),
      ),
    )
    .limit(1);
  return row?.nameEn ?? row?.name ?? null;
}

export async function dispatchToSuppliers(rfq: RfqPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const supplierCats = CATEGORY_TO_SUPPLIER[rfq.category] ?? ["manufacturer"];

  // 1. Look up claimed suppliers (best-effort)
  let matches: MatchedSupplier[] = [];
  let targetSupplierName: string | null = null;
  try {
    if (rfq.targetSupplierId) {
      [matches, targetSupplierName] = await Promise.all([
        findTargetSupplier(rfq.targetSupplierId),
        findPublishedTargetName(rfq.targetSupplierId),
      ]);
    } else {
      matches = await findClaimedSuppliers(supplierCats);
    }
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
    `[dispatch] rfq=${rfq.id} target=${rfq.targetSupplierId ?? "auto"} cats=${supplierCats.join(",")} matched=${matches.length} → recipients=${recipients.length}`,
  );

  const subjectProduct = rfq.materialName.replace(/[\r\n]+/g, " ").slice(0, 150);
  const subject = targetSupplierName
    ? `New supplier inquiry for ${targetSupplierName} — ${subjectProduct}`
    : `New RFQ via GetFRP — ${subjectProduct}`;
  const html = buildEmailHtml(rfq, targetSupplierName);

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
            reply_to: rfq.email,
            subject,
            html,
            attachments: rfq.attachment ? [rfq.attachment] : undefined,
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatValue(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function buildEmailHtml(rfq: RfqPayload, targetSupplierName: string | null): string {
  const isMaterialInquiry =
    rfq.materialId !== "general-inquiry" &&
    !rfq.materialId.startsWith("supplier:");
  const materialUrl = isMaterialInquiry
    ? `${CURRENT_SITE_URL}/materials/${encodeURIComponent(rfq.materialId)}`
    : null;
  const rows: Array<[string, string | null | undefined]> = [
    ["指定供应商 / Target supplier", targetSupplierName],
    ["产品 / Product", rfq.materialName],
    ["公司 / Company", rfq.company],
    ["联系人 / Contact", rfq.name],
    ["邮箱 / Email", rfq.email],
    ["电话 / Phone", rfq.phone],
    ["目的国 / Destination", rfq.destinationCountry],
    ["数量 / Quantity", rfq.quantity],
    ["应用场景 / Application", rfq.application],
    ["标准与认证 / Standards", rfq.standards],
    ["交期 / Delivery date", rfq.deliveryDate],
    ["Incoterm", rfq.incoterm],
    ["目标价 / Target price", rfq.targetPrice],
    ["样品 / Sample", rfq.sampleRequired ? "Required" : null],
    ["NDA", rfq.ndaRequired ? "Requested before technical-file release" : null],
    ["附件 / Attachment", rfq.attachment?.filename],
    ["附加要求 / Extra", rfq.extraRequirements],
  ];
  const tableRows = rows
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(
      ([label, value], index) => `
    <tr${index % 2 ? ' style="background:#f9f9f9"' : ""}>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(label)}</td>
      <td style="padding:8px;border:1px solid #ddd">${formatValue(value)}</td>
    </tr>`,
    )
    .join("");
  return `
<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><title>New RFQ</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#0b756f">新询价单 / New RFQ</h2>
  <p>您好，GetFRP 收到一份关于 <strong>${escapeHtml(rfq.materialName)}</strong> 的询价单。</p>
  <p>Hello, a new RFQ for <strong>${escapeHtml(rfq.materialName)}</strong> has been submitted through GetFRP.</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <tr style="background:#f5f5f5">
      <th style="padding:8px;text-align:left;border:1px solid #ddd">字段 / Field</th>
      <th style="padding:8px;text-align:left;border:1px solid #ddd">内容 / Value</th>
    </tr>
    ${tableRows}
  </table>

  ${materialUrl ? `<p style="margin-top:24px">
    <a href="${materialUrl}" style="display:inline-block;padding:10px 20px;background:#0b756f;color:#fff;border-radius:6px;text-decoration:none">
      查看材料详情 / View Material
    </a>
  </p>` : ""}
  <p style="color:#888;font-size:12px;margin-top:32px">
    此邮件由 GetFRP 自动发出。直接回复即可联系采购方。<br>
    Sent by GetFRP. Reply to this email to contact the buyer.
  </p>
</body>
</html>
`;
}
