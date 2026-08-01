// getfrp Sourcing Desk · step 5 — Human Handoff. Persist a structured Sourcing
// Brief (the 5-step terminus) and notify the getfrp ops inbox so a human can
// follow up. Also the demand-intel source fed back to the domestic
// S2 (what buyers are actually asking for). Reuses the Resend pattern from
// inquiries/dispatch.ts. Non-blocking: an email failure never loses the brief,
// and (defensive) a missing table never hard-crashes the chat.

import { db } from "@/lib/db";
import { sourcingBriefs, type NewSourcingBrief } from "@/lib/db/schema";

const OPS_RECIPIENT = "f1frp2015@gmail.com";
const FROM = "getfrp Sourcing Desk <noreply@f1frp.com>";

export type SourcingBriefInput = {
  host?: string | null;
  locale?: string;
  buyer?: { company?: string; name?: string; email?: string; country?: string };
  spec?: Record<string, unknown>;
  feasibility?: Record<string, unknown>;
  landedCost?: Record<string, unknown>;
  complianceFlags?: unknown[];
};

export type SourcingBriefResult = { ok: boolean; ticketId: string | null; notified: boolean };

export async function createSourcingBrief(input: SourcingBriefInput): Promise<SourcingBriefResult> {
  let ticketId: string | null = null;
  try {
    const row: NewSourcingBrief = {
      host: input.host ?? null,
      locale: input.locale ?? "en",
      buyerCompany: input.buyer?.company ?? null,
      buyerName: input.buyer?.name ?? null,
      buyerEmail: input.buyer?.email ?? null,
      buyerCountry: input.buyer?.country ?? null,
      spec: input.spec ?? null,
      feasibility: input.feasibility ?? null,
      landedCost: input.landedCost ?? null,
      complianceFlags: input.complianceFlags ?? null,
    };
    const inserted = await db.insert(sourcingBriefs).values(row).returning({ id: sourcingBriefs.id });
    ticketId = inserted[0]?.id ?? null;
  } catch (e) {
    // e.g. table not migrated yet — still notify ops so the lead isn't lost.
    console.error("[sourcing-brief] insert failed:", e instanceof Error ? e.message : e);
  }

  const notified = await notifyOps(input, ticketId).catch((e) => {
    console.error("[sourcing-brief] ops notify failed:", e instanceof Error ? e.message : e);
    return false;
  });

  return { ok: ticketId != null, ticketId, notified };
}

async function notifyOps(input: SourcingBriefInput, ticketId: string | null): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[sourcing-brief] RESEND_API_KEY missing — brief stored, ops not emailed");
    return false;
  }
  const b = input.buyer ?? {};
  const product = (input.spec?.productCategory as string) ?? "FRP";
  const country = b.country ?? "—";
  const row = (k: string, v: unknown) =>
    v == null || v === "" ? "" : `<tr><td style="padding:6px;border:1px solid #ddd;font-weight:600">${k}</td><td style="padding:6px;border:1px solid #ddd">${escapeHtml(String(typeof v === "object" ? JSON.stringify(v) : v))}</td></tr>`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:640px;margin:auto;color:#1a1a1a">
  <h2 style="color:#0070f3">New Sourcing Brief — ${escapeHtml(product)} → ${escapeHtml(country)}</h2>
  <p>A buyer completed the getfrp Sourcing Desk flow. Follow up within 24h.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${row("Ticket", ticketId ?? "(not stored — DB insert failed, see logs)")}
    ${row("Company", b.company)}${row("Contact", b.name)}${row("Email", b.email)}${row("Country", b.country)}
    ${row("Spec", input.spec)}${row("Feasibility", input.feasibility)}${row("Landed cost", input.landedCost)}${row("Compliance", input.complianceFlags)}
  </table></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: FROM,
      to: OPS_RECIPIENT,
      subject: `New Sourcing Brief — ${product} → ${country}${b.company ? ` (${b.company})` : ""}`,
      html,
    }),
  });
  if (!res.ok) console.error(`[sourcing-brief] Resend ${res.status}: ${await res.text()}`);
  return res.ok;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}
