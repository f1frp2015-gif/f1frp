"use client";

import { useState, type ReactNode } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { CONTACT } from "@/lib/contact";

// 移动端折叠分组(桌面常显):标题是按钮 — 手机点开/收起,桌面 md:pointer-events-none
// + md:block 强制内容常显,所以桌面就是普通分栏。
function FooterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/40 md:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 text-left md:pointer-events-none md:py-0"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </span>
        <ChevronDown
          size={15}
          className={[
            "text-muted-foreground transition-transform md:hidden",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      <div
        className={[open ? "block" : "hidden", "pb-4 md:mt-4 md:block md:pb-0"].join(
          " ",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const t = useTranslations("Footer");
  const tn = useTranslations("Nav");
  const locale = useLocale();
  const isEn = locale === "en";

  // getfrp is a procurement product, so its footer stays deliberately terse:
  // identity, the four high-intent paths, contact and legal. The domestic
  // knowledge platform keeps the fuller grouped footer below.
  if (isEn) {
    return (
      <footer className="border-t border-[#ced9dd] bg-[#f7f9fa]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Logo />
              <span className="hidden h-5 w-px bg-[#d3dde0] sm:block" />
              <p className="max-w-md text-[12px] leading-5 text-[#667983]">
                China&apos;s specialist FRP supply chain — factory matching,
                specification control, QA and export.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-[#425d69]">
              <Link href="/suppliers" className="transition-colors hover:text-[#0b8179]">
                Suppliers
              </Link>
              <Link href="/standards" className="transition-colors hover:text-[#0b8179]">
                Standards
              </Link>
              <Link href="/materials" className="transition-colors hover:text-[#0b8179]">
                Specs &amp; data
              </Link>
              <Link href="/source-from-china" className="transition-colors hover:text-[#0b8179]">
                Sourcing process
              </Link>
              <Link href="/rfq" className="font-semibold text-[#0a736d] transition-colors hover:text-[#095f5a]">
                Submit RFQ →
              </Link>
              <a href={`mailto:${CONTACT.email}`} className="text-[#667983] transition-colors hover:text-[#0b8179]">
                {CONTACT.email}
              </a>
            </nav>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-[#dbe3e6] pt-5 text-[10px] text-[#74858e] sm:flex-row sm:items-center sm:justify-between">
            <span>{t("copyright", { year: new Date().getFullYear() })}</span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-[#0b8179]" />
                Factory identity · MTC · PSI
              </span>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href={"/image-credits" as never} className="hover:text-foreground">
                {t("imageCredits")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const techLinks = [
    { label: tn("materials"), href: "/materials" },
    { label: tn("formulas"), href: "/formulas" },
    { label: tn("standards"), href: "/standards" },
    { label: tn("processes"), href: "/tech" },
    { label: tn("papers"), href: "/papers" },
    { label: tn("patents"), href: "/patents" },
  ];
  const resourceLinks = [
    { label: tn("ai"), href: "/ai" },
    { label: tn("supplyLib"), href: "/suppliers" },
    { label: tn("infoLib"), href: "/articles" },
  ];

  return (
    <footer className="mt-20 border-t border-border/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-4">
          {/* 品牌(常显) */}
          <div className="mb-6 sm:mb-0">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          <FooterSection title={tn("techLib")}>
            <LinkList links={techLinks} />
          </FooterSection>

          <FooterSection title={t("resources")}>
            <LinkList links={resourceLinks} />
          </FooterSection>

          <FooterSection title={t("contact")}>
            <div className="space-y-4 text-[13px] text-muted-foreground">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t("techLabel")}
                </p>
                <p>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {CONTACT.email}
                  </a>
                </p>
              </div>
            </div>
          </FooterSection>
        </div>

        {/* Single merged footer base: one divider. EN compliance line sits
            above the copyright + legal row (was two stacked bordered bands;
            signature retired — empty in both locales). */}
        <div className="mt-10 border-t border-border/80 pt-6">
          <div className="flex flex-col items-start justify-between gap-3 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span>{t("copyright", { year: new Date().getFullYear() })}</span>
              {process.env.NEXT_PUBLIC_ICP_BEIAN && (
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {process.env.NEXT_PUBLIC_ICP_BEIAN}
                </a>
              )}
              <Link href="/about" className="transition-colors hover:text-foreground">
                {t("about")}
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                {t("privacy")}
              </Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                {t("terms")}
              </Link>
              {isEn && (
                <Link
                  href={"/image-credits" as never}
                  className="transition-colors hover:text-foreground"
                >
                  {t("imageCredits")}
                </Link>
              )}
            </div>
            {t("signature") && <div className="font-mono">{t("signature")}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
}
