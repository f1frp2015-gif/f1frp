"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LanguageSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "full";
}) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("LanguageSwitcher");

  // Routes that only exist on /en/** — switching to zh on these would 404,
  // so fall back to the home page instead.
  const EN_ONLY_PREFIXES = ["/source-from-china"];

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    const target =
      next !== "en" && EN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
        ? "/"
        : pathname;
    startTransition(() => {
      router.replace(target, { locale: next });
    });
  };

  if (variant === "full") {
    return (
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-muted-foreground" />
        {routing.locales.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => handleChange(code)}
            disabled={isPending}
            className={[
              "rounded px-2 py-1 text-[12px] transition-colors",
              code === locale
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t(code)}
          </button>
        ))}
      </div>
    );
  }

  // compact: single toggle between the two locales
  const other = routing.locales.find((l) => l !== locale) ?? locale;

  return (
    <button
      type="button"
      onClick={() => handleChange(other as Locale)}
      disabled={isPending}
      aria-label={t("label")}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <Globe size={14} />
      <span className="font-mono uppercase tracking-wider">
        {other === "zh" ? "中" : "EN"}
      </span>
    </button>
  );
}
