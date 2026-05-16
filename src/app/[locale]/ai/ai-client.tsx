"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { getMessageText } from "@/lib/ai/utils";
import { SHOW_SALES_CONTACT } from "@/lib/contact";
import { AiMessage, type Citation } from "@/components/ai-message";
import { SourceCards } from "@/components/ai-source-cards";
import { AiFollowups } from "@/components/ai-followups";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowUp,
  Sparkles,
  Copy,
  Check,
  MessagesSquare,
  Plus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type UIMsg = {
  id: string;
  role: "user" | "assistant" | "system";
  metadata?: { citations?: Citation[] };
};

const STARTER_EN: ReadonlyArray<string> = [
  "Find a verified Chinese FRP grating supplier with CE marking, MOQ 200 m².",
  "Compare GFRP vs CFRP for a 3 m marine spar — strength, weight, cost.",
  "What CBAM data do I request from a Chinese FRP profile manufacturer?",
  "Which GB standard maps to ASTM D3039 tensile?",
  "Recommend a vinyl ester resin for 30% HCl service at 60 °C.",
  "ISO 9001 + EN 13706 pultrusion suppliers in Jiangsu, ranked by scale.",
];

const STARTER_ZH: ReadonlyArray<string> = [
  "推荐一款耐 30% 盐酸 60℃ 服役的乙烯基酯树脂。",
  "GB/T 1447 与 ASTM D3039 拉伸试验如何对照？",
  "国内 ISO 9001 + EN 13706 拉挤厂家，按规模排序给我 5 家。",
  "为风电叶片选材：玻纤 vs 碳纤的造价与性能对比。",
  "出口欧洲的 FRP 型材需要哪些合规文件（CBAM / REACH / CE）？",
  "真空导入工艺常见的孔隙率超标，怎么排查？",
];

export function AiAssistantClient({
  initialQuery,
}: {
  initialQuery?: string;
}) {
  const t = useTranslations("AI");
  const localeRaw = useLocale();
  const locale: "zh" | "en" = localeRaw === "en" ? "en" : "zh";
  const isEn = locale === "en";

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { locale },
      }),
    [locale],
  );

  const { messages, sendMessage, setMessages, status } = useChat({ transport });

  const busy = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!initialQuery) return;
    if (autoSentRef.current) return;
    autoSentRef.current = true;
    sendMessage({ text: initialQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    await sendMessage({ text: msg });
  }

  function newChat() {
    setMessages([]);
    setInput("");
    autoSentRef.current = false;
  }

  const starters = isEn ? STARTER_EN : STARTER_ZH;

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 sm:px-6">
      {/* Top bar: brand + new-chat */}
      <div className="flex items-center justify-between border-b border-border/40 py-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {isEn ? "getfrp · sourcing assistant" : "复材 AI · 选材与采购助手"}
          </span>
        </div>
        {hasMessages && (
          <button
            type="button"
            onClick={newChat}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus size={11} />
            {isEn ? "New chat" : "新对话"}
          </button>
        )}
      </div>

      {/* Conversation column. Empty state vs. message stream. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
        {!hasMessages ? (
          <EmptyState
            isEn={isEn}
            starters={starters}
            onAsk={(q) => send(q)}
            disabled={busy}
          />
        ) : (
          <div className="space-y-10">
            {messages.map((m, idx) => {
              if (m.role === "user") {
                return (
                  <UserQuery key={m.id} text={getMessageText(m)} />
                );
              }
              if (m.role === "assistant") {
                const meta = (m as UIMsg).metadata;
                const citations = meta?.citations ?? [];
                const text = getMessageText(m);
                // Find the immediately preceding user question for the
                // follow-up call. Walk backwards.
                let prevUser = "";
                for (let i = idx - 1; i >= 0; i--) {
                  if (messages[i].role === "user") {
                    prevUser = getMessageText(messages[i]);
                    break;
                  }
                }
                const isLast = idx === messages.length - 1;
                const streaming = isLast && busy;
                return (
                  <AssistantAnswer
                    key={m.id}
                    id={m.id}
                    text={text}
                    citations={citations}
                    locale={locale}
                    question={prevUser}
                    streaming={streaming}
                    onAsk={(q) => send(q)}
                    disabled={busy}
                  />
                );
              }
              return null;
            })}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <ThinkingIndicator label={t("thinking")} />
            )}
          </div>
        )}
      </div>

      {/* Sticky input bar */}
      <div className="sticky bottom-0 -mx-4 border-t border-border/60 bg-background/95 px-4 pb-5 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="group relative flex items-end gap-2 rounded-2xl border-2 border-border/80 bg-background p-2.5 shadow-sm transition-all focus-within:border-foreground/50"
        >
          <Sparkles
            size={16}
            className="mb-1.5 ml-1 shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground"
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              isEn
                ? "Ask anything about sourcing FRP from China…"
                : "问任何复材选材、配方、标准、供应商问题…"
            }
            disabled={busy}
            rows={1}
            spellCheck={false}
            autoComplete="off"
            className="min-h-[36px] max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label={isEn ? "Send" : "发送"}
            className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  isEn,
  starters,
  onAsk,
  disabled,
}: {
  isEn: boolean;
  starters: ReadonlyArray<string>;
  onAsk: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center pt-12 pb-16 sm:pt-20">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
        <Sparkles size={20} />
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
        {isEn
          ? "Ask anything about sourcing FRP from China."
          : "问关于复合材料的任何问题。"}
      </h1>
      <p className="mt-3 max-w-xl text-center text-[14px] leading-relaxed text-muted-foreground">
        {isEn
          ? "Verified suppliers, ASTM-mapped specs, and CBAM-ready paperwork — in one cited answer."
          : "从材料、配方、标准到国内供应商的统一回答，每条结论都附引用。"}
      </p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onAsk(s)}
            className="group flex items-start gap-2 rounded-lg border border-border/60 bg-background p-3 text-left text-[13px] leading-snug transition-colors hover:border-foreground/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles
              size={13}
              className="mt-1 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
            />
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function UserQuery({ text }: { text: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Question
      </div>
      <h2 className="mt-1.5 text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl">
        {text}
      </h2>
    </div>
  );
}

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <div className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/30"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
      {label}
    </div>
  );
}

