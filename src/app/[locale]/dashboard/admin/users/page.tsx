import type { Metadata } from "next";
import { type SQL, count, desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { gateAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { enterprises, users } from "@/lib/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("adminUsers.metaTitle") };
}

export const dynamic = "force-dynamic";

type Role =
  | "individual"
  | "enterprise_admin"
  | "enterprise_member"
  | "moderator"
  | "admin";

const ROLE_TABS: (Role | "all")[] = [
  "all",
  "individual",
  "enterprise_admin",
  "enterprise_member",
  "admin",
];

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const gate = await gateAdmin();
  if (!gate.ok) {
    if (gate.status === 401) redirect("/sign-in?redirect_url=/dashboard/admin/users");
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">{t("adminUsers.noPermission")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adminUsers.noPermissionSub")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sp = await searchParams;
  const roleFilter = (sp.role ?? "all") as Role | "all";
  const whereClause: SQL | undefined =
    roleFilter === "all" ? undefined : eq(users.role, roleFilter);

  const rows = await db
    .select({ u: users, ent: enterprises })
    .from(users)
    .leftJoin(enterprises, eq(users.enterpriseId, enterprises.id))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(500);

  const roleCounts = await db
    .select({ role: users.role, c: count() })
    .from(users)
    .groupBy(users.role);
  const countOf = (r: Role | "all") =>
    r === "all"
      ? roleCounts.reduce((s, x) => s + x.c, 0)
      : (roleCounts.find((x) => x.role === r)?.c ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminUsers.h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminUsers.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {ROLE_TABS.map((r) => (
          <RoleTab
            key={r}
            current={roleFilter}
            value={r}
            label={
              r === "all"
                ? t("adminUsers.tabAll", { count: countOf("all") })
                : `${t(`adminUsers.roleLabel.${r}`)} (${countOf(r)})`
            }
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("adminUsers.noRecords")}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adminUsers.colUser")}</TableHead>
                <TableHead>{t("adminUsers.colContact")}</TableHead>
                <TableHead>{t("adminUsers.colRole")}</TableHead>
                <TableHead>{t("adminUsers.colEnterprise")}</TableHead>
                <TableHead>{t("adminUsers.colMembership")}</TableHead>
                <TableHead>{t("adminUsers.colJoined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.u.id}>
                  <TableCell className="font-medium">
                    {r.u.name || t("adminUsers.anonymous")}
                  </TableCell>
                  <TableCell>{r.u.email || r.u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`adminUsers.roleLabel.${r.u.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.ent?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.u.membershipTier}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.u.createdAt.toISOString().slice(0, 10)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RoleTab({
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
      href={`/dashboard/admin/users?role=${value}`}
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
