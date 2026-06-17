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
import { Textarea } from "@/components/ui/textarea";

export type AdminQualRow = {
  id: string;
  kind: "license" | "product" | "test" | "cert";
  status:
    | "uploaded"
    | "extracting"
    | "extracted"
    | "needs_review"
    | "approved"
    | "rejected"
    | "expired";
  createdAt: string;
  reviewedAt: string | null;
  fileName: string;
  fileUrl: string;
  confidence: number | null;
  certNo: string;
  issuer: string;
  validTo: string | null;
  reviewNote: string;
  supplierName: string;
  uploaderName: string;
  tags: { tagId: string; facet: string; trust: number; label: string }[];
  unmapped: string[];
};

const TRUST_DOT = ["○", "◔", "◑", "●"]; // T0..T3

export function AdminQualificationsTable({ rows }: { rows: AdminQualRow[] }) {
  const t = useTranslations("Dashboard.adminQual");
  const router = useRouter();
  const [dialog, setDialog] = useState<
    | { open: false }
    | { open: true; action: "approve" | "reject"; row: AdminQualRow }
  >({ open: false });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog(action: "approve" | "reject", row: AdminQualRow) {
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
      `/api/admin/qualifications/${dialog.row.id}/${dialog.action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: note.trim() || null }),
      },
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
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge variant="secondary">{t(`table.kindLabel.${r.kind}`)}</Badge>
                    <span>{r.supplierName || t("table.unclaimed")}</span>
                  </CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("table.uploader")}
                    {r.uploaderName}
                    {" · "}
                    {t("table.submittedOn", { date: r.createdAt.slice(0, 10) })}
                    {r.reviewedAt &&
                      ` · ${t("table.reviewedOn", { date: r.reviewedAt.slice(0, 10) })}`}
                    {typeof r.confidence === "number" &&
                      ` · ${t("table.confidence", { n: r.confidence })}`}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "approved"
                      ? "default"
                      : r.status === "rejected"
                        ? "destructive"
                        : r.status === "needs_review"
                          ? "outline"
                          : "secondary"
                  }
                >
                  {t(`table.statusLabel.${r.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* 抽取出的关键字段(cert) */}
              {(r.certNo || r.issuer || r.validTo) && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {r.issuer && (
                    <div>
                      <span className="text-muted-foreground">{t("table.issuer")}</span>
                      {r.issuer}
                    </div>
                  )}
                  {r.certNo && (
                    <div>
                      <span className="text-muted-foreground">{t("table.certNo")}</span>
                      {r.certNo}
                    </div>
                  )}
                  {r.validTo && (
                    <div>
                      <span className="text-muted-foreground">{t("table.validTo")}</span>
                      {r.validTo}
                    </div>
                  )}
                </div>
              )}

              {/* 自动标签 */}
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  {t("table.tags")}
                </div>
                {r.tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">{t("table.noTags")}</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((tg) => (
                      <Badge key={tg.tagId} variant="outline" className="gap-1 font-normal">
                        <span title={`trust ${tg.trust}`}>{TRUST_DOT[tg.trust] ?? "○"}</span>
                        {tg.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 未映射(待治理) */}
              {r.unmapped.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <div className="font-semibold">{t("table.unmapped")}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {r.unmapped.map((u, i) => (
                      <span key={i} className="rounded bg-amber-100 px-1.5 py-0.5 dark:bg-amber-900">
                        {u}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 opacity-80">{t("table.unmappedHint")}</div>
                </div>
              )}

              {r.fileUrl && (
                <div>
                  <span className="text-muted-foreground">{t("table.file")}</span>
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    {r.fileName || t("table.viewFile")} ↗
                  </a>
                </div>
              )}

              {r.reviewNote && (
                <div className="rounded-md border-l-4 border-muted-foreground/30 bg-muted/50 p-2">
                  <div className="text-xs font-semibold">{t("table.reviewNote")}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.reviewNote}</div>
                </div>
              )}

              {(r.status === "needs_review" || r.status === "extracted") && (
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
                  {dialog.row.supplierName || t("table.unclaimed")} ·{" "}
                  {t(`table.kindLabel.${dialog.row.kind}`)}
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
                    {t("table.approveHint")}
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
