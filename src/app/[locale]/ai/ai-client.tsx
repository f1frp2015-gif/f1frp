"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { getMessageText } from "@/lib/ai/utils";
import { AiMessage, type Citation } from "@/components/ai-message";
import { SourceCards } from "@/components/ai-source-cards";
import { AiFollowups } from "@/components/ai-followups";
import { AuthRequiredNotice } from "@/components/auth-required-notice";
import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import {
  ArrowUp,
  Sparkles,
  Copy,
  Check,
  MessagesSquare,
  Plus,
  FlaskConical,
  Search,
  Scale,
  Wrench,
  Layers,
  Lightbulb,
  Telescope,
  ShieldCheck,
  PenLine,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  AI_SKILLS,
  SKILL_CATEGORIES,
  filterSkills,
  type AiSkill,
} from "@/lib/ai/skills";

const SKILL_ICONS: Record<AiSkill["icon"], typeof Sparkles> = {
  flask: FlaskConical,
  search: Search,
  scale: Scale,
  wrench: Wrench,
  layers: Layers,
  lightbulb: Lightbulb,
  telescope: Telescope,
  shield: ShieldCheck,
  pen: PenLine,
};

type UIMsg = {
  id: string;
  role: "user" | "assistant" | "system";
  metadata?: { citations?: Citation[] };
};

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSentRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { locale },
      }),
    [locale],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

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

  // 选中技能 → 模板填入输入框,聚焦让用户补全 【____】 占位再发送。
  function pickSkill(skill: AiSkill) {
    setInput(skill.template[locale]);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }

  // Slash 菜单:输入以 "/" 开头时,按其后文本过滤技能。
  const slashQuery = input.startsWith("/") ? input.slice(1) : null;
  const slashSkills = slashQuery !== null ? filterSkills(slashQuery, locale) : [];
  const slashOpen = slashQuery !== null && slashSkills.length > 0;

  // 输入条(slash 菜单 + 文本框 + 发送):空状态放标题下方,对话中固定底部。
  const inputBar = (
    <div className="relative">
      {slashOpen && (
        <SlashMenu skills={slashSkills} locale={locale} onPick={pickSkill} />
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="group relative flex items-end gap-2 rounded-2xl border-2 border-border/80 bg-background p-2.5 shadow-sm transition-all focus-within:border-foreground/50"
      >
        <Sparkles
          size={16}
          className="ml-1 mt-2 shrink-0 self-start text-muted-foreground transition-colors group-focus-within:text-foreground"
        />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && slashQuery !== null) {
              setInput("");
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (slashOpen) {
                pickSkill(slashSkills[0]);
              } else {
                send();
              }
            }
          }}
          placeholder={
            isEn
              ? "Ask anything, or type / for skills…"
              : "问任何复材问题,或打 / 选技能…"
          }
          disabled={busy}
          rows={3}
          spellCheck={false}
          autoComplete="off"
          className="max-h-60 min-h-[88px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          aria-label={isEn ? "Send" : "发送"}
          className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full bg-foreground text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </form>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {t("disclaimer")}
      </p>
    </div>
  );

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

      {/* 空状态:输入框在上、技能卡在下(位置对调);对话中:消息流 + 底部输入条 */}
      {!hasMessages ? (
        <div className="flex-1 overflow-y-auto py-6">
          <EmptyHero
            isEn={isEn}
            locale={locale}
            onPick={pickSkill}
            disabled={busy}
            inputBar={inputBar}
          />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
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
            <AuthRequiredNotice error={error} />
          </div>
        </div>
      )}

      {/* 对话中:输入条固定底部(空状态时输入条在上方 hero 里) */}
      {hasMessages && (
        <div className="sticky bottom-0 -mx-4 border-t border-border/60 bg-background/95 px-4 pb-5 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
          {inputBar}
        </div>
      )}
    </div>
  );
}

function EmptyHero({
  isEn,
  locale,
  onPick,
  disabled,
  inputBar,
}: {
  isEn: boolean;
  locale: "zh" | "en";
  onPick: (skill: AiSkill) => void;
  disabled: boolean;
  inputBar: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center pt-8 pb-16 sm:pt-12">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
        <Sparkles size={20} />
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
        {isEn ? "Ask anything about composites." : "问关于复合材料的任何问题。"}
      </h1>
      <p className="mt-3 max-w-xl text-center text-[14px] leading-relaxed text-muted-foreground">
        {isEn
          ? "Type your question or pick a skill below. Every answer is grounded in the library and cited."
          : "直接提问,或选下方一个技能。每条结论都基于复材站库并附引用。"}
      </p>
      {/* 对话框(上) */}
      <div className="mt-6 w-full">{inputBar}</div>
      {/* 技能卡(下) */}
      <div className="mt-8 w-full space-y-6">
        {SKILL_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {cat.label[locale]}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {AI_SKILLS.filter((s) => s.category === cat.id).map((skill) => {
                const Icon = SKILL_ICONS[skill.icon];
                return (
                  <button
                    key={skill.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(skill)}
                    className="group flex items-start gap-2.5 rounded-lg border border-border/60 bg-background p-3 text-left transition-colors hover:border-foreground/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon
                      size={15}
                      className="mt-0.5 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium leading-snug">
                        {skill.label[locale]}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                        {skill.desc[locale]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlashMenu({
  skills,
  locale,
  onPick,
}: {
  skills: AiSkill[];
  locale: "zh" | "en";
  onPick: (skill: AiSkill) => void;
}) {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-background p-1.5 shadow-lg">
      <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {locale === "en" ? "Skills" : "技能"}
      </div>
      {skills.map((skill) => {
        const Icon = SKILL_ICONS[skill.icon];
        const cat = SKILL_CATEGORIES.find((c) => c.id === skill.category);
        return (
          <button
            key={skill.id}
            type="button"
            // mousedown + preventDefault: 选中时不让 textarea 失焦
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(skill);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
          >
            <Icon size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{skill.label[locale]}</span>
                <span className="rounded bg-muted px-1 py-px text-[9px] text-muted-foreground">
                  {cat?.label[locale]}
                </span>
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                {skill.desc[locale]}
              </span>
            </span>
          </button>
        );
      })}
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

            {supplierHits.length > 0 && (
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
                  ? `Send these ${supplierHits.length} as RFQ`
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
