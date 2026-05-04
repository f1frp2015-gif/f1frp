"use client";

import {
  FileBadge,
  BookOpen,
  ShieldCheck,
  Building2,
  Database,
  FlaskConical,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import type { Citation } from "@/components/ai-message";

const TYPE_META: Record<
  string,
  { label: string; Icon: typeof FileBadge; tone: string }
> = {
  standard: {
    label: "Standard",
    Icon: FileBadge,
    tone: "border-blue-200 bg-blue-50/60 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  },
  paper: {
    label: "Paper",
    Icon: BookOpen,
    tone: "border-purple-200 bg-purple-50/60 text-purple-900 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200",
  },
  patent: {
    label: "Patent",
    Icon: ShieldCheck,
    tone: "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  supplier: {
    label: "Supplier",
    Icon: Building2,
    tone: "border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  material: {
    label: "Material",
    Icon: Database,
    tone: "border-cyan-200 bg-cyan-50/60 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200",
  },
  formula: {
    label: "Formula",
    Icon: FlaskConical,
    tone: "border-rose-200 bg-rose-50/60 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  },
  article: {
    label: "Article",
    Icon: Newspaper,
    tone: "border-slate-200 bg-slate-50/60 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
  },
};

const FALLBACK = {
  label: "Source",
  Icon: ExternalLink,
  tone: "border-border bg-background",
};

/**
 * Perplexity-style source cards rendered above an AI answer. Each retrieved
 * citation gets a numbered, type-coded card so the engineer can scan the
 * provenance before reading the synthesis. The numeric badge corresponds to
 * the inline `[N]` markers parsed by AiMessage.
 */
export function SourceCards({
  citations,
  label = "Sources",
}: {
  citations: Citation[];
  label?: string;
}) {
  if (!citations?.length) return null;
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span>
          {label} · {citations.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {citations.map((c) => {
          const meta = TYPE_META[c.sourceType ?? ""] ?? FALLBACK;
          const I = meta.Icon;
          const Wrapper = c.url
            ? ({ children }: { children: React.ReactNode }) => (
                <a
                  href={c.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  {children}
                </a>
              )
            : ({ children }: { children: React.ReactNode }) => (
                <div className="block">{children}</div>
              );
          return (
            <Wrapper key={c.n}>
              <div
                className={`relative flex h-full flex-col gap-2 rounded-lg border p-3 transition-colors ${meta.tone} ${
                  c.url ? "hover:border-foreground/40" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/30 bg-background/40 font-mono text-[10px]">
                    {c.n}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] opacity-70">
                    <I size={11} strokeWidth={1.7} />
                    {meta.label}
                  </div>
                </div>
                <div className="line-clamp-3 text-[12px] font-medium leading-snug">
                  {c.title}
                </div>
                {c.url && (
                  <ExternalLink
                    size={11}
                    className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-60"
                  />
                )}
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
