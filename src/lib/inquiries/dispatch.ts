/**
 * dispatchToSuppliers — send RFQ notification emails to relevant suppliers.
 *
 * Strategy:
 * 1. Match the material's subCategory/category against supplierListings.category
 * 2. Take top-3 verified suppliers by that category (or fall back to f1frp2015@gmail.com)
 * 3. Send a bilingual Resend email to each supplier contact
 *
 * Best-effort: errors are logged but not re-thrown so the caller always succeeds.
 *
 * TODO (next iteration):
 * - Use pgvector cosine similarity on knowledgeChunks to find semantically similar suppliers
 * - Add dashboard view at /dashboard/inquiries for admins to review all RFQs
 * - Track supplierId in a junction table for analytics
 */

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
const CC_DORIS = "doris.li@f1composite.com";
const FROM = "f1frp RFQ <noreply@f1frp.com>";

const CATEGORY_TO_SUPPLIER: Record<string, string[]> = {
  resin: ["resin"],
  fiber: ["fiber"],
  "fiber-yarn": ["fiber"],
  "fiber-mat": ["fiber"],
  "fiber-fabric": ["fiber"],
  core: ["manufacturer"],
  gelcoat: ["resin"],
  auxiliary: ["resin", "manufacturer"],
  composite: ["manufacturer"],
};

export async function dispatchToSuppliers(rfq: RfqPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[dispatch] RESEND_API_KEY not set — skipping email dispatch");
    return;
  }

  const supplierCats = CATEGORY_TO_SUPPLIER[rfq.category] ?? ["manufacturer"];
  let recipients: string[] = [];

  try {
    // Find up to 3 verified suppliers in matching categories
    const matches = await db
      .select({ name: supplierListings.name })
      .from(supplierListings)
      .where(
        and(
          eq(supplierListings.verified, true),
          // Use the first matching category for simplicity; extend with inArray for multi-cat
          eq(supplierListings.category, supplierCats[0])
        )
      )
      .limit(3);

    // supplierListings has no contactEmail — we use fallback for now
    // TODO: join enterprises table to get contactEmail once supplier claim is approved
    if (matches.length === 0) {
      recipients = [FALLBACK_RECIPIENT];
    } else {
      recipients = [FALLBACK_RECIPIENT]; // placeholder; swap for real supplier emails when available
    }
  } catch (err) {
    console.error("[dispatch] DB lookup failed:", err);
    recipients = [FALLBACK_RECIPIENT];
  }

  const subject = `New RFQ from f1frp.com — ${rfq.materialName}`;
  const html = buildEmailHtml(rfq);

  for (const to of recipients) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: FROM,
          to,
          cc: [CC_DORIS],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[dispatch] Resend error ${res.status}:`, body);
      }
    } catch (err) {
      console.error("[dispatch] Resend fetch failed:", err);
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

  <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
  <p style="font-size:12px;color:#888">
    此邮件由 f1frp.com 自动发送 | Sent automatically by f1frp.com<br>
    RFQ ID: ${rfq.id}
  </p>
</body>
</html>
  `.trim();
}
