"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AdminEnterpriseRow = {
  id: string;
  status: "pending" | "verified" | "rejected" | "suspended";
  createdAt: string;
  name: string;
  category: string;
  province: string;
  city: string;
  description: string;
  products: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactWechat: string;
  website: string;
  businessLicense: string;
  applicantName: string;
};

export function AdminEnterprisesTable({ rows }: { rows: AdminEnterpriseRow[] }) {
  const t = useTranslations("Dashboard.adminEnterprises");
  const router = useRouter();
  const [dialog, setDialog] = useState<
    { open: false } | { open: true; action: "approve" | "reject"; row: AdminEnterpriseRow }
  >({ open: false });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog(action: "approve" | "reject", row: AdminEnterpriseRow) {
    setDialog({ open: true, action, row });
    setError(null);
  }

  function closeDialog() {
    setDialog({ open: false });
    setError(null);
  }

  async function submit() {
    if (!dialog.open) return;
    setError(null);
    const res = await fetch(`/api/admin/enterprises/${dialog.row.id}/${dialog.action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error ?? t("table.operationFailed"));
      return;
    }
    closeDialog();
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[r.province, r.city].filter(Boolean).join(" ")}
                    {(r.province || r.city) && " · "}
                    {t("table.submittedOn", { date: r.createdAt.slice(0, 10) })}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "verified"
                      ? "default"
                      : r.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {t(`statusLabel.${r.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">{t("table.applicant")}</span>
                  {r.applicantName}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("table.contact")}</span>
                  {r.contactName}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("table.phone")}</span>
                  {r.contactPhone}
                </div>
                {r.contactEmail && (
                  <div>
                    <span className="text-muted-foreground">{t("table.email")}</span>
                    {r.contactEmail}
                  </div>
                )}
                {r.contactWechat && (
                  <div>
                    <span className="text-muted-foreground">{t("table.wechat")}</span>
                    {r.contactWechat}
                  </div>
                )}
                {r.website && (
                  <div>
                    <span className="text-muted-foreground">{t("table.website")}</span>
                    <a href={r.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                      {r.website}
                    </a>
                  </div>
                )}
              </div>

              {r.products.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.products.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              )}

              {r.description && (
                <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  {r.description}
                </div>
              )}

              {r.businessLicense && (
                <div>
                  <span className="text-muted-foreground">{t("table.businessLicense")}</span>
                  <a
                    href={r.businessLicense}
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    {t("table.viewAttachment")}
                  </a>
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="destructive" size="sm" onClick={() => openDialog("reject", r)}>
                    {t("table.reject")}
                  </Button>
                  <Button size="sm" onClick={() => openDialog("approve", r)}>
                    {t("table.approve")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog.open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          {dialog.open && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.action === "approve"
                    ? t("table.dialogApproveTitle")
                    : t("table.dialogRejectTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("table.dialogCompany")}
                  <span className="font-medium text-foreground">{dialog.row.name}</span>
                  <br />
                  {dialog.action === "approve"
                    ? t("table.dialogApproveHint")
                    : t("table.dialogRejectHint")}
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={closeDialog} disabled={pending}>
                  {t("table.cancel")}
                </Button>
                <Button
                  variant={dialog.action === "reject" ? "destructive" : "default"}
                  onClick={submit}
                  disabled={pending}
                >
                  {pending
                    ? t("table.submitting")
                    : dialog.action === "approve"
                      ? t("table.confirmApprove")
                      : t("table.confirmReject")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