function AssistantAnswer({
  id,
  text,
  citations,
  locale,
  question,
  streaming,
  onAsk,
  disabled,
}: {
  id: string;
  text: string;
  citations: Citation[];
  locale: "zh" | "en";
  question: string;
  streaming: boolean;
  onAsk: (q: string) => void;
  disabled: boolean;
}) {
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);

  // Detect supplier intent from retrieved citations — surface a "Send to
  // Doris as RFQ" call to action when the assistant grounded its answer
  // on the supplier directory.
  const supplierHits = useMemo(
    () => citations.filter((c) => c.sourceType === "supplier"),
    [citations],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silent
    }
  }

  return (
    <article>
      {citations.length > 0 && (
        <SourceCards
          citations={citations}
          label={isEn ? "Sources" : "来源"}
        />
      )}

      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles size={11} className="text-foreground/70" />
        {isEn ? "Answer" : "回答"}
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <AiMessage content={text} citations={citations} />
      </div>

      {!streaming && (
        <>
          {/* Action row: copy + supplier-RFQ escalation */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied
                ? isEn
                  ? "Copied"
                  : "已复制"
                : isEn
                  ? "Copy answer"
                  : "复制回答"}
            </button>

            {SHOW_SALES_CONTACT && supplierHits.length > 0 && (
              <a
                href={`mailto:f1frp2015@gmail.com?subject=${encodeURIComponent(
                  isEn
                    ? `RFQ — ${question.slice(0, 80)}`
                    : `询盘 — ${question.slice(0, 80)}`,
                )}&body=${encodeURIComponent(
                  (isEn
                    ? `Hi,\n\nI saw the following suppliers via the getfrp assistant and would like to RFQ them:\n\n${supplierHits
                        .map((s) => `- ${s.title}`)
                        .join("\n")}\n\nMy question was:\n${question}\n\nSpec / volume / target country:\n[fill in]\n\nThanks,`
                    : `你好，\n\n通过 复材 AI 看到以下供应商，想发起询盘：\n\n${supplierHits
                        .map((s) => `- ${s.title}`)
                        .join("\n")}\n\n我的问题：\n${question}\n\n规格 / 数量 / 目标市场：\n[请补充]\n\n谢谢，`),
                )}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1 text-[11px] text-background transition-colors hover:bg-foreground/90"
              >
                <MessagesSquare size={12} />
                {isEn
                  ? `Send these ${supplierHits.length} to sourcing desk as RFQ`
                  : `把这 ${supplierHits.length} 家发给询盘`}
              </a>
            )}

            <Link
              href={"/rfq" as never}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {isEn ? "Structured RFQ" : "结构化询盘"}
            </Link>
          </div>

          {/* Auto-fetched related questions */}
          <AiFollowups
            assistantMessageId={id}
            question={question}
            answer={text}
            locale={locale}
            onAsk={onAsk}
            disabled={disabled}
          />
        </>
      )}
    </article>
  );
}
