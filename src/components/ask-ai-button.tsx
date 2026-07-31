import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * "Ask AI about this" — a contextual jump from any data detail page into the
 * AI assistant with a pre-filled prompt. The AI page auto-sends the query on
 * mount (see /ai/ai-client.tsx), so the user lands directly in a streaming
 * answer instead of a blank chat.
 *
 * Usage:
 *   <AskAiButton prompt={`Compare ${material.name} against equivalent grades from Hexcel and Toray.`} />
 *
 * Variant `inline` renders as a chip (good for hero / heading rows);
 * `block` renders as a full-width primary action (good for sidebar slots).
 */
export function AskAiButton({
  prompt,
  variant = "inline",
  label,
}: {
  prompt: string;
  variant?: "inline" | "block";
  label?: string;
}) {
  const text = label ?? "Ask AI about this";
  const href = { pathname: "/ai/chat" as const, query: { q: prompt } };

  if (variant === "block") {
    return (
      <Link
        href={href as never}
        className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-4 transition-all hover:border-foreground/40 hover:shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles
            size={16}
            className="text-muted-foreground transition-colors group-hover:text-foreground"
          />
          <div>
            <div className="text-[13px] font-semibold tracking-tight">
              {text}
            </div>
            <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {prompt}
            </div>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href as never}
      className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground"
    >
      <Sparkles size={12} />
      {text}
    </Link>
  );
}
