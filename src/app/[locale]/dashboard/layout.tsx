import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminUser } from "@/lib/admin";
import { Icon } from "@/components/icon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("metaTitle") };
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // getfrp（en）侧已取消会员/收费体系，海外侧没有 dashboard
  if (locale === "en") notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const baseItems = [
    { href: "/dashboard" as const, label: t("nav.overview"), iconKey: "overview" },
    { href: "/dashboard/saved" as const, label: t("nav.saved"), iconKey: "bookmark" },
    { href: "/dashboard/posts/new" as const, label: t("nav.postNew"), iconKey: "post-new" },
    { href: "/dashboard/posts" as const, label: t("nav.posts"), iconKey: "post-list" },
    { href: "/dashboard/messages" as const, label: t("nav.messages"), iconKey: "messages" },
    { href: "/dashboard/enterprise" as const, label: t("nav.enterprise"), iconKey: "enterprise" },
    { href: "/dashboard/claims" as const, label: t("nav.claims"), iconKey: "claims" },
    { href: "/dashboard/qualifications" as const, label: t("nav.qualifications"), iconKey: "admin-claims" },
  ];

  const adminItems = [
    { href: "/dashboard/admin" as const, label: t("nav.adminOverview"), iconKey: "overview" },
    { href: "/dashboard/admin/users" as const, label: t("nav.adminUsers"), iconKey: "enterprise" },
    { href: "/dashboard/admin/claims" as const, label: t("nav.adminClaims"), iconKey: "admin-claims" },
    { href: "/dashboard/admin/qualifications" as const, label: t("nav.adminQualifications"), iconKey: "admin-claims" },
    { href: "/dashboard/admin/enterprises" as const, label: t("nav.adminEnterprises"), iconKey: "admin-claims" },
    { href: "/dashboard/admin/articles" as const, label: "资讯草稿箱", iconKey: "post-list" },
  ];

  const me = await getCurrentUser();
  const showAdmin = me ? isAdminUser(me) : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <div className="mb-4 px-3">
            <h2 className="text-lg font-bold">{t("sidebarTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("sidebarSub")}</p>
          </div>
          {baseItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon name={item.iconKey} size={15} className="text-muted-foreground" />
              {item.label}
            </Link>
          ))}
          {showAdmin && (
            <>
              <div className="mt-4 px-3 text-[10px] font-semibold uppercase text-muted-foreground">
                {t("adminSection")}
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon name={item.iconKey} size={15} className="text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
