"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth/use-session";
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
};

// 当前阶段无收费,所有导航项中外侧通用 — 留空集合作为未来再分流时的扩展点
const ZH_ONLY_NAV: ReadonlySet<NavKey> = new Set();

// AI 菜单:把 AI 助手 / AI 报价 / AI 工厂助手 统一收进顶部导航的「AI」下拉。
// labelKey → Nav 命名空间的 i18n key;zhOnly 的项(工厂助手)只在国内 zh 侧出现。
type AiItem = {
  key: string;
  href: string;
  labelKey: "aiAssistant" | "quote" | "factoryAi";
  zhOnly?: boolean;
  isNew?: boolean;
};
const AI_MENU: readonly AiItem[] = [
  { key: "ai", href: "/ai", labelKey: "aiAssistant" },
  { key: "quote", href: "/pultrusion/quote", labelKey: "quote", isNew: true },
  { key: "factories", href: "/factories", labelKey: "factoryAi", zhOnly: true },
];

function userInitial(user: { name: string | null; phone: string | null }): string {
  if (user.name?.trim()) return user.name.trim()[0].toUpperCase();
  if (user.phone) return user.phone.slice(-2, -1) || "用";
  return "用";
}

function AuthButtons() {
  const { user, isLoaded, signOut } = useSession();
  const t = useTranslations("Nav");
  if (!isLoaded) return <div className="h-8 w-16" aria-hidden />;
  if (user) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            {t("dashboard")}
          </Button>
        </Link>
        <Link href="/dashboard">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background"
            title={user.name ?? user.phone ?? ""}
          >
            {userInitial(user)}
          </span>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          {t("signOut")}
        </Button>
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
  const { user, isLoaded, signOut } = useSession();
  const t = useTranslations("Nav");
  if (!isLoaded) return null;
  if (user) {
    return (
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" onClick={onClose}>
          <Button variant="outline" className="w-full text-xs">
            {t("dashboard")}
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full text-xs"
          onClick={() => {
            onClose();
            signOut();
          }}
        >
          {t("signOut")}
        </Button>
      </div>
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
  // getfrp（en）侧不再有会员/收费体系：海外买家全程匿名，RFQ 直接走 /rfq + Doris
  const showAuth = locale !== "en";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // AI 下拉的子项(按 locale 过滤掉 zhOnly 的工厂助手)
  const aiItems = AI_MENU.filter((item) => !item.zhOnly || locale === "zh");
  const aiActive = aiItems.some((item) => isActive(item.href));

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
          {NAV_KEYS.filter((k) => locale === "zh" || !ZH_ONLY_NAV.has(k)).map((key) => {
            const href = NAV_HREFS[key];
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                className={[
                  "relative px-2.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t(key)}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
                )}
              </Link>
            );
          })}

          {/* AI 菜单(hover/focus 下拉):AI 助手 / AI 报价 / AI 工厂助手 */}
          <div className="group relative">
            <Link
              href="/ai"
              aria-haspopup="menu"
              className={[
                "relative flex items-center gap-0.5 px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                aiActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t("ai")}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60 transition-transform duration-150 group-hover:rotate-180"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
              {aiActive && (
                <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
              )}
            </Link>
            {/* 面板:pt-2 桥接 trigger 与卡片之间的空隙,避免 hover 断开 */}
            <div className="invisible absolute left-0 top-full z-50 min-w-[176px] pt-2 opacity-0 transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-lg border border-border bg-background p-1 shadow-lg">
                {aiItems.map((item) => {
                  const itemActive = isActive(item.href);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={[
                        "flex items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                        itemActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")}
                    >
                      <span>{t(item.labelKey)}</span>
                      {item.isNew && (
                        <span className="rounded bg-foreground px-1 py-px text-[8px] font-semibold leading-none text-background">
                          NEW
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

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
          {showAuth && <AuthButtons />}
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
              {NAV_KEYS.filter((k) => locale === "zh" || !ZH_ONLY_NAV.has(k)).map((key) => (
                <Link
                  key={key}
                  href={NAV_HREFS[key]}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 border-b py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>{t(key)}</span>
                </Link>
              ))}

              {/* AI 分组 */}
              <div className="border-b py-2">
                <div className="px-0 py-1 text-xs font-medium text-muted-foreground">
                  {t("ai")}
                </div>
                <div className="flex flex-col">
                  {aiItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 py-2 pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span>{t(item.labelKey)}</span>
                      {item.isNew && (
                        <span className="rounded bg-foreground px-1.5 py-0.5 text-[9px] font-semibold leading-none text-background">
                          NEW
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

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
              {showAuth && (
                <div className="mt-6 flex flex-col gap-2">
                  <MobileAuthButtons onClose={() => setOpen(false)} />
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
