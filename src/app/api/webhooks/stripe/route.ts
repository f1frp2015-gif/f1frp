import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, subscriptions, rfqBilling } from "@/lib/db/schema";
import { getPlan, type PlanId } from "@/lib/pricing";
import type { MembershipTier } from "@/lib/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Stripe signature verification (no SDK) ──────────────────────────
function verifySig(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const items = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string])
  );
  const ts = items.t;
  const v1 = items.v1;
  if (!ts || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end?: boolean;
  items?: { data: Array<{ price: { id: string } }> };
  metadata?: { planId?: string; clerkId?: string; userId?: string };
};

type StripeCheckoutSession = {
  id: string;
  customer: string;
  subscription: string;
  mode?: "subscription" | "payment" | "setup";
  payment_intent?: string;
  payment_status?: string;
  metadata?: {
    planId?: string;
    clerkId?: string;
    userId?: string;
    rfqId?: string;
    payerType?: "buyer" | "supplier";
  };
};

type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeSubscription | StripeCheckoutSession & Record<string, unknown> };
};

async function applySubscription(opts: {
  clerkId: string;
  planId: PlanId;
  stripeCustomerId: string;
  stripeSubId: string;
  status: string;
  currentPeriodEnd: Date;
}) {
  const plan = getPlan(opts.planId);
  if (!plan) {
    console.warn("[stripe-webhook] unknown planId", opts.planId);
    return;
  }
  const tier: MembershipTier = plan.tier;

  const [u] = await db.select().from(users).where(eq(users.clerkId, opts.clerkId)).limit(1);
  if (!u) {
    console.warn("[stripe-webhook] user not found", opts.clerkId);
    return;
  }

  const isActive = ["active", "trialing"].includes(opts.status);
  await db
    .update(users)
    .set({
      membershipTier: isActive ? tier : "free",
      membershipExpiry: opts.currentPeriodEnd,
      stripeCustomerId: opts.stripeCustomerId,
      stripeSubscriptionId: opts.stripeSubId,
      subscriptionStatus: opts.status,
      trialUntil: opts.status === "trialing" ? opts.currentPeriodEnd : u.trialUntil,
      updatedAt: new Date(),
    })
    .where(eq(users.id, u.id));

  await db.insert(subscriptions).values({
    userId: u.id,
    plan: opts.planId,
    tier,
    provider: "stripe",
    providerSubId: opts.stripeSubId,
    amountCents: plan.priceCents,
    currency: "CNY",
    status: opts.status,
    expiresAt: opts.currentPeriodEnd,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const payload = await req.text();

  if (secret && !verifySig(payload, sig, secret)) {
    return NextResponse.json({ ok: false, reason: "bad-sig" }, { status: 400 });
  }

  let evt: StripeEvent;
  try {
    evt = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "checkout.session.completed": {
        const s = evt.data.object as StripeCheckoutSession;

        // P0-② RFQ payment branch: mode=payment + metadata.rfqId
        if (s.mode === "payment" && s.metadata?.rfqId) {
          await db
            .update(rfqBilling)
            .set({
              status: "paid",
              stripePaymentIntentId: s.payment_intent ?? null,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(rfqBilling.rfqId, s.metadata.rfqId));
          break;
        }

        // Subscription branch (existing Pro membership flow)
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey || !s.subscription) break;
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${s.subscription}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        if (!subRes.ok) break;
        const sub = (await subRes.json()) as StripeSubscription;
        const planId = (s.metadata?.planId ?? sub.metadata?.planId) as PlanId | undefined;
        const clerkId = s.metadata?.clerkId ?? sub.metadata?.clerkId;
        if (!planId || !clerkId) break;
        await applySubscription({
          clerkId,
          planId,
          stripeCustomerId: s.customer,
          stripeSubId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = evt.data.object as StripeSubscription;
        const planId = sub.metadata?.planId as PlanId | undefined;
        const clerkId = sub.metadata?.clerkId;
        if (!planId || !clerkId) break;
        await applySubscription({
          clerkId,
          planId,
          stripeCustomerId: sub.customer,
          stripeSubId: sub.id,
          status: evt.type === "customer.subscription.deleted" ? "canceled" : sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error", e);
    return NextResponse.json({ ok: false, reason: "handler-error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
