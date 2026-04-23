"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export type AdminClaimRow = {
  id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  createdAt: string;
  reviewedAt: string | null;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  businessLicenseUrl: string;
  note: string;
  reviewNote: string;
  supplierId: string;
  supplierName: string;
  supplierLocation: string;
  supplierAlreadyClaimed: boolean;
  applicantName: string;
  applicantEmail: string;
};

export function AdminClaimsTable({ rows }: { rows: AdminClaimRow[] }) {
  const t = useTranslations("Dashboard.adminClaims");
  const router = useRouter();
  const [dialog, setDialog] = useState<
    | { open: false }
    | {
        open: true;
        action: "approve" | "reject";
        row: AdminClaimRow;
      }
  >({ open: false });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog(action: "approve" | "reject", row: AdminClaimRow) {
    setDialog({ open: true, action, row });
    setNote(action === "approve" ? "" : t("table.defaultRejectReason"));
    setError(null);
  }

  function closeDialog() {
    setDialog({ open: false });
    setNote("");
    setError(null);
  }

  async function submit() {
    if (!dialog.open) return;
    setError(null);
    const res = await fetch(
      `/api/admin/claims/${dialog.row.id}/${dialog.action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: note.trim() || null }),
      }
    );
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
                  <CardTitle className="text-base">
                    <Link
                      href={`/suppliers#${r.supplierId}`}
                      className="hover:text-primary"
                    >
                      {r.supplierName}
                    </Link>
                  </CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.supplierLocation && <span>{r.supplierLocation} · </span>}
                    {t("table.submittedOn", { date: r.createdAt.slice(0, 10) })}
                    {r.reviewedAt && ` · ${t("table.reviewedOn", { date: r.reviewedAt.slice(0, 10) })}`}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "approved"
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
                  {r.applicantEmail && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({r.applicantEmail})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("table.contact")}</span>
                  {r.contactName}
                  {r.contactTitle && ` · ${r.contactTitle}`}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("table.phone")}</span>
                  {r.contactPhone}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("table.email")}</span>
                  {r.contactEmail}
                </div>
              </div>

              {r.businessLicenseUrl && (
                <div>
                  <span className="text-muted-foreground">{t("table.businessLicense")}</span>
                  <a
                    href={r.businessLicenseUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    {t("table.viewAttachment")}
                  </a>
                </div>
              )}

              {r.note && (
                <div className="rounded-md bg-muted p-2">
                  <div className="text-xs font-semibold">{t("table.note")}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.note}</div>
                </div>
              )}

              {r.reviewNote && (
                <div className="rounded-md border-l-4 border-muted-foreground/30 bg-muted/50 p-2">
                  <div className="text-xs font-semibold">{t("table.reviewNote")}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.reviewNote}</div>
                </div>
              )}

              {r.supplierAlreadyClaimed && r.status === "pending" && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  {t("table.alreadyClaimedWarn")}
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDialog("reject", r)}
                  >
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
                  {dialog.action === "approve" ? t("table.dialogApproveTitle") : t("table.dialogRejectTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("table.dialogCompany")}
                  <span className="font-medium text-foreground">{dialog.row.supplierName}</span>
                  <br />
                  {t("table.dialogApplicant")}
                  {dialog.row.contactName} ({dialog.row.contactEmail})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    {t("table.reviewNoteLabel")}
                    {dialog.action === "reject"
                      ? t("table.reviewNoteReject")
                      : t("table.reviewNoteOptional")}
                  </label>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      dialog.action === "approve"
                        ? t("table.notePlaceholderApprove")
                        : t("table.notePlaceholderReject")
                    }
                  />
                </div>

                {dialog.action === "approve" && (
                  <div className="rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                    {t("table.approveActions")}
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>{t("table.approveAction1")}</li>
                      <li>{t("table.approveAction2")}</li>
                      <li>{t("table.approveAction3")}</li>
                      <li>{t("table.approveAction4")}</li>
                    </ul>
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                  </div>
                )}
              </div>

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
