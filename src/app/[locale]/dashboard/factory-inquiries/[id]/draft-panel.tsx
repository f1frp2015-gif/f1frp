"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Inquiry {
  originalText: string;
  originalSubject: string | null;
  buyerName: string | null;
  buyerCompany: string | null;
  buyerCountry: string | null;
}

const TONES = [
  { id: "neutral" as const, label: "中性" },
  { id: "formal" as const, label: "正式" },
  { id: "friendly" as const, label: "友好" },
];

export function InquiryDraftPanel({ inquiry }: { inquiry: Inquiry }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tone, setTone] = useState<"neutral" | "formal" | "friendly">("neutral");
  const [copied, setCopied] = useState(false);
  const [factoryProfile, setFactoryProfile] = useState("");

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError("");
    setDraft("");
    setCopied(false);

    try {
      const res = await fetch("/api/agent/draft-reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalText: inquiry.originalText,
          originalSubject: inquiry.originalSubject ?? undefined,
          buyerName: inquiry.buyerName ?? undefined,
          buyerCompany: inquiry.buyerCompany ?? undefined,
          buyerCountry: inquiry.buyerCountry ?? undefined,
          tone,
          factoryProfile: factoryProfile.trim() || undefined,
        }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accum = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accum += decoder.decode(value, { stream: true });
        setDraft(accum);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "草拟失败");
    } finally {
      setBusy(false);
    }
  }

  async function copyAll() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败,请手动选中文本复制");
    }
  }

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="rounded-xl border border-border/70 bg-background p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            回复语气
          </span>
          {TONES.map((t) => (
            <label
              key={t.id}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                tone === t.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/70 bg-background hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="tone"
                checked={tone === t.id}
                onChange={() => setTone(t.id)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
        <details className="group">
          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
            可选:输入工厂背景资料让 AI 草拟更精准 (产品 / 工艺 / 认证 / 主营市场)
          </summary>
          <textarea
            value={factoryProfile}
            onChange={(e) => setFactoryProfile(e.target.value)}
            placeholder="例:江苏南通工厂,主营 FRP 拉挤型材(I-beam / Channel / Square Tube),持 ISO 9001 + EN 13706,年产能 8000 吨,主要市场美国 + 欧洲..."
            rows={3}
            className="mt-2 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
          />
        </details>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              AI 草拟中…
            </>
          ) : draft ? (
            <>
              <RefreshCw size={14} />
              重新草拟
            </>
          ) : (
            <>
              <Sparkles size={14} />
              AI 草拟回复
            </>
          )}
        </button>
        {draft && (
          <button
            type="button"
            onClick={copyAll}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {copied ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-600" />
                已复制
              </>
            ) : (
              <>
                <Copy size={13} />
                复制全文
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-[12.5px] text-destructive">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editable draft surface */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={
          busy
            ? "AI 正在草拟回复 — 文本会实时流入这里..."
            : "点上方「AI 草拟回复」开始。生成后可在此直接编辑,然后复制粘贴到你工厂邮箱发送。"
        }
        rows={24}
        className="w-full rounded-xl border border-border/70 bg-background p-5 text-[13px] leading-relaxed placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
      />

      <p className="text-[11px] text-muted-foreground">
        Phase 2 接 IMAP/Gmail 自动收邮件 + 编辑距离统计 + 「一键发送」按钮。
        当前 MVP 阶段:复制粘贴到工厂邮箱发送即可。
      </p>
    </div>
  );
}
