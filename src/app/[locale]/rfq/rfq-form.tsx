"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = [
  { value: "raw", label: "Raw materials (fibers, resins, prepregs, cores)" },
  { value: "equipment", label: "Equipment (pultrusion, RTM, AFP, autoclave)" },
  { value: "tooling", label: "Tooling (jigs, fixtures, NDT, lab)" },
  { value: "molds", label: "Molds (composite molds, dies, RTM tooling)" },
  { value: "finished", label: "Finished parts (OEM, structural, panels)" },
  { value: "other", label: "Other / Not sure" },
] as const;

type FormState = {
  company: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  category: string;
  productNeed: string;
  quantity: string;
  application: string;
  extraRequirements: string;
};

const INITIAL: FormState = {
  company: "",
  name: "",
  email: "",
  phone: "",
  country: "",
  category: "raw",
  productNeed: "",
  quantity: "",
  application: "",
  extraRequirements: "",
};

export function RfqForm({
  targetSupplierId,
  targetSupplierName,
}: {
  targetSupplierId?: string;
  targetSupplierName?: string;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    category: targetSupplierId ? "finished" : INITIAL.category,
  }));
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: targetSupplierId
            ? `supplier:${targetSupplierId}`
            : "general-inquiry",
          materialName: form.productNeed || "General sourcing inquiry",
          targetSupplierId,
          category: form.category,
          company: form.company,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          quantity: form.quantity,
          application: form.application || form.country || undefined,
          extraRequirements:
            [
              form.country ? `Country: ${form.country}` : "",
              form.extraRequirements,
            ]
              .filter(Boolean)
              .join("\n\n") || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-border/70 bg-background p-8 text-center">
        <div className="text-2xl font-semibold tracking-tight">
          RFQ received ✓
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Our sourcing team has been notified. Expect a reply at{" "}
          <span className="font-mono">{form.email}</span> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {targetSupplierId && targetSupplierName && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Contacting through getfrp
          </div>
          <div className="mt-1 text-sm font-semibold">{targetSupplierName}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Your inquiry will be routed to this verified supplier and copied to
            the GetFRP sourcing desk for delivery tracking.
          </p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company" required>
          <input
            required
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Your name" required>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Email" required>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Destination country" required>
          <input
            required
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g. Germany, USA, India"
          />
        </Field>
        <Field label="Category" required>
          <select
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className={INPUT_CLASS}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="What do you need?" required>
        <input
          required
          value={form.productNeed}
          onChange={(e) => update("productNeed", e.target.value)}
          className={INPUT_CLASS}
          placeholder="e.g. T700 carbon fiber, 12K, 800 tex"
        />
      </Field>

      <Field label="Quantity / annual volume" required>
        <input
          required
          value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)}
          className={INPUT_CLASS}
          placeholder="e.g. 5 tons / month or 50 tons / year"
        />
      </Field>

      <Field label="Application (optional)">
        <input
          value={form.application}
          onChange={(e) => update("application", e.target.value)}
          className={INPUT_CLASS}
          placeholder="e.g. wind blade root, EV battery enclosure"
        />
      </Field>

      <Field label="Additional requirements (optional)">
        <textarea
          rows={4}
          value={form.extraRequirements}
          onChange={(e) => update("extraRequirements", e.target.value)}
          className={`${INPUT_CLASS} resize-y`}
          placeholder="Certifications, delivery timeline, target price, payment terms…"
        />
      </Field>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Submit RFQ"}
      </Button>
    </form>
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
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20";
