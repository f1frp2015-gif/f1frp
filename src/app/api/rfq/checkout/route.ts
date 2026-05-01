/**
 * POST /api/rfq/checkout
 *
 * P0-② skeleton: create a Stripe Checkout Session for an RFQ payment.
 *
 * Body: { rfqId, payerEmail, payerType, amountCents, currency?, successUrl?, cancelUrl? }
 *   - payerType: 'buyer'    — overseas buyer pays per submitted RFQ
 *                'supplier' — domestic supplier pays to unlock buyer contact / unlock leads
 *   - currency:  default 'usd' (overseas Stripe path)
 *
 * Behavior:
 *   - If a paid rfq_billing row already exists for rfqId → return { paid: true }
 *   - If a pending row with non-expired stripeSessionId → reuse session URL
 *   - Else create new Checkout Session in mode=payment with metadata.rfqId
 *
 * Production notes:
 *   - Set STRIPE_SECRET_KEY (test key for staging, live for prod)
 *   - Set STRIPE_WEBHOOK_SECRET so /api/webhooks/stripe can mark paid
 *   - This endpoint is the *server* — frontend posts to it then redirects user to session.url
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rfqBilling } from "@/lib/db/schema";

export const runtime = "nodejs";

interface CheckoutBody {
  rfqId?: string;
  payerEmail?: string;
  payerType?: "buyer" | "supplier";
  amountCents?: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  productName?: string;
}

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

const SESSION_TTL_MIN = 30; // Stripe Checkout sessions expire ~24h, but reuse only fresh ones

export async function POST(req: Request) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return bad("bad-json");
  }

  const {
    rfqId,
    payerEmail,
    payerType,
    amountCents,
    currency = "usd",
    successUrl,
    cancelUrl,
    productName,
  } = body;

  if (!rfqId || rfqId.length > 80) return bad("missing-rfq-id");
  if (!payerEmail || !payerEmail.includes("@")) return bad("missing-email");
  if (payerType !== "buyer" && payerType !== "supplier") return bad("bad-payer-type");
  if (!Number.isInteger(amountCents) || (amountCents ?? 0) < 50) return bad("bad-amount");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Skeleton state: record intent so the row exists once Stripe is wired up.
    await db.insert(rfqBilling).values({
      rfqId,
      payerEmail,
      payerType,
      amountCents: amountCents!,
      currency,
      status: "pending",
    }).onConflictDoNothing();
    return NextResponse.json({
      ok: false,
      reason: "stripe-not-configured",
      message: "STRIPE_SECRET_KEY missing — billing row created in pending state",
    }, { status: 503 });
  }

  // Reuse existing row if any
  const [existing] = await db.select().from(rfqBilling).where(eq(rfqBilling.rfqId, rfqId)).limit(1);

  if (existing?.status === "paid") {
    return NextResponse.json({ ok: true, paid: true });
  }

  if (existing?.stripeSessionId && existing.status === "pending") {
    const ageMin = (Date.now() - new Date(existing.createdAt).getTime()) / 60000;
    if (ageMin < SESSION_TTL_MIN) {
      // Re-fetch session URL from Stripe
      const r = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${existing.stripeSessionId}`,
        { headers: { Authorization: `Bearer ${stripeKey}` } },
      );
      if (r.ok) {
        const s = (await r.json()) as { url?: string; status?: string };
        if (s.status === "open" && s.url) {
          return NextResponse.json({ ok: true, url: s.url, reused: true });
        }
      }
    }
  }

  // Create new Stripe Checkout Session (mode=payment, one-off)
  const origin = new URL(req.url).origin;
  const params: Record<string, string> = {
    mode: "payment",
    "line_items[0][price_data][currency]": currency,
    "line_items[0][price_data][product_data][name]": productName ?? `f1frp RFQ ${rfqId}`,
    "line_items[0][price_data][unit_amount]": String(amountCents!),
    "line_items[0][quantity]": "1",
    success_url: successUrl ?? `${origin}/overseas?rfq_paid=1&rfq_id=${rfqId}`,
    cancel_url: cancelUrl ?? `${origin}/overseas?rfq_canceled=1&rfq_id=${rfqId}`,
    customer_email: payerEmail,
    "metadata[rfqId]": rfqId,
    "metadata[payerType]": payerType,
  };
  const formBody = new URLSearchParams(params).toString();

  let session: { id: string; url?: string };
  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });
    if (!r.ok) {
      console.error("[rfq-checkout] stripe error", r.status, await r.text());
      return bad("stripe-error", 502);
    }
    session = (await r.json()) as { id: string; url?: string };
  } catch (e) {
    console.error("[rfq-checkout] fetch failed", e);
    return bad("checkout-failed", 502);
  }

  if (!session.url) return bad("no-session-url", 502);

  // Upsert billing row
  if (existing) {
    await db
      .update(rfqBilling)
      .set({
        stripeSessionId: session.id,
        amountCents: amountCents!,
        currency,
        payerEmail,
        payerType,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(rfqBilling.rfqId, rfqId));
  } else {
    await db.insert(rfqBilling).values({
      rfqId,
      payerEmail,
      payerType,
      amountCents: amountCents!,
      currency,
      stripeSessionId: session.id,
      status: "pending",
    });
  }

  return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
}
