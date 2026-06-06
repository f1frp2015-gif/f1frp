import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { enterprises, users } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { AdminEnterprisesTable, type AdminEnterpriseRow } from "./admin-enterprises-table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("adminEnterprises.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminEnterprisesPage({
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
    if (gate.status === 401) redirect("/sign-in?redirect_url=/dashboard/admin/enterprises");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">{t("adminEnterprises.noPermission")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adminEnterprises.noPermissionSub")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sp = await searchParams;
  const statusFilter = (sp.status ?? "pending") as
    | "pending"
    | "verified"
    | "rejected"
    | "all";

  const base = db
    .select({ ent: enterprises, applicant: users })
    .from(enterprises)
    .leftJoin(users, eq(users.enterpriseId, enterprises.id))
    .orderBy(desc(enterprises.createdAt));

  const rowsRaw = await (statusFilter === "all"
    ? base
    : base.where(eq(enterprises.status, statusFilter as "pending" | "verified" | "rejected")));

  const rows: AdminEnterpriseRow[] = rowsRaw.map((r) => ({
    id: r.ent.id,
    status: r.ent.status,
    createdAt: r.ent.createdAt.toISOString(),
    name: r.ent.name,
    category: r.ent.category,
    province: r.ent.province ?? "",
    city: r.ent.city ?? "",
    description: r.ent.description ?? "",
    products: (r.ent.products ?? []) as string[],
    contactName: r.ent.contactName ?? "",
    contactPhone: r.ent.contactPhone ?? "",
    contactEmail: r.ent.contactEmail ?? "",
    contactWechat: r.ent.contactWechat ?? "",
    website: r.ent.website ?? "",
    businessLicense: r.ent.businessLicense ?? "",
    applicantName: r.applicant?.name ?? r.applicant?.phone ?? t("adminEnterprises.anonymous"),
  }));

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    verified: rows.filter((r) => r.status === "verified").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminEnterprises.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminEnterprises.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusTab current={statusFilter} value="pending" label={t("adminEnterprises.tabPending", { count: counts.pending })} />
        <StatusTab current={statusFilter} value="verified" label={t("adminEnterprises.tabVerified", { count: counts.verified })} />
        <StatusTab current={statusFilter} value="rejected" label={t("adminEnterprises.tabRejected", { count: counts.rejected })} />
        <StatusTab current={statusFilter} value="all" label={t("adminEnterprises.tabAll")} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("adminEnterprises.noRecords")}
          </CardContent>
        </Card>
      ) : (
        <AdminEnterprisesTable rows={rows} />
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
      href={`/dashboard/admin/enterprises?status=${value}`}
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
