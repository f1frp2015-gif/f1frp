"use client";

import { useTranslations } from "next-intl";

export function LogoMark({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  // Three laminate plies at varying weights — reads as "composite layup"
  // Sharp square with 4px radius for Linear/Vercel-style precision.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="3"
        className="fill-foreground"
      />
      <rect x="5" y="7" width="14" height="2" rx="1" className="fill-background" />
      <rect
        x="5"
        y="11"
        width="14"
        height="2"
        rx="1"
        className="fill-background/80"
      />
      <rect
        x="5"
        y="15"
        width="14"
        height="2"
        rx="1"
        className="fill-background/55"
      />
    </svg>
  );
}

export function Logo() {
  const t = useTranslations("Site");
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[14px] font-semibold tracking-tight">{t("name")}</span>
      <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
        f1frp
      </span>
    </div>
  );
}
