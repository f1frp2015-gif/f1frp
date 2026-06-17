"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const KINDS = ["cert", "test", "product", "license"] as const;
type Kind = (typeof KINDS)[number];

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

type UploadResult = {
  status?: "extracted" | "needs_review";
  confidence?: number;
  tagCount?: number;
  note?: string;
};

export function QualificationsUploader({
  supplierListingId,
}: {
  supplierListingId: string | null;
}) {
  const t = useTranslations("Dashboard.myQual");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("cert");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    if (!ALLOWED.includes(file.type)) {
      setError(t("allowedHint"));
      return;
    }
    setBusy(true);
    try {
      // 1) 取签名直传 URL
      const signRes = await fetch("/api/uploads/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, kind }),
      });
      const sign = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        setError(sign?.error ?? t("uploadError"));
        return;
      }
      // 2) PUT 上传到 OSS
      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(t("uploadError"));
        return;
      }
      // 3) 入库 + AI 识别打标
      const procRes = await fetch("/api/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          ossKey: sign.key,
          fileName: file.name,
          contentType: file.type,
          supplierListingId,
        }),
      });
      const body = await procRes.json().catch(() => ({}));
      if (!procRes.ok) {
        setError(body?.error ?? t("uploadError"));
        return;
      }
      setResult(body as UploadResult);
      startTransition(() => router.refresh());
    } catch {
      setError(t("uploadError"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <div className="mb-1.5 text-xs font-medium">{t("pickKind")}</div>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={kind === k ? "default" : "outline"}
                onClick={() => setKind(k)}
                disabled={busy}
              >
                {t(`kindLabel.${k}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? t("uploading") : t("pickFile")}
          </Button>
          <span className="text-xs text-muted-foreground">{t("allowedHint")}</span>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            {result.status === "extracted" ? t("resultOk") : t("resultReview")}
            {typeof result.tagCount === "number" && ` · ${t("resultTags", { n: result.tagCount })}`}
            {typeof result.confidence === "number" && ` · ${t("confidence", { n: result.confidence })}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
