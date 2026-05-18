import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { factoryWaitlist } from "@/lib/db/schema";
import { CONTACT } from "@/lib/contact";

// Factory waitlist ingest. /factories/onboard form posts here. The route
// is intentionally simple — store the row, fire a notification to the
// founder's inbox (if configured), and return success. Auth gating /
// payment / CRM sync are deferred; we want to feel every signup land in
// realtime during P1's North Star validation window.

export const runtime = "nodejs";

const PayloadSchema = z.object({
  companyName: z.string().min(2).max(200),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().max(32).optional(),
  contactEmail: z.string().email().max(200),
  contactWechat: z.string().max(100).optional(),
  factoryWebsite: z.string().url().max(255).optional().or(z.literal("")),
  province: z.string().max(32).optional(),
  category: z.string().max(50).optional(),
  monthlyInquiryEstimate: z.number().int().positive().max(100000).optional(),
  interestedTier: z
    .enum(["s1_starter", "s2_pro", "s5_enterprise", "undecided"])
    .default("undecided"),
  source: z.string().max(64).optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "字段校验失败",
        details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    await db.insert(factoryWaitlist).values({
      companyName: payload.companyName,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone ?? null,
      contactEmail: payload.contactEmail,
      contactWechat: payload.contactWechat ?? null,
      factoryWebsite:
        payload.factoryWebsite && payload.factoryWebsite.length > 0
          ? payload.factoryWebsite
          : null,
      province: payload.province ?? null,
      category: payload.category ?? null,
      monthlyInquiryEstimate: payload.monthlyInquiryEstimate ?? null,
      interestedTier: payload.interestedTier,
      source: payload.source ?? "web_onboard",
      note: payload.note ?? null,
    });
  } catch (err) {
    console.error("[factory-waitlist] insert failed", err);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 },
    );
  }

  // Notification: Resend → founder inbox if RESEND_API_KEY + FOUNDER_NOTIFY_EMAIL
  // are set. Otherwise just log. North Star window — every signup matters,
  // so the founder should know within minutes, not the next morning.
  void notifyFounder(payload).catch((err) => {
    console.error("[factory-waitlist] notify failed", err);
  });

  return NextResponse.json({ ok: true });
}

async function notifyFounder(payload: z.infer<typeof PayloadSchema>) {
  const to = process.env.FOUNDER_NOTIFY_EMAIL ?? CONTACT.email;
  if (!process.env.RESEND_API_KEY) {
    console.log("[factory-waitlist] new signup (no email provider wired):", {
      to,
      ...payload,
    });
    return;
  }
  const body = [
    `新工厂 waitlist 报名 — ${payload.companyName}`,
    "",
    `联系人: ${payload.contactName}`,
    `邮箱: ${payload.contactEmail}`,
    payload.contactPhone ? `电话: ${payload.contactPhone}` : null,
    payload.contactWechat ? `微信: ${payload.contactWechat}` : null,
    payload.factoryWebsite ? `网站: ${payload.factoryWebsite}` : null,
    payload.province ? `省份: ${payload.province}` : null,
    payload.category ? `类别: ${payload.category}` : null,
    payload.monthlyInquiryEstimate
      ? `月询盘估算: ${payload.monthlyInquiryEstimate}`
      : null,
    `意向套餐: ${payload.interestedTier}`,
    "",
    payload.note ? `备注:\n${payload.note}` : null,
    "",
    "— 自动通知,1 个工作日内联系对方",
  ]
    .filter(Boolean)
    .join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.RESEND_FROM_EMAIL ?? "waitlist@f1frp.com",
      to,
      subject: `[f1frp] 工厂 waitlist — ${payload.companyName} (${payload.interestedTier})`,
      text: body,
    }),
  });
}
