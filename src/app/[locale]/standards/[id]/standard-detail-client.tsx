"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AiMessage } from "@/components/ai-message";
import { AuthRequiredNotice } from "@/components/auth-required-notice";
import { getMessageText } from "@/lib/ai/utils";

type Section = {
  id: string;
  chapterNo: string;
  title: string;
  body: string;
  keyPoints: string[];
};

type StandardPayload = {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  country: string;
  countryCode: string;
  category: string;
  process: string[];
  year: string;
  status: string;
  description: string;
  sections: Section[];
};

export function StandardDetailClient({
  standard,
}: {
  standard: StandardPayload;
}) {
  const t = useTranslations("Standards");
  const [activeId, setActiveId] = useState<string | null>(
    standard.sections[0]?.id ?? null
  );

  const active = useMemo(
    () => standard.sections.find((s) => s.id === activeId) ?? null,
    [activeId, standard.sections]
  );

  const quickPrompts = [
    t("detail.quickPrompt1"),
    t("detail.quickPrompt2"),
    t("detail.quickPrompt3"),
    t("detail.quickPrompt4"),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <StandardHeader standard={standard} />
        <div className="mt-4 space-y-1 rounded-md border bg-muted/20 p-2">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            {t("detail.tocTitle")}
          </div>
          {standard.sections.length === 0 && (
            <div className="px-2 py-4 text-xs text-muted-foreground">
              {t("detail.tocEmpty")}
            </div>
          )}
          {standard.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                activeId === s.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">
                {s.chapterNo}
              </span>
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 space-y-6">
        {active ? (
          <SectionView section={active} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t("detail.noSection")}
            </CardContent>
          </Card>
        )}

        <AiDock
          standard={standard}
          active={active}
          quickPrompts={quickPrompts}
          key={active?.id ?? "no-section"}
        />
      </main>
    </div>
  );
}

function StandardHeader({ standard }: { standard: StandardPayload }) {
  const locale = useLocale();
  const isEn = locale === "en";
  const statusLabel = isEn
    ? standard.status === "现行"
      ? "Active"
      : standard.status === "废止"
        ? "Withdrawn"
        : standard.status === "即将实施"
          ? "Upcoming"
          : standard.status
    : standard.status;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="font-mono text-xs font-semibold text-primary">
          {standard.code}
        </div>
        <h1 className="text-base font-bold leading-snug">
          {isEn && standard.titleEn ? standard.titleEn : standard.title}
        </h1>
        {standard.titleEn && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            {isEn ? standard.title : standard.titleEn}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {standard.country && (
            <Badge variant="secondary" className="text-[10px]">
              {standard.country}
            </Badge>
          )}
          {standard.year && (
            <Badge variant="outline" className="text-[10px]">
              {standard.year}
            </Badge>
          )}
          <Badge
            variant={standard.status === "现行" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {statusLabel}
          </Badge>
        </div>
        {standard.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {standard.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SectionView({ section }: { section: Section }) {
  const t = useTranslations("Standards");
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <div className="font-mono text-xs text-muted-foreground">
            {t("detail.chapter", { no: section.chapterNo })}
          </div>
          <h2 className="mt-1 text-xl font-bold">{section.title}</h2>
        </div>
        <Separator />
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {section.body}
        </div>
        {section.keyPoints.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                {t("detail.keyPoints")}
              </div>
              <ul className="space-y-1.5">
                {section.keyPoints.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AiDock({
  standard,
  active,
  quickPrompts,
}: {
  standard: StandardPayload;
  active: Section | null;
  quickPrompts: string[];
}) {
  const t = useTranslations("Standards");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const context = useMemo(
    () => ({
      standardCode: standard.code,
      standardTitle: standard.title,
      chapterNo: active?.chapterNo,
      chapterTitle: active?.title,
      chapterBody: active
        ? [active.body, ...(active.keyPoints ?? [])].join("\n")
        : undefined,
    }),
    [standard.code, standard.title, active]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ context }),
    }),
  });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || busy) return;
    setInput("");
    await sendMessage({ text: msg });
  }

  const scope = active
    ? t("detail.aiScope", { no: active.chapterNo, title: active.title })
    : t("detail.aiScopeStd", { code: standard.code });

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">{scope}</div>
          <Badge variant="outline" className="text-[10px]">
            {messages.length > 0
              ? t("detail.aiMessages", { count: messages.length })
              : t("detail.aiNotStarted")}
          </Badge>
        </div>

        {messages.length > 0 && (
          <div
            ref={scrollRef}
            className="max-h-80 space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3"
          >
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <div className="mb-1 text-[10px] font-semibold text-muted-foreground">
                  {m.role === "user" ? t("detail.aiYou") : "AI"}
                </div>
                <AiMessage content={getMessageText(m)} />
              </div>
            ))}
            {busy && (
              <div className="text-xs text-muted-foreground">{t("detail.aiThinking")}</div>
            )}
          </div>
        )}

        <AuthRequiredNotice error={error} />

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((p) => (
              <Badge
                key={p}
                variant="outline"
                className="cursor-pointer px-2 py-1 text-[11px] font-normal hover:border-primary"
                onClick={() => send(p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              active
                ? t("detail.inputPlaceholder", { no: active.chapterNo })
                : t("detail.inputPlaceholderStd", { code: standard.code })
            }
            rows={2}
            className="resize-none text-sm"
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()}>
            {t("detail.send")}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {t("detail.disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}
