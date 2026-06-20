import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { listAvailableChatModels } from "@/lib/ai/provider";
import { AiAssistantClient } from "./ai-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AI" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: alternates("/ai"),
  };
}

export default async function AiPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const raw = sp.q;
  const initialQuery = Array.isArray(raw) ? raw[0] : raw;

  // Domestic (f1frp.com / AI_PROFILE=domestic) build → the 3 国产 model options
  // for the picker; overseas (getfrp.com) build → [] (single Gemini, no picker).
  const availableModels = listAvailableChatModels();

  return (
    <AiAssistantClient
      initialQuery={initialQuery ?? undefined}
      availableModels={availableModels}
    />
  );
}
