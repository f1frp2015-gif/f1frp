"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { getMessageText } from "@/lib/ai/utils";
import { AiMessage } from "@/components/ai-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const QUICK_QUESTIONS: Record<"zh" | "en", readonly string[]> = {
  zh: [
    "耐盐酸的树脂推荐哪种？",
    "拉挤型材出口欧洲需要什么标准？",
    "碳纤维和玻纤强度差多少？",
    "真空导入的配方怎么配？",
  ],
  en: [
    "Which resin resists hydrochloric acid best?",
    "What standards apply to pultruded profiles exported to Europe?",
    "How much stronger is carbon fiber than glass fiber?",
    "How should I formulate for vacuum infusion?",
  ],
};

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const localeRaw = useLocale();
  const locale: "zh" | "en" = localeRaw === "en" ? "en" : "zh";
  const t = useTranslations("AI");
  const ts = useTranslations("Site");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { locale },
      }),
    [locale]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const busy = status === "streaming" || status === "submitted";
  const quickQuestions = QUICK_QUESTIONS[locale];

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || busy) return;
    setInput("");
    await sendMessage({ text: msg });
  }

  const welcome =
    locale === "en"
      ? "Hi! I'm the composites AI. Ask me about material data, formulas, processes, and standards."
      : "你好！我是复材 AI，可以帮你查询材料数据、推荐配方、解答工艺问题、查找标准。";

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={t("pageTitle")}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a8 8 0 0 1 8 8c0 3.3-2 6.2-5 7.5V20a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2.5C6 16.2 4 13.3 4 10a8 8 0 0 1 8-8z" />
            <line x1="10" y1="14" x2="10" y2="14.01" />
            <line x1="14" y1="14" x2="14" y2="14.01" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl sm:w-[420px]">
          <div className="flex items-center gap-2 border-b bg-foreground px-4 py-3 text-background">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/20 text-xs font-bold">
              AI
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t("pageTitle")}</div>
              <div className="text-[10px] opacity-70">{ts("tagline")}</div>
            </div>
            <Badge variant="secondary" className="text-[9px]">
              Beta
            </Badge>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  {welcome}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {m.role === "assistant" ? (
                    <AiMessage content={getMessageText(m)} />
                  ) : (
                    getMessageText(m)
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("thinking")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                disabled={busy || !input.trim()}
                className="shrink-0"
                onClick={() => send()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
