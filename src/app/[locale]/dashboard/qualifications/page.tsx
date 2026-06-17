import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QualificationLabel } from "@/components/qualification/qualification-label";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import {
  supplierDocumentTags,
  supplierDocuments,
  supplierListings,
} from "@/lib/db/schema";

import { QualificationsUploader } from "./qualifications-uploader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("myQual.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function MyQualificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const me = await getCurrentUser();
  if (!me) redirect("/sign-in?redirect_url=/dashboard/qualifications");

  // 解析用户关联的供应商(enterprise_admin → enterpriseId → supplierListing)
  let supplierListingId: string | null = null;
  let supplierName = "";
  if (me.enterpriseId) {
    const [s] = await db
      .select({ id: supplierListings.id, name: supplierListings.name })
      .from(supplierListings)
      .where(eq(supplierListings.enterpriseId, me.enterpriseId))
      .limit(1);
    if (s) {
      supplierListingId = s.id;
      supplierName = s.name;
    }
  }

  // 我的上传记录
  const docs = await db
    .select()
    .from(supplierDocuments)
    .where(eq(supplierDocuments.uploadedByUserId, me.id))
    .orderBy(desc(supplierDocuments.createdAt))
    .limit(50);

  const ids = docs.map((d) => d.id);
  const tagRows = ids.length
    ? await db
        .select()
        .from(supplierDocumentTags)
        .where(inArray(supplierDocumentTags.documentId, ids))
    : [];
  const tagsByDoc = new Map<string, typeof tagRows>();
  for (const tg of tagRows) {
    const arr = tagsByDoc.get(tg.documentId) ?? [];
    arr.push(tg);
    tagsByDoc.set(tg.documentId, arr);
  }

  const lang = locale === "en" ? "en" : "zh";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("myQual.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("myQual.subtitle")}</p>
      </div>

      {me.enterpriseId ? (
        <div className="text-sm text-muted-foreground">
          {supplierListingId ? (
            <>
              {t("myQual.linkedTo")}
              <span className="font-medium text-foreground">{supplierName}</span>
            </>
          ) : (
            t("myQual.notLinked")
          )}
        </div>
      ) : (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {t("myQual.needClaim")}{" "}
          <Link href="/dashboard/claims" className="font-medium underline">
            {t("myQual.needClaimCta")}
          </Link>
        </div>
      )}

      <QualificationsUploader supplierListingId={supplierListingId} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("myQual.myDocs")}
        </h2>
        {docs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("myQual.noDocs")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{t(`myQual.kindLabel.${d.kind}`)}</Badge>
                      <span className="text-muted-foreground">
                        {d.fileName ?? d.ossKey.split("/").pop()}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {typeof d.extractionConfidence === "number" && (
                        <span className="text-xs text-muted-foreground">
                          {t("myQual.confidence", { n: d.extractionConfidence })}
                        </span>
                      )}
                      <Badge
                        variant={
                          d.status === "approved"
                            ? "default"
                            : d.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {t(`myQual.statusLabel.${d.status}`)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {(tagsByDoc.get(d.id)?.length || d.reviewNote) && (
                  <CardContent className="space-y-2">
                    <QualificationLabel
                      tags={tagsByDoc.get(d.id) ?? []}
                      locale={lang}
                    />
                    {d.reviewNote && (
                      <div className="text-xs text-muted-foreground">
                        {t("myQual.reviewNote")}
                        {d.reviewNote}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
