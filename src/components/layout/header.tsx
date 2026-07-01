"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

// 顶部导航(2026-06 简化):供应库 · 技术库▾ · 资讯库 · AI▾ · 出海
//   供应库 = 供应商目录;技术库 = 全部技术知识库(材料/配方/标准/工艺/论文/专利);
//   资讯库 = 行业资讯。下载、工厂 AI 助手已下线。

type NavDropdownItem = { href: string; label: string; isNew?: boolean };

function userInitial(user: { name: string | null; phone: string | null; email: string | null }): string {
  if (user.name?.trim()) return user.name.trim()[0].toUpperCase();
  if (user.email?.trim()) return user.email.trim()[0].toUpperCase();
  if (user.phone) return user.phone.slice(-2, -1) || "U";
  return "U";
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
        <Link href="/dashboard/profile" title={user.name ?? user.email ?? user.phone ?? ""}>
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
              {userInitial(user)}
            </span>
          )}
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

// 桌面端 hover/focus 下拉(技术库、AI 共用)。href 有值则触发器是链接,否则是纯菜单按钮。
function NavDropdown({
  label,
  href,
  items,
  active,
  pathname,
}: {
  label: string;
  href?: string;
  items: NavDropdownItem[];
  active: boolean;
  pathname: string;
}) {
  const triggerClass = [
    "relative flex items-center gap-0.5 px-2.5 py-1.5 text-[13px] font-medium transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
  ].join(" ");
  const chevron = (
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
  );
  const underline = active ? (
    <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
  ) : null;

  return (
    <div className="group relative">
      {href ? (
        <Link href={href} aria-haspopup="menu" className={triggerClass}>
          {label}
          {chevron}
          {underline}
        </Link>
      ) : (
        <button type="button" aria-haspopup="menu" className={triggerClass}>
          {label}
          {chevron}
          {underline}
        </button>
      )}
      <div className="invisible absolute left-0 top-full z-50 min-w-[176px] pt-2 opacity-0 transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-lg border border-border bg-background p-1 shadow-lg">
          {items.map((item) => {
            const itemActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  itemActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <span>{item.label}</span>
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
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const locale = useLocale();
  const showSourcing = locale === "en";
  const showOverseas = locale === "zh";
  // 认证两侧启用:getfrp（en）邮箱 OTP,f1frp.com（zh）手机号 / 微信。
  const showAuth = true;
  // 供应库（工厂目录）仅国内 f1frp.com 展示；getfrp.com（en）海外侧不在导航暴露具体供应商，避免去中介化
  const showSupplyLib = locale !== "en";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // 技术库 = 全部技术知识库;AI = AI 助手 + AI 报价(工厂助手已下线)
  const techItems: NavDropdownItem[] = [
    { href: "/materials", label: t("materials") },
    { href: "/formulas", label: t("formulas") },
    { href: "/standards", label: t("standards") },
    { href: "/tech", label: t("processes") },
    { href: "/papers", label: t("papers") },
    { href: "/patents", label: t("patents") },
  ];
  const aiItems: NavDropdownItem[] = [
    { href: "/ai", label: t("aiAssistant") },
    { href: "/pultrusion/quote", label: t("quote"), isNew: true },
    { href: "/tech/calculator", label: t("engCalc"), isNew: true },
    { href: "/tech/u-value-calculator", label: t("windowCalc"), isNew: true },
  ];
  const techActive = techItems.some((it) => isActive(it.href));
  const aiActive = aiItems.some((it) => isActive(it.href));

  const singleLinkClass = (isOn: boolean) =>
    [
      "relative px-2.5 py-1.5 text-[13px] transition-colors",
      isOn ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    ].join(" ");

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
          {/* 资讯库 */}
          <Link href="/articles" className={singleLinkClass(isActive("/articles"))}>
            {t("infoLib")}
            {isActive("/articles") && (
              <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
            )}
          </Link>

          {/* 供应库（仅国内侧；getfrp.com 海外侧隐藏） */}
          {showSupplyLib && (
            <Link href="/suppliers" className={singleLinkClass(isActive("/suppliers"))}>
              {t("supplyLib")}
              {isActive("/suppliers") && (
                <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-foreground" />
              )}
            </Link>
          )}

          {/* 技术库 ▾ */}
          <NavDropdown
            label={t("techLib")}
            items={techItems}
            active={techActive}
            pathname={pathname}
          />

          {/* AI ▾ */}
          <NavDropdown
            label={t("ai")}
            href="/ai"
            items={aiItems}
            active={aiActive}
            pathname={pathname}
          />

          {showSourcing && (
            <Link
              href={"/source-from-china" as never}
              className={[singleLinkClass(isActive("/source-from-china")), "font-medium"].join(" ")}
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
              className={[singleLinkClass(isActive("/overseas")), "font-medium"].join(" ")}
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
              {/* 资讯库 */}
              <Link
                href="/articles"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 border-b py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>{t("infoLib")}</span>
              </Link>

              {/* 供应库（仅国内侧；getfrp.com 海外侧隐藏） */}
              {showSupplyLib && (
                <Link
                  href="/suppliers"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 border-b py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>{t("supplyLib")}</span>
                </Link>
              )}

              {/* 技术库 分组 */}
              <div className="border-b py-2">
                <div className="px-0 py-1 text-xs font-medium text-muted-foreground">
                  {t("techLib")}
                </div>
                <div className="flex flex-col">
                  {techItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="py-2 pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI 分组 */}
              <div className="border-b py-2">
                <div className="px-0 py-1 text-xs font-medium text-muted-foreground">
                  {t("ai")}
                </div>
                <div className="flex flex-col">
                  {aiItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 py-2 pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span>{item.label}</span>
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
