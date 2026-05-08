import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, articles, materials } from "@/lib/db/schema";
import { desc, gte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(
  recentPapers: Array<{ id: string; title: string; commentary: string | null; createdAt: Date }>,
  recentArticles: Array<{ id: string; slug: string; title: string; excerpt: string | null; createdAt: Date }>,
  recentMaterials: Array<{ id: string; name: string; description: string | null; createdAt: Date }>
): string {
  const BASE = "https://f1frp.com";

  function paperRowZh(p: typeof recentPapers[0]) {
    return `<li style="margin-bottom:12px">
      <a href="${BASE}/papers/${htmlEscape(p.id)}" style="color:#2563eb;font-weight:600">${htmlEscape(p.title)}</a>
      ${p.commentary ? `<br/><span style="font-size:13px;color:#555">${htmlEscape(p.commentary.slice(0, 150))}…</span>` : ""}
    </li>`;
  }

  function paperRowEn(p: typeof recentPapers[0]) {
    return `<li style="margin-bottom:12px">
      <a href="${BASE}/papers/${htmlEscape(p.id)}" style="color:#2563eb;font-weight:600">${htmlEscape(p.title)}</a>
    </li>`;
  }

  function articleRowZh(a: typeof recentArticles[0]) {
    return `<li style="margin-bottom:12px">
      <a href="${BASE}/articles/${htmlEscape(a.slug)}" style="color:#2563eb;font-weight:600">${htmlEscape(a.title)}</a>
      ${a.excerpt ? `<br/><span style="font-size:13px;color:#555">${htmlEscape(a.excerpt.slice(0, 120))}…</span>` : ""}
    </li>`;
  }

  function articleRowEn(a: typeof recentArticles[0]) {
    return `<li style="margin-bottom:12px">
      <a href="${BASE}/articles/${htmlEscape(a.slug)}" style="color:#2563eb;font-weight:600">${htmlEscape(a.title)}</a>
      ${a.excerpt ? `<br/><span style="font-size:13px;color:#555">${htmlEscape(a.excerpt.slice(0, 120))}…</span>` : ""}
    </li>`;
  }

  function materialRow(m: typeof recentMaterials[0]) {
    return `<li style="margin-bottom:8px">
      <a href="${BASE}/materials/${htmlEscape(m.id)}" style="color:#2563eb">${htmlEscape(m.name)}</a>
      ${m.description ? ` — <span style="font-size:13px;color:#555">${htmlEscape(m.description.slice(0, 100))}</span>` : ""}
    </li>`;
  }

  const zhSection = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="color:#1e293b;font-size:22px;margin-bottom:4px">复材站周报</h1>
  <p style="color:#64748b;font-size:13px;margin-bottom:24px">f1frp.com · 纤维复合材料行业每周精选</p>

  <h2 style="font-size:16px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px">📄 本周新增论文</h2>
  <ul style="padding-left:18px;margin-top:12px">
    ${recentPapers.map(paperRowZh).join("")}
  </ul>

  <h2 style="font-size:16px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-top:24px">📰 行业资讯</h2>
  <ul style="padding-left:18px;margin-top:12px">
    ${recentArticles.map(articleRowZh).join("")}
  </ul>

  <h2 style="font-size:16px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-top:24px">🧪 新增材料</h2>
  <ul style="padding-left:18px;margin-top:12px">
    ${recentMaterials.map(materialRow).join("")}
  </ul>

  <p style="margin-top:32px;font-size:12px;color:#94a3b8">
    您收到此邮件因为您订阅了复材站周报。<br/>
    如需退订，请回复此邮件。
  </p>
</div>`;

  const enSection = `
<hr style="border:none;border-top:2px solid #e2e8f0;margin:32px 0"/>
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="color:#1e293b;font-size:22px;margin-bottom:4px">f1frp Weekly</h1>
  <p style="color:#64748b;font-size:13px;margin-bottom:24px">f1frp.com · Fiber-reinforced composites digest</p>

  <h2 style="font-size:16px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px">New Papers</h2>
  <ul style="padding-left:18px;margin-top:12px">
    ${recentPapers.map(paperRowEn).join("")}
  </ul>

  <h2 style="font-size:16px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-top:24px">Industry News</h2>
  <ul style="padding-left:18px;margin-top:12px">
    ${recentArticles.map(articleRowEn).join("")}
  </ul>

  <h2 style="font-size:16px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-top:24px">New Materials</h2>
  <ul style="padding-left:18px;margin-top:12px">
    ${recentMaterials.map(materialRow).join("")}
  </ul>

  <p style="margin-top:32px;font-size:12px;color:#94a3b8">
    You received this because you subscribed to f1frp Weekly.<br/>
    Reply to unsubscribe.
  </p>
</div>`;

  return `<!DOCTYPE html><html><body>${zhSection}${enSection}</body></html>`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not set" });
  }

  // NEWSLETTER_RECIPIENTS: comma-separated list. NEWSLETTER_OWNER: optional
  // single address always included (deduped).
  const recipientEnv = process.env.NEWSLETTER_RECIPIENTS ?? "";
  const owner = (process.env.NEWSLETTER_OWNER ?? "").trim();
  const recipients = recipientEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!recipients.length && !owner) {
    return NextResponse.json({ skipped: true, reason: "NEWSLETTER_RECIPIENTS not set or empty" });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Query last 7 days of content
  const [recentPapers, recentArticles, recentMaterials] = await Promise.all([
    db
      .select({ id: papers.id, title: papers.title, commentary: papers.commentary, createdAt: papers.createdAt })
      .from(papers)
      .where(gte(papers.createdAt, sevenDaysAgo))
      .orderBy(desc(papers.createdAt))
      .limit(5),

    db
      .select({ id: articles.id, slug: articles.slug, title: articles.title, excerpt: articles.excerpt, createdAt: articles.createdAt })
      .from(articles)
      .where(gte(articles.createdAt, sevenDaysAgo))
      .orderBy(desc(articles.createdAt))
      .limit(5),

    db
      .select({ id: materials.id, name: materials.name, description: materials.description, createdAt: materials.createdAt })
      .from(materials)
      .where(gte(materials.createdAt, sevenDaysAgo))
      .orderBy(desc(materials.createdAt))
      .limit(3),
  ]);

  if (!recentPapers.length && !recentArticles.length && !recentMaterials.length) {
    return NextResponse.json({ skipped: true, reason: "No new content in the last 7 days" });
  }

  const html = buildHtml(recentPapers, recentArticles, recentMaterials);
  const subject = `复材站周报 / f1frp Weekly — ${new Date().toISOString().slice(0, 10)}`;

  // Send via Resend HTTP API
  const allRecipients = [...new Set(owner ? [...recipients, owner] : recipients)];

  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "newsletter@f1frp.com",
      to: allRecipients,
      subject,
      html,
    }),
  });

  const sendData = await sendRes.json();

  return NextResponse.json({
    ok: sendRes.ok,
    status: sendRes.status,
    recipients: allRecipients,
    paperCount: recentPapers.length,
    articleCount: recentArticles.length,
    materialCount: recentMaterials.length,
    resend: sendData,
  });
}
