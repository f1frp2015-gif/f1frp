/**
 * POST /api/v1/rfq
 *
 * Accepts both multipart buyer RFQs and the legacy JSON material inquiry.
 * Delivery is scheduled with `after`, so the response can return promptly
 * without abandoning supplier email dispatch when the request lifecycle ends.
 */

import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dispatchToSuppliers, type RfqPayload } from "@/lib/inquiries/dispatch";

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  "pdf", "step", "stp", "iges", "igs", "dxf", "dwg", "xlsx", "xls",
  "csv", "doc", "docx", "zip", "jpg", "jpeg", "png",
]);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

const rfqSchema = z.object({
  materialId: z.string().trim().min(1).max(200),
  materialName: z.string().trim().min(1).max(300),
  company: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: optionalText(60),
  quantity: z.string().trim().min(1).max(160),
  application: optionalText(300),
  extraRequirements: optionalText(4000),
  category: optionalText(80),
  targetSupplierId: optionalText(200),
  destinationCountry: optionalText(100),
  deliveryDate: optionalText(40),
  incoterm: optionalText(40),
  standards: optionalText(300),
  targetPrice: optionalText(120),
  sampleRequired: z.boolean().optional().default(false),
  ndaRequired: z.boolean().optional().default(false),
});

function stringValue(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on" || value === "1";
}

function safeFilename(name: string): string {
  return name.split(/[\\/]/).pop()?.replace(/[\r\n"]/g, "_") || "attachment";
}

export async function POST(req: NextRequest) {
  let raw: Record<string, unknown>;
  let attachment: RfqPayload["attachment"];

  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      raw = {
        materialId: stringValue(form.get("materialId")),
        materialName: stringValue(form.get("materialName")),
        company: stringValue(form.get("company")),
        name: stringValue(form.get("name")),
        email: stringValue(form.get("email")),
        phone: stringValue(form.get("phone")),
        quantity: stringValue(form.get("quantity")),
        application: stringValue(form.get("application")),
        extraRequirements: stringValue(form.get("extraRequirements")),
        category: stringValue(form.get("category")),
        targetSupplierId: stringValue(form.get("targetSupplierId")),
        destinationCountry: stringValue(form.get("destinationCountry")),
        deliveryDate: stringValue(form.get("deliveryDate")),
        incoterm: stringValue(form.get("incoterm")),
        standards: stringValue(form.get("standards")),
        targetPrice: stringValue(form.get("targetPrice")),
        sampleRequired: booleanValue(form.get("sampleRequired")),
        ndaRequired: booleanValue(form.get("ndaRequired")),
      };

      const file = form.get("attachment");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          return NextResponse.json(
            { error: "Attachment must be 3 MB or smaller." },
            { status: 413 },
          );
        }
        const filename = safeFilename(file.name);
        const extension = filename.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
          return NextResponse.json(
            { error: "Unsupported attachment type." },
            { status: 415 },
          );
        }
        attachment = {
          filename,
          content: Buffer.from(await file.arrayBuffer()).toString("base64"),
        };
      }
    } else {
      raw = (await req.json()) as Record<string, unknown>;
      raw.sampleRequired = raw.sampleRequired === true;
      raw.ndaRequired = raw.ndaRequired === true;
    }
  } catch {
    return NextResponse.json({ error: "Invalid RFQ payload." }, { status: 400 });
  }

  const parsed = rfqSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Please check the required fields." },
      { status: 400 },
    );
  }

  const id = globalThis.crypto.randomUUID();
  const data = parsed.data;
  const rfq: RfqPayload = {
    id,
    materialId: data.materialId,
    materialName: data.materialName,
    company: data.company,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    quantity: data.quantity,
    application: data.application ?? null,
    extraRequirements: data.extraRequirements ?? null,
    category: data.category ?? "",
    targetSupplierId: data.targetSupplierId ?? null,
    destinationCountry: data.destinationCountry ?? null,
    deliveryDate: data.deliveryDate ?? null,
    incoterm: data.incoterm ?? null,
    standards: data.standards ?? null,
    targetPrice: data.targetPrice ?? null,
    sampleRequired: data.sampleRequired,
    ndaRequired: data.ndaRequired,
    attachment,
  };

  after(async () => {
    try {
      await dispatchToSuppliers(rfq);
    } catch (error) {
      console.error("[rfq] dispatchToSuppliers error:", error);
    }
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
