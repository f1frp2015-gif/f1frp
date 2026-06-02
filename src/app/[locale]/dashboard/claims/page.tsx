import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { supplierClaims, supplierListings } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("claimsPage.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function ClaimsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const STATUS_COLOR: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
    pending: "outline",
    approved: "default",
    rejected: "destructive",
    withdrawn: "secondary",
  };

  const me = await getCurrentUser();
  if (!me) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {t("claimsPage.loginRequired")}
        </CardContent>
      </Card>
    );
  }

  const rows = await db
    .select({
      claim: supplierClaims,
      supplier: supplierListings,
    })
    .from(supplierClaims)
    .leftJoin(supplierListings, eq(supplierClaims.supplierListingId, supplierListings.id))
    .where(eq(supplierClaims.userId, me.id))
    .orderBy(desc(supplierClaims.createdAt));

  const statusLabels = t.raw("claimsPage.status") as Record<string, string>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("claimsPage.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("claimsPage.subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-3xl">🏢</div>
            <h3 className="mt-3 font-semibold">{t("claimsPage.noClaimsTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.rich("claimsPage.noClaimsSub", {
                link: (chunks) => (
                  <Link href="/suppliers" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ claim, supplier }) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {supplier?.name ?? t("claimsPage.supplierDeleted")}
                    </CardTitle>
                    <CardDescription>
                      {t("claimsPage.submittedAt", {
                        date: claim.createdAt.toISOString().slice(0, 10),
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_COLOR[claim.status] ?? "outline"}>
                    {statusLabels[claim.status] ?? claim.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid gap-1 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">{t("claimsPage.contact")}</span>
                    {claim.contactName} {claim.contactTitle ? `（${claim.contactTitle}）` : ""}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("claimsPage.phone")}</span>
                    {claim.contactPhone}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("claimsPage.email")}</span>
                    {claim.contactEmail}
                  </div>
                </div>
                {claim.note && (
                  <div className="text-muted-foreground">
                    <span className="text-foreground">{t("claimsPage.note")}</span>
                    {claim.note}
                  </div>
                )}
                {claim.reviewNote && (
                  <div className="rounded-md bg-muted p-2 text-xs">
                    <span className="font-medium">{t("claimsPage.reviewNote")}</span>
                    {claim.reviewNote}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
