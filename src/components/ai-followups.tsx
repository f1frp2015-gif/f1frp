"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Auto-fetched follow-up questions, Perplexity-style. Renders below a
 * complete AI answer; clicking a chip resends the question through the
 * parent's `onAsk` callback (so it lands on the same conversation, not a
 * new chat).
 *
 * The fetch fires once per Q/A pair (`assistantMessageId` is the cache
 * key). If the API returns an empty list (rate limited, model offline),
 * the component renders nothing instead of a stale skeleton.
 */
export function AiFollowups({
  question,
  answer,
  assistantMessageId,
  locale,
  onAsk,
  disabled,
}: {
  question: string;
  answer: string;
  assistantMessageId: string;
  locale: "zh" | "en";
  onAsk: (text: string) => void;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    if (!question || !answer) return;
    setLoading(true);
    fetch("/api/followups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, answer, locale }),
    })
      .then((r) => r.ok ? r.json() : { questions: [] })
      .then((j: { questions?: string[] }) => {
        if (cancelled) return;
        setItems(j.questions ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantMessageId]);

  if (loading && !items) {
    return (
      <div className="mt-5 border-t border-border/50 pt-4">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles size={11} />
          {locale === "en" ? "Related" : "相关问题"}
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 w-full animate-pulse rounded-md border border-border/40 bg-muted/30"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-5 border-t border-border/50 pt-4">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Sparkles size={11} />
        {locale === "en" ? "Related" : "相关问题"}
      </div>
      <div className="space-y-1.5">
        {items.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onAsk(q)}
            className="group flex w-full items-center justify-between gap-3 rounded-md border border-border/40 bg-background px-3 py-2.5 text-left text-[13px] leading-snug transition-colors hover:border-foreground/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{q}</span>
            <ArrowRight
              size={13}
              className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
