/**
 * POST /api/v1/rfq
 *
 * Accepts a material inquiry / RFQ form submission.
 * - Writes a record to the `inquiries` table (reusing existing schema via subject+message)
 * - Dispatches email notifications to relevant suppliers (best-effort)
 * - Returns 201 on success regardless of email outcome
 *
 * No auth required — open to anonymous buyers.
 *
 * TODO (next iteration): add a dedicated `rfq_submissions` table with all fields as columns,
 * and a /dashboard/inquiries admin view.
 */

import { NextRequest, NextResponse } from "next/server";
import { dispatchToSuppliers, type RfqPayload } from "@/lib/inquiries/dispatch";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    materialId,
    materialName,
    company,
    name,
    email,
    phone,
    quantity,
    application,
    extraRequirements,
    category,
    targetSupplierId,
  } = body as Record<string, string | undefined>;

  // Validate required fields
  if (!materialId || !materialName || !company || !name || !email || !quantity) {
    return NextResponse.json(
      { error: "materialId, materialName, company, name, email, quantity 必填" },
      { status: 400 }
    );
  }

  const id = globalThis.crypto.randomUUID();

  const rfq: RfqPayload = {
    id,
    materialId,
    materialName,
    company,
    name,
    email,
    phone: phone ?? null,
    quantity,
    application: application ?? null,
    extraRequirements: extraRequirements ?? null,
    // category comes from client; fallback to empty so dispatch uses default
    category: category ?? "",
    targetSupplierId: targetSupplierId ?? null,
  };

  // Dispatch emails best-effort (non-blocking for response)
  dispatchToSuppliers(rfq).catch((err) => {
    console.error("[rfq] dispatchToSuppliers error:", err);
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
