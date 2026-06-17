import type { Metadata } from "next";
import { count, desc, eq, inArray } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  supplierDocumentTags,
  supplierDocuments,
  supplierListings,
  users,
} from "@/lib/db/schema";
import { ossConfigured, signedGetUrl } from "@/lib/oss";
import { TAGS_BY_ID } from "@/lib/qualification/cert-taxonomy";
import {
  AdminQualificationsTable,
  type AdminQualRow,
} from "./admin-qualifications-table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("adminQual.metaTitle") };
}

export const dynamic = "force-dynamic";

type DocStatus =
  | "uploaded"
  | "extracting"
  | "extracted"
  | "needs_review"
  | "approved"
  | "rejected"
  | "expired";

export default async function AdminQualificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const gate = await gateAdmin();
  if (!gate.ok) {
    if (gate.status === 401)
      redirect("/sign-in?redirect_url=/dashboard/admin/qualifications");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">{t("adminQual.noPermission")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adminQual.noPermissionSub")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sp = await searchParams;
  const statusFilter = (sp.status ?? "needs_review") as DocStatus | "all";

  const base = db
    .select({
      doc: supplierDocuments,
      supplier: supplierListings,
      uploader: users,
    })
    .from(supplierDocuments)
    .leftJoin(supplierListings, eq(supplierDocuments.supplierListingId, supplierListings.id))
    .leftJoin(users, eq(supplierDocuments.uploadedByUserId, users.id))
    .orderBy(desc(supplierDocuments.createdAt));

  const docsRaw = await (statusFilter === "all"
    ? base
    : base.where(eq(supplierDocuments.status, statusFilter as DocStatus)));

  // 批量取标签,免 N+1
  const ids = docsRaw.map((r) => r.doc.id);
  const tagRows = ids.length
    ? await db
        .select()
        .from(supplierDocumentTags)
        .where(inArray(supplierDocumentTags.documentId, ids))
    : [];
  const tagsByDoc = new Map<string, AdminQualRow["tags"]>();
  const lang = locale === "en" ? "en" : "zh";
  for (const tg of tagRows) {
    const arr = tagsByDoc.get(tg.documentId) ?? [];
    arr.push({
      tagId: tg.tagId,
      facet: tg.facet,
      trust: tg.trust,
      label: TAGS_BY_ID.get(tg.tagId)?.label[lang] ?? tg.tagId,
    });
    tagsByDoc.set(tg.documentId, arr);
  }

  const canSign = ossConfigured();
  const rows: AdminQualRow[] = docsRaw.map((r) => {
    const extracted = (r.doc.extractedData ?? {}) as { unmapped?: string[] };
    return {
      id: r.doc.id,
      kind: r.doc.kind,
      status: r.doc.status,
      createdAt: r.doc.createdAt.toISOString(),
      reviewedAt: r.doc.reviewedAt?.toISOString() ?? null,
      fileName: r.doc.fileName ?? r.doc.ossKey.split("/").pop() ?? "",
      fileUrl: canSign ? signedGetUrl(r.doc.ossKey) : "",
      confidence: r.doc.extractionConfidence ?? null,
      certNo: r.doc.certNo ?? "",
      issuer: r.doc.issuer ?? "",
      validTo: r.doc.validTo ?? null,
      reviewNote: r.doc.reviewNote ?? "",
      supplierName: r.supplier?.name ?? "",
      uploaderName: r.uploader?.name ?? r.uploader?.email ?? r.uploader?.phone ?? "—",
      tags: tagsByDoc.get(r.doc.id) ?? [],
      unmapped: Array.isArray(extracted.unmapped) ? extracted.unmapped : [],
    };
  });

  const [[{ c: cReview }], [{ c: cApproved }], [{ c: cRejected }]] =
    await Promise.all([
      db.select({ c: count() }).from(supplierDocuments).where(eq(supplierDocuments.status, "needs_review")),
      db.select({ c: count() }).from(supplierDocuments).where(eq(supplierDocuments.status, "approved")),
      db.select({ c: count() }).from(supplierDocuments).where(eq(supplierDocuments.status, "rejected")),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminQual.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminQual.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusTab current={statusFilter} value="needs_review" label={t("adminQual.tabReview", { count: cReview })} />
        <StatusTab current={statusFilter} value="approved" label={t("adminQual.tabApproved", { count: cApproved })} />
        <StatusTab current={statusFilter} value="rejected" label={t("adminQual.tabRejected", { count: cRejected })} />
        <StatusTab current={statusFilter} value="all" label={t("adminQual.tabAll")} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("adminQual.noRecords")}
          </CardContent>
        </Card>
      ) : (
        <AdminQualificationsTable rows={rows} />
      )}
    </div>
  );
}

function StatusTab({
  current,
  value,
  label,
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <a
      href={`/dashboard/admin/qualifications?status=${value}`}
      className={`rounded-md border px-3 py-1.5 transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-muted"
      }`}
    >
      {label}
    </a>
  );
}
