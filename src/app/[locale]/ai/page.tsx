import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

  return <AiAssistantClient initialQuery={initialQuery ?? undefined} />;
}
