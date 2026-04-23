import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { supplierClaims, supplierListings, users } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { AdminClaimsTable, type AdminClaimRow } from "./admin-claims-table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("adminClaims.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage({
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
    if (gate.status === 401) redirect("/sign-in?redirect_url=/dashboard/admin/claims");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">{t("adminClaims.noPermission")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adminClaims.noPermissionSub")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sp = await searchParams;
  const statusFilter = (sp.status ?? "pending") as "pending" | "approved" | "rejected" | "all";

  const base = db
    .select({
      claim: supplierClaims,
      supplier: supplierListings,
      user: users,
    })
    .from(supplierClaims)
    .leftJoin(supplierListings, eq(supplierClaims.supplierListingId, supplierListings.id))
    .leftJoin(users, eq(supplierClaims.userId, users.id))
    .orderBy(desc(supplierClaims.createdAt));

  const rowsRaw = await (statusFilter === "all"
    ? base
    : base.where(eq(supplierClaims.status, statusFilter as "pending" | "approved" | "rejected")));

  const rows: AdminClaimRow[] = rowsRaw.map((r) => ({
    id: r.claim.id,
    status: r.claim.status,
    createdAt: r.claim.createdAt.toISOString(),
    reviewedAt: r.claim.reviewedAt?.toISOString() ?? null,
    contactName: r.claim.contactName,
    contactTitle: r.claim.contactTitle ?? "",
    contactPhone: r.claim.contactPhone,
    contactEmail: r.claim.contactEmail,
    businessLicenseUrl: r.claim.businessLicenseUrl ?? "",
    note: r.claim.note ?? "",
    reviewNote: r.claim.reviewNote ?? "",
    supplierId: r.supplier?.id ?? "",
    supplierName: r.supplier?.name ?? t("adminClaims.supplierDeleted"),
    supplierLocation: r.supplier?.location ?? "",
    supplierAlreadyClaimed: !!r.supplier?.enterpriseId,
    applicantName: r.user?.name ?? r.user?.email ?? t("adminClaims.anonymous"),
    applicantEmail: r.user?.email ?? "",
  }));

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminClaims.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminClaims.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusTab current={statusFilter} value="pending" label={t("adminClaims.tabPending", { count: counts.pending })} />
        <StatusTab current={statusFilter} value="approved" label={t("adminClaims.tabApproved", { count: counts.approved })} />
        <StatusTab current={statusFilter} value="rejected" label={t("adminClaims.tabRejected", { count: counts.rejected })} />
        <StatusTab current={statusFilter} value="all" label={t("adminClaims.tabAll")} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("adminClaims.noRecords")}
          </CardContent>
        </Card>
      ) : (
        <AdminClaimsTable rows={rows} />
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
      href={`/dashboard/admin/claims?status=${value}`}
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

// Keep a Badge import alive for future use (referenced in client component)
void Badge;
