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
const OVERSEAS_HOSTS = new Set(["getfrp.com", "www.getfrp.com"]);

function normalizeHost(host?: string | null): string | null {
  if (!host) return null;
  return host.toLowerCase().split(":")[0];
}

function isDomesticHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  return h !== null && DOMESTIC_HOSTS.has(h);
}

function isOverseasHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  return h !== null && OVERSEAS_HOSTS.has(h);
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
  // Production hosts win over CHAT_PROVIDER (2026-05-18 hardening).
  let resolvedProvider: string;
  if (isDomesticHost(host)) {
    resolvedProvider = "deepseek (host=f1frp.com — authoritative)";
  } else if (isOverseasHost(host)) {
    resolvedProvider = "google (host=getfrp.com — authoritative)";
  } else if (explicitProvider) {
    resolvedProvider = `${explicitProvider} (forced via CHAT_PROVIDER env — non-prod host)`;
  } else if (profile === "domestic") {
    resolvedProvider = "deepseek (AI_PROFILE=domestic, non-prod host)";
  } else {
    resolvedProvider = "google (default for non-prod / preview / unknown host)";
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
    TAVILY_API_KEY: Boolean(process.env.TAVILY_API_KEY),
    DASHSCOPE_API_KEY: Boolean(process.env.DASHSCOPE_API_KEY),
    EMBEDDING_PROVIDER: Boolean(process.env.EMBEDDING_PROVIDER),
  };

  // Show non-secret env var values (provider + model names + profile) so
  // operator can confirm what's set without seeing the secret itself.
  const envValues: Record<string, string | undefined> = {
    AI_PROFILE: process.env.AI_PROFILE,
    CHAT_PROVIDER: process.env.CHAT_PROVIDER,
    GEMINI_CHAT_MODEL: process.env.GEMINI_CHAT_MODEL,
    DEEPSEEK_CHAT_MODEL: process.env.DEEPSEEK_CHAT_MODEL,
    OPENROUTER_CHAT_MODEL: process.env.OPENROUTER_CHAT_MODEL,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
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
      // Commit SHA sources, in priority order:
      //   1. VERCEL_GIT_COMMIT_SHA — set by Vercel runtime (getfrp.com side)
      //   2. NEXT_PUBLIC_COMMIT_SHA — baked in at build time by the
      //      GitHub Actions workflow (ECS side, see deploy-ecs.yml)
      commit:
        (
          process.env.VERCEL_GIT_COMMIT_SHA ??
          process.env.NEXT_PUBLIC_COMMIT_SHA ??
          ""
        ).slice(0, 7) || "(unset)",
      deployedAt:
        process.env.NEXT_PUBLIC_DEPLOYED_AT ??
        process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ??
        null,
    },
    { status: ok ? 200 : 503 },
  );
}
