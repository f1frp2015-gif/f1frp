"use client";

import { useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function HomeAiPrompt({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit() {
    const q = value.trim();
    if (!q || submitting) return;
    setSubmitting(true);
    // Forward to the AI page with the pre-filled prompt; that page auto-sends it.
    router.push(
      { pathname: "/ai", query: { q } } as never
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="group mt-10 flex w-full items-center gap-3 rounded-xl border border-border/80 bg-background/80 p-3 shadow-sm backdrop-blur transition-all focus-within:border-foreground/40 focus-within:shadow-md hover:border-foreground/30 hover:shadow-md sm:p-4"
    >
      <Sparkles
        size={16}
        className="shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={submitting}
        autoComplete="off"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        type="submit"
        disabled={submitting || !value.trim()}
        aria-label="Ask AI"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
      >
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
}
