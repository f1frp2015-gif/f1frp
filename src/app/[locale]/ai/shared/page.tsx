import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AiMessage } from "@/components/ai-message";
import { SourceCards } from "@/components/ai-source-cards";
import { decodeSharedAnswer } from "@/lib/ai/share-link";
import { alternates } from "@/lib/seo";

// Read-only render of a "Share" link from /ai (see ai-client.tsx). The whole
// Q/A/citations payload lives in the `d` query param — no DB row, so this
// page is UGC/ephemeral by nature and stays out of search results.
export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
    alternates: alternates("/ai/shared"),
  };
}

export default async function SharedAnswerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  const sp = await searchParams;
  const raw = sp.d;
  const encoded = Array.isArray(raw) ? raw[0] : raw;
  const payload = encoded ? decodeSharedAnswer(encoded) : null;

  if (!payload) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">
          {isEn
            ? "This shared link is invalid or incomplete."
            : "这个分享链接无效或不完整。"}
        </p>
        <Link
          href={"/ai" as never}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          {isEn ? "Ask the assistant" : "去问 AI 助手"}
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const continueHref = `/ai?q=${encodeURIComponent(payload.q)}` as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles size={11} />
        {isEn ? "Shared answer · getfrp sourcing assistant" : "分享的回答 · 复材 AI"}
      </div>

      <h1 className="text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl">
        {payload.q}
      </h1>

      <div className="mt-6">
        {payload.c.length > 0 && (
          <SourceCards citations={payload.c} label={isEn ? "Sources" : "来源"} />
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <AiMessage content={payload.a} citations={payload.c} />
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border/70 bg-accent/30 p-4 text-sm">
        <p className="text-muted-foreground">
          {isEn
            ? "This is a snapshot of one answer — ask again for the latest data, or continue the conversation."
            : "这是某次回答的快照——想要最新数据可以重新提问，或者继续这个话题。"}
        </p>
        <Link
          href={continueHref as never}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {isEn ? "Continue in the assistant" : "在助手里继续提问"}
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
