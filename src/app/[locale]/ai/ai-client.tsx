"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { getMessageText } from "@/lib/ai/utils";
import { AiMessage } from "@/components/ai-message";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/icon";

function CitationList({
  citations,
}: {
  citations: Array<{ n: number; title: string; url: string | null }>;
}) {
  const t = useTranslations("AI");
  if (!citations?.length) return null;
  return (
    <div className="mt-3 border-t pt-2">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {t("sourcesLabel", { count: citations.length })}
      </div>
      <ol className="space-y-1">
        {citations.map((c) => (
          <li key={c.n} className="flex items-start gap-1.5 text-[11px] leading-snug">
            <span className="mt-0.5 inline-flex h-4 min-w-[18px] shrink-0 items-center justify-center rounded-sm border border-signal/30 bg-signal/10 px-1 font-mono text-[10px] text-signal">
              {c.n}
            </span>
            {c.url ? (
              <a
                className="text-foreground hover:text-signal hover:underline"
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.title}
              </a>
            ) : (
              <span className="text-foreground">{c.title}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

const SCENARIO_KEYS = [
  { iconKey: "ai-select", key: "select" },
  { iconKey: "ai-formula", key: "formula" },
  { iconKey: "ai-process", key: "process" },
  { iconKey: "ai-standard", key: "standard" },
  { iconKey: "ai-price", key: "price" },
  { iconKey: "ai-supplier", key: "supplier" },
] as const;

export function AiAssistantClient({
  initialQuery,
}: {
  initialQuery?: string;
}) {
  const t = useTranslations("AI");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!initialQuery) return;
    if (autoSentRef.current) return;
    autoSentRef.current = true;
    sendMessage({ text: initialQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || busy) return;
    setInput("");
    await sendMessage({ text: msg });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <Badge variant="secondary" className="mb-3">Beta</Badge>
        <h1 className="text-3xl font-bold">{t("heroTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("heroSubtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col">
          <div ref={scrollRef} className="min-h-[400px] max-h-[600px] flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center py-16">
                <div className="text-center">
                  <Icon name="composite-ai" size={56} className="mx-auto text-foreground" />
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{t("greeting")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("greetingSub")}</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-foreground text-background" : "bg-background border"}`}>
                  {m.role === "assistant" ? (
                    <>
                      <AiMessage
                        content={getMessageText(m)}
                        citations={
                          ((m as { metadata?: { citations?: Array<{ n: number; title: string; url: string | null }> } }).metadata?.citations) ?? []
                        }
                      />
                      <CitationList
                        citations={
                          ((m as { metadata?: { citations?: Array<{ n: number; title: string; url: string | null }> } }).metadata?.citations) ?? []
                        }
                      />
                    </>
                  ) : getMessageText(m)}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-lg border bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" style={{ animationDelay: "300ms" }} />
                    </div>
                    {t("thinking")}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 rounded-md border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button type="button" size="lg" disabled={busy || !input.trim()} className="shrink-0" onClick={() => send()}>
              {t("send")}
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">{t("disclaimer")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("scenariosTitle")}</h3>
          {SCENARIO_KEYS.map((s) => {
            const title = t(`scenarios.${s.key}.title`);
            const prompts = [
              t(`scenarios.${s.key}.p1`),
              t(`scenarios.${s.key}.p2`),
              t(`scenarios.${s.key}.p3`),
            ];
            return (
              <Card key={s.key}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon name={s.iconKey} size={16} className="text-signal" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1">
                  {prompts.map((p) => (
                    <button key={p} onClick={() => send(p)} className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      {p}
                    </button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
