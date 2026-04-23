import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Shared VI: outlined rectangle, mono corner label, icon, numbered title,
// soft body copy. `accent` flips it to dark bg / light text for emphasis.

export function PlatformCard({
  Icon,
  monoLabel,
  number,
  title,
  children,
  accent,
  className = "",
}: {
  Icon: LucideIcon;
  monoLabel: string;
  number?: string | number;
  title: string;
  children: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative flex flex-col gap-6 p-6 sm:p-8",
        accent ? "bg-foreground text-background" : "bg-background",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <Icon
          size={24}
          strokeWidth={1.5}
          className={accent ? "text-background" : "text-foreground"}
        />
        <span
          className={[
            "font-mono text-[10px] uppercase tracking-[0.18em]",
            accent ? "text-background/70" : "text-muted-foreground",
          ].join(" ")}
        >
          {monoLabel}
        </span>
      </div>
      <div>
        <div
          className={[
            "text-base font-semibold tracking-tight sm:text-lg",
            accent ? "text-background" : "text-foreground",
          ].join(" ")}
        >
          {number != null ? `${typeof number === "number" ? numToCircle(number) : number} ` : ""}
          {title}
        </div>
        <div
          className={[
            "mt-3 space-y-2 text-sm leading-relaxed",
            accent ? "text-background/85" : "text-muted-foreground",
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function numToCircle(n: number): string {
  const circles = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return circles[n - 1] ?? `${n}.`;
}

export function PlatformCardGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const cls =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-3";
  return (
    <div className={`grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 ${cls}`}>
      {children}
    </div>
  );
}

export function PlatformHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-12 sm:mb-16">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

export function PlatformSectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-border/70 pb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
      </div>
    </div>
  );
}
