import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { priceReports } from "@/lib/db/schema";
import { getLatestPublishedReport } from "@/lib/prices/queries";

import {
  AdminPricesManager,
  type AdminPriceReport,
} from "./admin-prices-manager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("adminPrices.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminPricesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const gate = await gateAdmin();
  if (!gate.ok) {
    if (gate.status === 401) redirect("/sign-in?redirect_url=/dashboard/admin/prices");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">{t("adminPrices.noPermission")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adminPrices.noPermissionSub")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const rows = await db
    .select()
    .from(priceReports)
    .orderBy(desc(priceReports.createdAt))
    .limit(30);

  const reports: AdminPriceReport[] = rows.map((r) => ({
    id: r.id,
    weekOf: r.weekOf,
    title: r.title ?? "",
    summary: r.summary ?? "",
    status: r.status,
    generatedBy: r.generatedBy ?? "",
    publishedAt: r.publishedAt?.toISOString() ?? null,
    quotes: r.quotes ?? [],
    sources: r.sources ?? [],
  }));

  // 最新已发布一期 → 名称到价格的基线,供编辑器「对上期自动算环比」
  const basePub = await getLatestPublishedReport();
  const baseline: Record<string, number> = {};
  for (const q of basePub?.quotes ?? []) baseline[q.name] = q.price;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminPrices.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminPrices.subtitle")}</p>
      </div>
      <AdminPricesManager reports={reports} baseline={baseline} />
    </div>
  );
}
