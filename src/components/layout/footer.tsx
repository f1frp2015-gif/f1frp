import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { CONTACT, CONTACT_TECH } from "@/lib/contact";

export async function Footer() {
  const t = await getTranslations("Footer");
  const tn = await getTranslations("Nav");

  const columns = [
    {
      title: t("product"),
      links: [
        { label: tn("materials"), href: "/materials" as const },
        { label: tn("formulas"), href: "/formulas" as const },
        { label: tn("standards"), href: "/standards" as const },
        { label: tn("papers"), href: "/papers" as const },
        { label: tn("patents"), href: "/patents" as const },
      ],
    },
    {
      title: t("resources"),
      links: [
        { label: tn("ai"), href: "/ai" as const },
        { label: tn("suppliers"), href: "/suppliers" as const },
        { label: tn("downloads"), href: "/downloads" as const },
        { label: tn("articles"), href: "/articles" as const },
      ],
    },
    {
      title: t("about"),
      links: [{ label: t("about"), href: "/about" as const }],
    },
  ];

  return (
    <footer className="mt-20 border-t border-border/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("contact")}
            </h4>
            <div className="mt-4 space-y-4 text-[13px] text-muted-foreground">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t("bizLabel")}
                </p>
                <p className="font-medium text-foreground">{CONTACT.name}</p>
                <p>
                  <a
                    href={`tel:+86${CONTACT.phoneRaw}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {CONTACT.phone}
                  </a>
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
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t("techLabel")}
                </p>
                <p>
                  <a
                    href={`mailto:${CONTACT_TECH.email}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {CONTACT_TECH.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/80 pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
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
          </div>
          {t("signature") && (
            <div className="font-mono">{t("signature")}</div>
          )}
        </div>
      </div>
    </footer>
  );
}
