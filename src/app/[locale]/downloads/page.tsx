import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { Package } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { downloads } from "@/lib/db/schema";
import { tierLabel } from "@/lib/membership";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Downloads" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export const revalidate = 3600;

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Downloads" });

  const typeLabels = t.raw("types") as Record<string, string>;

  const rows = await db
    .select()
    .from(downloads)
    .orderBy(desc(downloads.createdAt));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package size={40} strokeWidth={1.25} className="mx-auto text-muted-foreground/60" />
            <h3 className="mt-4 text-xl font-semibold">{t("emptyTitle")}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              {t("emptySub")}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/dashboard/enterprise" className={buttonVariants()}>
                {t("ctaSupplier")}
              </Link>
              <Link href="/suppliers" className={buttonVariants({ variant: "outline" })}>
                {t("ctaBrowse")}
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                    {typeLabels[d.type] ?? d.type}
                  </Badge>
                </div>
                {d.description && (
                  <CardDescription className="line-clamp-2">
                    {d.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatSize(d.fileSize)}</span>
                  <span>{t("downloadCount", { count: d.downloadCount.toLocaleString() })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/api/downloads/${d.id}` as "/"}
                    className={buttonVariants({ size: "sm" }) + " flex-1"}
                  >
                    {t("download")}
                  </Link>
                  {d.requiredTier !== "free" && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {t("requires", { tier: tierLabel(d.requiredTier) })}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-lg border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-bold">{t("supplierCtaTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("supplierCtaSub")}</p>
        <Link href="/dashboard/enterprise" className={buttonVariants() + " mt-4"}>
          {t("supplierCtaBtn")}
        </Link>
      </div>
    </div>
  );
}
