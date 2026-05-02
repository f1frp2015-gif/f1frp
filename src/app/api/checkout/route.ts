import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getPlan, type PlanId } from "@/lib/pricing";

export const runtime = "nodejs";

function fail(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

// Initiate Stripe Checkout. Falls back to a "pending payment" landing page
// when STRIPE_SECRET_KEY is missing — production must set it.
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    const url = new URL(req.url);
    return NextResponse.redirect(new URL(`/sign-in?redirect_url=${url.pathname}${url.search}`, url));
  }

  const url = new URL(req.url);
  const planId = url.searchParams.get("plan") as PlanId | null;
  if (!planId) return fail("missing plan");

  const plan = getPlan(planId);
  if (!plan) return fail("unknown plan");
  if (plan.priceCents === 0) return fail("plan not purchasable");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = plan.stripePriceEnvKey ? process.env[plan.stripePriceEnvKey] : undefined;

  if (!stripeKey || !priceId) {
    // No Stripe yet — push user to /dashboard/upgrade with intent recorded.
    return NextResponse.redirect(
      new URL(`/dashboard/upgrade?plan=${planId}&pending=stripe-not-configured`, url)
    );
  }

  // Look up our user record for stripe_customer_id reuse.
  const [u] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);

  // Create Checkout Session via REST (no SDK dep needed).
  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${url.origin}/dashboard/upgrade?status=success&plan=${planId}`,
    cancel_url: `${url.origin}/pricing?canceled=1`,
    "metadata[planId]": planId,
    "metadata[clerkId]": userId,
    "metadata[userId]": u?.id ?? "",
    allow_promotion_codes: "true",
  };
  if (plan.trialDays) params["subscription_data[trial_period_days]"] = String(plan.trialDays);
  if (u?.stripeCustomerId) params.customer = u.stripeCustomerId;
  else if (u?.email) params.customer_email = u.email;

  const body = new URLSearchParams(params).toString();

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      console.error("[checkout] stripe error", res.status, await res.text());
      return fail("stripe-error", 502);
    }
    const session = (await res.json()) as { url?: string; id: string };
    if (!session.url) return fail("no-url", 502);
    return NextResponse.redirect(session.url);
  } catch (e) {
    console.error("[checkout] exception", e);
    return fail("checkout-failed", 502);
  }
}
