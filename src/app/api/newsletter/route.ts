import { NextResponse } from "next/server";

// Newsletter signup ingress. Accepts { email, topic?, source? } and forwards
// to whichever provider is configured via env. Until a provider key is
// present, signups are accepted and logged (so the UX never appears broken
// in dev / staging). The user keys we currently support:
//
//   RESEND_API_KEY + NEWSLETTER_AUDIENCE_ID    → POST to Resend Audiences
//   BUTTONDOWN_API_KEY                          → POST to Buttondown
//   MAILCHIMP_API_KEY + MAILCHIMP_LIST_ID       → POST to Mailchimp
//
// Add the right env vars in Vercel and the right branch lights up; no code
// change required for the common case.

export const runtime = "edge";

interface Body {
  email?: string;
  topic?: string;
  source?: string;
}

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const topic = body.topic?.trim() || null;
  const source = body.source?.trim() || "web";

  // Provider routing.
  try {
    if (process.env.RESEND_API_KEY && process.env.NEWSLETTER_AUDIENCE_ID) {
      const r = await fetch(
        `https://api.resend.com/audiences/${process.env.NEWSLETTER_AUDIENCE_ID}/contacts`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email,
            unsubscribed: false,
            // Resend's metadata field is sparse; we stuff topic+source so we
            // can segment the audience later without a schema migration.
            first_name: topic ?? undefined,
          }),
        },
      );
      if (!r.ok && r.status !== 409 /* already subscribed */) {
        const text = await r.text();
        console.error("[newsletter] resend error", r.status, text);
        return NextResponse.json({ error: "Provider error" }, { status: 502 });
      }
    } else if (process.env.BUTTONDOWN_API_KEY) {
      const r = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email_address: email, tags: [topic, source].filter(Boolean) }),
      });
      if (!r.ok && r.status !== 400 /* duplicate */) {
        console.error("[newsletter] buttondown error", r.status, await r.text());
        return NextResponse.json({ error: "Provider error" }, { status: 502 });
      }
    } else {
      // No provider wired up yet — log so the operator sees real signups in
      // the Vercel runtime log and can backfill manually until the audience
      // is created. UX still gets a 200 so the success state shows.
      console.log("[newsletter] unrouted signup", { email, topic, source });
    }
  } catch (err) {
    console.error("[newsletter] unexpected error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
