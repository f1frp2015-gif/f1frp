"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InquiryButtonProps {
  materialId: string;
  materialName: string;
  category?: string;
}

export function InquiryButton({ materialId, materialName, category }: InquiryButtonProps) {
  const t = useTranslations("Inquiry");
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    quantity: "",
    application: "",
    extraRequirements: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, materialName, category, ...form }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? t("submitError"));
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-primary/5 p-4">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
        <Button
          className="mt-3 w-full"
          onClick={() => setOpen(true)}
          disabled={submitted}
        >
          {submitted ? t("sent") : t("openBtn")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-6 text-center">
              <p className="text-base font-medium text-primary">{t("successMsg")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("successSub")}</p>
              <Button className="mt-4" variant="outline" onClick={() => setOpen(false)}>
                {t("close")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <Field label={t("companyLabel")} required>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder={t("companyPlaceholder")}
                />
              </Field>
              <Field label={t("nameLabel")} required>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder={t("namePlaceholder")}
                />
              </Field>
              <Field label={t("emailLabel")} required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder={t("emailPlaceholder")}
                />
              </Field>
              <Field label={t("phoneLabel")}>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-base"
                  placeholder={t("phonePlaceholder")}
                />
              </Field>
              <Field label={t("quantityLabel")} required>
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder={t("quantityPlaceholder")}
                />
              </Field>
              <Field label={t("applicationLabel")}>
                <textarea
                  name="application"
                  value={form.application}
                  onChange={handleChange}
                  rows={2}
                  className="input-base resize-none"
                  placeholder={t("applicationPlaceholder")}
                />
              </Field>
              <Field label={t("extraLabel")}>
                <textarea
                  name="extraRequirements"
                  value={form.extraRequirements}
                  onChange={handleChange}
                  rows={2}
                  className="input-base resize-none"
                  placeholder={t("extraPlaceholder")}
                />
              </Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t("submitting") : t("submit")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.375rem 0.625rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-base:focus {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
