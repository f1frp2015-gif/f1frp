"use client";

import { useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const NAV_KEYS = [
  "materials",
  "formulas",
  "standards",
  "papers",
  "patents",
  "suppliers",
  "tech",
  "downloads",
  "articles",
  "ai",
] as const;

type NavKey = (typeof NAV_KEYS)[number];

const NAV_HREFS: Record<NavKey, string> = {
  materials: "/materials",
  formulas: "/formulas",
  standards: "/standards",
  papers: "/papers",
  patents: "/patents",
  suppliers: "/suppliers",
  tech: "/tech",
  downloads: "/downloads",
  articles: "/articles",
  ai: "/ai",
};

function AuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();
  const t = useTranslations("Nav");
  if (!isLoaded) return <div className="h-8 w-16" aria-hidden />;
  if (isSignedIn) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            {t("dashboard")}
          </Button>
        </Link>
        <UserButton />
      </>
    );
  }
  return (
    <>
      <Link href="/sign-in">
        <Button variant="ghost" size="sm">
          {t("signIn")}
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm">{t("signUp")}</Button>
      </Link>
    </>
  );
}

function MobileAuthButtons({ onClose }: { onClose: () => void }) {
  const { isSignedIn, isLoaded } = useAuth();
  const t = useTranslations("Nav");
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <Link href="/dashboard" onClick={onClose}>
        <Button variant="outline" className="w-full text-xs">
          {t("dashboard")}
        </Button>
      </Link>
    );
  }
  return (
    <Link href="/sign-in" onClick={onClose}>
      <Button className="w-full text-xs">{t("signInOrUp")}</Button>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const locale = useLocale();
  const showSourcing = locale === "en";
  const showOverseas = locale === "zh";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-px md:flex">
          {NAV_KEYS.map((key) => {
            const href = NAV_HREFS[key];
            const active = isActive(href);
            const isAi = key === "ai";
            return (
              <Link
                key={key}
                href={href}
                className={[
                  "relative px-2.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  isAi && !active ? "font-medium text-foreground" : "",
                ].join(" ")}
              >
                {t(key)}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
                )}
              </Link>
            );
          })}
          {showSourcing && (
            <Link
              href={"/source-from-china" as never}
              className={[
                "relative px-2.5 py-1.5 text-[13px] transition-colors",
                isActive("/source-from-china")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                "font-medium",
              ].join(" ")}
            >
              Source from China
              {isActive("/source-from-china") && (
                <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
              )}
            </Link>
          )}
          {showOverseas && (
            <Link
              href={"/overseas" as never}
              className={[
                "relative px-2.5 py-1.5 text-[13px] transition-colors",
                isActive("/overseas")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                "font-medium",
              ].join(" ")}
            >
              出海
              {isActive("/overseas") && (
                <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
              )}
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <AuthButtons />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <nav className="flex flex-col p-4 pt-12">
              {NAV_KEYS.map((key) => (
                <Link
                  key={key}
                  href={NAV_HREFS[key]}
                  onClick={() => setOpen(false)}
                  className="border-b py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(key)}
                </Link>
              ))}
              {showSourcing && (
                <Link
                  href={"/source-from-china" as never}
                  onClick={() => setOpen(false)}
                  className="border-b py-3 text-sm font-medium text-foreground transition-colors hover:text-foreground"
                >
                  Source from China
                </Link>
              )}
              {showOverseas && (
                <Link
                  href={"/overseas" as never}
                  onClick={() => setOpen(false)}
                  className="border-b py-3 text-sm font-medium text-foreground transition-colors hover:text-foreground"
                >
                  出海
                </Link>
              )}
              <div className="mt-4 border-b pb-3">
                <LanguageSwitcher variant="full" />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <MobileAuthButtons onClose={() => setOpen(false)} />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
