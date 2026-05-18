import { NextResponse } from "next/server";

// Diagnostic endpoint — surfaces which chat provider getChatModelForRequest
// would resolve for a given Host header, and whether the corresponding API
// key is present. Lets us debug "AI returns OpenRouter error even though we
// switched to Google" type incidents without redeploying.
//
// Usage:
//   curl https://getfrp.com/api/healthz | jq
//   curl -H 'host: f1frp.com' https://getfrp.com/api/healthz | jq  # simulate domestic
//
// Returns env-var presence (not values) for security.

export const runtime = "nodejs";

const DOMESTIC_HOSTS = new Set(["f1frp.com", "www.f1frp.com"]);

function isDomesticHost(host?: string | null): boolean {
  if (!host) return false;
  return DOMESTIC_HOSTS.has(host.toLowerCase().split(":")[0]);
}

export async function GET(req: Request) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "(no host)";

  const profile =
    process.env.AI_PROFILE === "domestic" ? "domestic" : "global";

  const explicitProvider = process.env.CHAT_PROVIDER ?? null;

  // Replicate pickProviderForHost logic — kept in sync manually so this
  // endpoint can detect when the live code disagrees with this expectation.
  let resolvedProvider: string;
  if (explicitProvider) {
    resolvedProvider = `${explicitProvider} (forced via CHAT_PROVIDER env)`;
  } else if (isDomesticHost(host)) {
    resolvedProvider = "deepseek (host=f1frp.com)";
  } else if (profile === "domestic") {
    resolvedProvider = "deepseek (AI_PROFILE=domestic)";
  } else {
    resolvedProvider = "google (default for overseas/preview)";
  }

  const envFlags: Record<string, boolean> = {
    GOOGLE_GENERATIVE_AI_API_KEY: Boolean(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    ),
    DEEPSEEK_API_KEY: Boolean(process.env.DEEPSEEK_API_KEY),
    OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY),
    GEMINI_CHAT_MODEL: Boolean(process.env.GEMINI_CHAT_MODEL),
    DEEPSEEK_CHAT_MODEL: Boolean(process.env.DEEPSEEK_CHAT_MODEL),
    OPENROUTER_CHAT_MODEL: Boolean(process.env.OPENROUTER_CHAT_MODEL),
    GOOGLE_AI_GATEWAY_URL: Boolean(process.env.GOOGLE_AI_GATEWAY_URL),
    CHAT_PROVIDER: Boolean(process.env.CHAT_PROVIDER),
    AI_PROFILE: Boolean(process.env.AI_PROFILE),
  };

  // Show non-secret env var values (provider + model names + profile) so
  // operator can confirm what's set without seeing the secret itself.
  const envValues: Record<string, string | undefined> = {
    AI_PROFILE: process.env.AI_PROFILE,
    CHAT_PROVIDER: process.env.CHAT_PROVIDER,
    GEMINI_CHAT_MODEL: process.env.GEMINI_CHAT_MODEL,
    DEEPSEEK_CHAT_MODEL: process.env.DEEPSEEK_CHAT_MODEL,
    OPENROUTER_CHAT_MODEL: process.env.OPENROUTER_CHAT_MODEL,
  };

  const expectedKey = (() => {
    if (resolvedProvider.startsWith("google")) return "GOOGLE_GENERATIVE_AI_API_KEY";
    if (resolvedProvider.startsWith("deepseek")) return "DEEPSEEK_API_KEY";
    if (resolvedProvider.startsWith("openrouter")) return "OPENROUTER_API_KEY";
    return null;
  })();

  const ok = expectedKey ? envFlags[expectedKey] : false;

  return NextResponse.json(
    {
      ok,
      host,
      profile,
      resolvedProvider,
      expectedKey,
      envFlags,
      envValues,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "(unset)",
      deployedAt: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
    },
    { status: ok ? 200 : 503 },
  );
}
