"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

/**
 * Perplexity-style chat hero. The user's first action on getfrp is to type
 * a sourcing question; everything else on the homepage is supporting context.
 *
 * Submission posts the query as a URL param to /ai, where the existing
 * AiAssistantClient auto-sends it on mount.
 */
export function ChatHero({ examples }: { examples: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function go(text: string) {
    const q = text.trim();
    if (!q || submitting) return;
    setSubmitting(true);
    router.push({ pathname: "/ai", query: { q } } as never);
  }

  return (
    <div className="mt-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className="group relative flex w-full items-end gap-2 rounded-2xl border-2 border-border/80 bg-background p-3 shadow-sm transition-all focus-within:border-foreground/50 focus-within:shadow-md hover:border-foreground/40 sm:p-4"
      >
        <Sparkles
          size={18}
          className="mb-1.5 ml-1 shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground"
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter or plain Enter (without Shift) submits.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              go(value);
            }
          }}
          placeholder="Find me a CE-marked FRP grating supplier with MOQ 200 m²…"
          disabled={submitting}
          rows={2}
          autoComplete="off"
          spellCheck={false}
          className="min-h-[48px] flex-1 resize-none bg-transparent px-1 py-1 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!value.trim() || submitting}
          aria-label="Ask the sourcing assistant"
          className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </form>

      <div className="mt-5">
        <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Try asking
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => go(ex)}
              disabled={submitting}
              className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-left text-[12px] leading-snug text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground disabled:opacity-60"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
