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

const INCOTERMS = ["Not decided", "EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"];
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ATTACHMENT_ACCEPT = ".pdf,.step,.stp,.iges,.igs,.dxf,.dwg,.xlsx,.xls,.csv,.doc,.docx,.zip,.jpg,.jpeg,.png";

type FormState = {
  company: string;
  name: string;
  email: string;
  phone: string;
  destinationCountry: string;
  category: string;
  productNeed: string;
  quantity: string;
  application: string;
  deliveryDate: string;
  incoterm: string;
  standards: string;
  targetPrice: string;
  extraRequirements: string;
  sampleRequired: boolean;
  ndaRequired: boolean;
};

const INITIAL: FormState = {
  company: "",
  name: "",
  email: "",
  phone: "",
  destinationCountry: "",
  category: "raw",
  productNeed: "",
  quantity: "",
  application: "",
  deliveryDate: "",
  incoterm: "Not decided",
  standards: "",
  targetPrice: "",
  extraRequirements: "",
  sampleRequired: false,
  ndaRequired: false,
};

export function RfqForm({
  targetSupplierId,
  targetSupplierName,
  targetSupplierVerified = false,
  initialProduct,
  initialCategory,
}: {
  targetSupplierId?: string;
  targetSupplierName?: string;
  targetSupplierVerified?: boolean;
  initialProduct?: string;
  initialCategory?: string;
}) {
  const validInitialCategory = CATEGORY_OPTIONS.some(
    (option) => option.value === initialCategory,
  )
    ? initialCategory
    : undefined;
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    productNeed: initialProduct ?? "",
    category:
      validInitialCategory ?? (targetSupplierId ? "finished" : INITIAL.category),
  }));
  const [attachment, setAttachment] = useState<File | null>(null);
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
      if (attachment && attachment.size > MAX_ATTACHMENT_BYTES) {
        throw new Error("Attachment must be 3 MB or smaller.");
      }
      const payload = new FormData();
      payload.set(
        "materialId",
        targetSupplierId ? `supplier:${targetSupplierId}` : "general-inquiry",
      );
      payload.set("materialName", form.productNeed || "General sourcing inquiry");
      if (targetSupplierId) payload.set("targetSupplierId", targetSupplierId);
      for (const [key, value] of Object.entries(form)) {
        payload.set(key, typeof value === "boolean" ? String(value) : value);
      }
      if (attachment) payload.set("attachment", attachment);

      const res = await fetch("/api/v1/rfq", {
        method: "POST",
        body: payload,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
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
        <div className="text-2xl font-semibold tracking-tight">RFQ received ✓</div>
        <p className="mt-3 text-sm text-muted-foreground">
          Our sourcing team has been notified. Expect a reply at{" "}
          <span className="font-mono">{form.email}</span> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {targetSupplierId && targetSupplierName && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Contacting through GetFRP
          </div>
          <div className="mt-1 text-sm font-semibold">{targetSupplierName}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {targetSupplierVerified
              ? "Your inquiry will be routed to this verified supplier and copied to the GetFRP sourcing desk for delivery tracking."
              : "This public supplier profile is not claimed. The GetFRP sourcing desk will receive your inquiry and route it using the company's public contact information."}
          </p>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="text-sm font-semibold">Buyer and delivery</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company" required><input required maxLength={160} value={form.company} onChange={(e) => update("company", e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Your name" required><input required maxLength={120} value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Email" required><input required type="email" maxLength={254} value={form.email} onChange={(e) => update("email", e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Phone (optional)"><input maxLength={60} value={form.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Destination country" required><input required maxLength={100} value={form.destinationCountry} onChange={(e) => update("destinationCountry", e.target.value)} className={INPUT_CLASS} placeholder="e.g. Germany or USA" /></Field>
          <Field label="Requested delivery date"><input type="date" value={form.deliveryDate} onChange={(e) => update("deliveryDate", e.target.value)} className={INPUT_CLASS} /></Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-border/70 pt-6">
        <legend className="text-sm font-semibold">Product specification</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" required>
            <select required value={form.category} onChange={(e) => update("category", e.target.value)} className={INPUT_CLASS}>
              {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>
          <Field label="Quantity / annual volume" required><input required maxLength={160} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className={INPUT_CLASS} placeholder="e.g. 5 tons / month" /></Field>
        </div>
        <Field label="What do you need?" required><input required maxLength={300} value={form.productNeed} onChange={(e) => update("productNeed", e.target.value)} className={INPUT_CLASS} placeholder="e.g. pultruded GFRP I-beam to attached drawing" /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Application"><input maxLength={300} value={form.application} onChange={(e) => update("application", e.target.value)} className={INPUT_CLASS} placeholder="e.g. chemical plant walkway" /></Field>
          <Field label="Required standards / certifications"><input maxLength={300} value={form.standards} onChange={(e) => update("standards", e.target.value)} className={INPUT_CLASS} placeholder="e.g. EN 13706 E23, ISO 9001" /></Field>
          <Field label="Incoterm"><select value={form.incoterm} onChange={(e) => update("incoterm", e.target.value)} className={INPUT_CLASS}>{INCOTERMS.map((term) => <option key={term}>{term}</option>)}</select></Field>
          <Field label="Target price / currency"><input maxLength={120} value={form.targetPrice} onChange={(e) => update("targetPrice", e.target.value)} className={INPUT_CLASS} placeholder="Optional; e.g. USD 8.50/m FOB" /></Field>
        </div>
        <Field label="Drawing or specification (optional, max 3 MB)">
          <input
            type="file"
            accept={ATTACHMENT_ACCEPT}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setAttachment(file);
              setError(file && file.size > MAX_ATTACHMENT_BYTES ? "Attachment must be 3 MB or smaller." : null);
            }}
            className={`${INPUT_CLASS} file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs`}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">PDF, CAD, spreadsheet, document, ZIP or image. One file only.</p>
        </Field>
        <Field label="Additional requirements"><textarea rows={4} maxLength={4000} value={form.extraRequirements} onChange={(e) => update("extraRequirements", e.target.value)} className={`${INPUT_CLASS} resize-y`} placeholder="Tolerances, packaging, inspection, payment terms or known constraints…" /></Field>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-md border border-border/70 p-3"><input type="checkbox" checked={form.sampleRequired} onChange={(e) => update("sampleRequired", e.target.checked)} className="mt-0.5" /><span>Sample required before production</span></label>
          <label className="flex items-start gap-2 rounded-md border border-border/70 p-3"><input type="checkbox" checked={form.ndaRequired} onChange={(e) => update("ndaRequired", e.target.checked)} className="mt-0.5" /><span>NDA requested before technical-file release</span></label>
        </div>
      </fieldset>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      <Button type="submit" size="lg" disabled={loading || Boolean(attachment && attachment.size > MAX_ATTACHMENT_BYTES)} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Submit RFQ"}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">No account required. Your RFQ is shared only with the sourcing desk and relevant supplier contacts.</p>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}{required && <span className="ml-1 text-destructive">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const INPUT_CLASS = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20";
