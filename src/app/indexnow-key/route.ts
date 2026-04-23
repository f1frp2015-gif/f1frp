// IndexNow key verification endpoint.
// Bing/Yandex/etc. fetch this URL to verify we own the key we're submitting with.
// Configure INDEXNOW_KEY in env; keyLocation in search-push.ts points here.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const key = process.env.INDEXNOW_KEY ?? "";
  if (!key) {
    return new Response("INDEXNOW_KEY not configured", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(key, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
