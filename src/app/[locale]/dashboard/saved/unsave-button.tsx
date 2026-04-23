"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function UnsaveButton({
  sourceType,
  sourceId,
}: {
  sourceType: string;
  sourceId: string;
}) {
  const t = useTranslations("Save");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  function onClick() {
    if (pending || hidden) return;
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/dashboard/saved?sourceType=${encodeURIComponent(sourceType)}&sourceId=${encodeURIComponent(sourceId)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setHidden(true);
          router.refresh();
        }
      } catch {
        // swallow — next click retries
      }
    });
  }

  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={t("unsave")}
      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      title={t("unsave")}
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <X size={14} />
      )}
    </button>
  );
}
