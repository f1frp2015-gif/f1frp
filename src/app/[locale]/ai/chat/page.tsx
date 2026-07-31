import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { alternates } from "@/lib/seo";
import { listAvailableChatModels } from "@/lib/ai/provider";
import { AiAssistantClient } from "../ai-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "FRP Sourcing Assistant" : "复材 AI 助手",
    description:
      locale === "en"
        ? "Interactive getfrp sourcing assistant for FRP specifications, suppliers, materials and standards."
        : "复材规格、供应商、材料与标准的交互式 AI 助手。",
    robots: { index: false, follow: false },
    alternates: alternates("/ai/chat"),
  };
}

export default async function AiChatPage({
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

  return (
    <AiAssistantClient
      initialQuery={initialQuery ?? undefined}
      availableModels={listAvailableChatModels()}
    />
  );
}
