import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AiAssistantClient } from "./ai-client";
import { buildAlternates } from "@/lib/seo";

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
    alternates: buildAlternates("/ai", locale),
  };
}

// No searchParams access here: the client reads `?q=` via useSearchParams,
// which keeps this page statically prerenderable per locale. Previously
// awaiting searchParams forced dynamic rendering and Google saw
// X-Matched-Path: /[locale]/ai (unresolved) instead of /zh/ai.
export default async function AiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AiAssistantClient />;
}
