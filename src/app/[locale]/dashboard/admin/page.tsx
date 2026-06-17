import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  enterprises,
  supplierClaims,
  supplierDocuments,
  users,
} from "@/lib/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("adminOverview.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const gate = await gateAdmin();
  if (!gate.ok) {
    if (gate.status === 401) redirect("/sign-in?redirect_url=/dashboard/admin");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">{t("adminOverview.noPermission")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adminOverview.noPermissionSub")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const [
    [{ c: individualUsers }],
    [{ c: totalUsers }],
    [{ c: approvedClaims }],
    [{ c: pendingClaims }],
    [{ c: verifiedEnterprises }],
    [{ c: qualNeedsReview }],
    [{ c: qualTotal }],
  ] = await Promise.all([
    db.select({ c: count() }).from(users).where(eq(users.role, "individual")),
    db.select({ c: count() }).from(users),
    db.select({ c: count() }).from(supplierClaims).where(eq(supplierClaims.status, "approved")),
    db.select({ c: count() }).from(supplierClaims).where(eq(supplierClaims.status, "pending")),
    db.select({ c: count() }).from(enterprises).where(eq(enterprises.status, "verified")),
    db.select({ c: count() }).from(supplierDocuments).where(eq(supplierDocuments.status, "needs_review")),
    db.select({ c: count() }).from(supplierDocuments),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("adminOverview.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminOverview.subtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("adminOverview.sectionUsers")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t("adminOverview.statIndividuals")} value={individualUsers} />
          <Stat label={t("adminOverview.statTotalUsers")} value={totalUsers} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("adminOverview.sectionClaims")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t("adminOverview.statApprovedClaims")} value={approvedClaims} />
          <Stat
            label={t("adminOverview.statPendingClaims")}
            value={pendingClaims}
            href="/dashboard/admin/claims?status=pending"
            highlight={pendingClaims > 0}
          />
          <Stat label={t("adminOverview.statVerifiedEnterprises")} value={verifiedEnterprises} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("adminOverview.sectionQual")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t("adminOverview.statQualReview")}
            value={qualNeedsReview}
            href="/dashboard/admin/qualifications?status=needs_review"
            highlight={qualNeedsReview > 0}
          />
          <Stat label={t("adminOverview.statQualTotal")} value={qualTotal} />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <Card className={highlight ? "border-primary/50" : undefined}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-bold ${highlight ? "text-primary" : ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {inner}
    </Link>
  ) : (
    inner
  );
}
