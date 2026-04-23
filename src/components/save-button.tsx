"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type SourceType =
  | "material"
  | "formula"
  | "standard"
  | "paper"
  | "patent"
  | "supplier"
  | "article";

// Toggles a saved_items row for the current user. Anonymous users get a
// disabled button that hints them to sign in. No login redirect here —
// keep it lightweight and colocated with the content.

export function SaveButton({
  sourceType,
  sourceId,
  title,
  url,
  initialSaved = false,
  signedIn = true,
  className,
  variant = "outline",
  size = "sm",
}: {
  sourceType: SourceType;
  sourceId: string;
  title: string;
  url?: string;
  initialSaved?: boolean;
  signedIn?: boolean;
  className?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const t = useTranslations("Save");
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (!signedIn || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        if (!saved) {
          const res = await fetch("/api/dashboard/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceType, sourceId, title, url }),
          });
          if (!res.ok) throw new Error((await res.json()).error ?? "fail");
          setSaved(true);
        } else {
          const res = await fetch(
            `/api/dashboard/saved?sourceType=${encodeURIComponent(sourceType)}&sourceId=${encodeURIComponent(sourceId)}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error((await res.json()).error ?? "fail");
          setSaved(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const disabled = !signedIn || pending;
  const label = !signedIn
    ? t("signInFirst")
    : saved
      ? t("saved")
      : t("save");
  const Icon = pending ? Loader2 : saved ? BookmarkCheck : Bookmark;

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={toggle}
        aria-pressed={saved}
        title={!signedIn ? t("signInFirst") : undefined}
        className="gap-1.5"
      >
        <Icon size={14} className={pending ? "animate-spin" : ""} />
        {label}
      </Button>
      {error && (
        <p className="mt-1 text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}
