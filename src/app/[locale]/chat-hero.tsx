"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Sparkles, ExternalLink, Plus } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { AiMessage, type Citation } from "@/components/ai-message";
import { SourceCards } from "@/components/ai-source-cards";
import { AuthRequiredNotice } from "@/components/auth-required-notice";
import { getMessageText } from "@/lib/ai/utils";

// Perplexity-style hero. First action on getfrp is to type a sourcing
// question; the response streams in-place via /api/chat (same RAG-backed
// transport as /ai). On submit we used to router.push to /ai?q= which lost
// the inline conversational feel — keeping the user on the homepage and
// letting them ask one or two follow-ups before deciding whether to RFQ
// is the actual GTM ask.
//
// We deliberately don't persist the conversation across routes. Users who
// want a full assistant get the "Open in full assistant" link, which is
// a fresh /ai chat preseeded with their last question.

type UIMsg = {
  id: string;
  role: "user" | "assistant" | "system";
  metadata?: { citations?: Citation[] };
};

export type ExampleGroup = { category: string; prompts: string[] };

export function ChatHero({
  exampleGroups,
  anonLimit,
  isSignedIn,
}: {
  exampleGroups: ExampleGroup[];
  anonLimit: number;
  isSignedIn: boolean;
}) {
  const [input, setInput] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  // Server echoes the remaining anon-free-question count on every response
  // via X-Anon-Remaining (see /api/chat/route.ts). null = unknown yet
  // (nothing asked, or signed-in user who never gets the header).
  const [anonRemaining, setAnonRemaining] = useState<number | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { locale: "en" },
        fetch: async (input, init) => {
          const res = await fetch(input, init);
          const header = res.headers.get("X-Anon-Remaining");
          if (header !== null) setAnonRemaining(Number(header));
          return res;
        },
      }),
    [],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });
  const busy = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  function go(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setLastQuestion(q);
    setInput("");
    sendMessage({ text: q });
  }

  function newChat() {
    setMessages([]);
    setInput("");
    setLastQuestion("");
  }

  const continueHref = lastQuestion
    ? (`/ai/chat?q=${encodeURIComponent(lastQuestion)}` as const)
    : ("/ai/chat" as const);

  return (
    <div className="mt-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(input);
        }}
        className="group relative flex w-full items-end gap-2 rounded-2xl border-2 border-border/80 bg-background p-3 shadow-sm transition-all focus-within:border-foreground/50 focus-within:shadow-md hover:border-foreground/40 sm:p-4"
      >
        <Sparkles
          size={18}
          className="mb-1.5 ml-1 shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground"
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              go(input);
            }
          }}
          placeholder={
            hasMessages
              ? "Ask a follow-up…"
              : "Find me a CE-marked FRP grating supplier with MOQ 200 m²…"
          }
          disabled={busy}
          rows={hasMessages ? 1 : 2}
          autoComplete="off"
          spellCheck={false}
          className="min-h-[48px] flex-1 resize-none bg-transparent px-1 py-1 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          aria-label="Ask the sourcing assistant"
          className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </form>

      {/* Either show example chips (cold start) or the streaming conversation */}
      {!hasMessages ? (
        <div className="mt-5">
          <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Try asking
          </div>

          {/* Category pills — pick a lens, then the prompt row below switches */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {exampleGroups.map((g, i) => (
              <button
                key={g.category}
                type="button"
                onClick={() => setActiveCategory(i)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  i === activeCategory
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {g.category}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(exampleGroups[activeCategory]?.prompts ?? []).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => go(ex)}
                disabled={busy}
                className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-left text-[12px] leading-snug text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground disabled:opacity-60"
              >
                {ex}
              </button>
            ))}
          </div>

          {!isSignedIn && (
            <div className="mt-4 text-center text-[11px] text-muted-foreground">
              Free — no signup needed for your first {anonLimit} questions.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6 text-left">
          {messages.map((m, idx) => {
            if (m.role === "user") {
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-[14px] leading-relaxed text-foreground/90"
                >
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    You
                  </div>
                  {getMessageText(m)}
                </div>
              );
            }
            if (m.role === "assistant") {
              const meta = (m as UIMsg).metadata;
              const citations = meta?.citations ?? [];
              const text = getMessageText(m);
              const isLast = idx === messages.length - 1;
              const streaming = isLast && busy;
              return (
                <div key={m.id} className="rounded-xl border border-border/70 bg-background p-5">
                  <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Sparkles size={11} className="text-foreground/70" />
                    getfrp · sourcing assistant
                  </div>
                  <SourceCards citations={citations} />
                  <div className="text-[14px] leading-[1.75] text-foreground/95">
                    <AiMessage content={text} citations={citations} />
                    {streaming && (
                      <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-foreground/60 align-middle" />
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}

          {busy && messages[messages.length - 1]?.role === "user" && (
            <div className="rounded-xl border border-dashed border-border/70 bg-background p-5">
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
                </span>
                Thinking…
              </div>
            </div>
          )}

          <AuthRequiredNotice error={error} remaining={isSignedIn ? undefined : anonRemaining} />

          {!isSignedIn && !error && anonRemaining !== null && anonRemaining > 0 && !busy && (
            <div className="text-center text-[11px] text-muted-foreground">
              {anonRemaining} free question{anonRemaining === 1 ? "" : "s"} left before sign-up.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 text-[12px] text-muted-foreground">
            <button
              type="button"
              onClick={newChat}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Plus size={12} />
              Ask something else
            </button>
            <Link
              href={continueHref as never}
              className="inline-flex items-center gap-1 text-foreground hover:underline"
            >
              Open in full assistant
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
