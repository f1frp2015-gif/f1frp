import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { supplierClaims, supplierListings } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const [supplier] = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.id, id))
    .limit(1);
  if (!supplier) {
    return NextResponse.json({ error: "供应商不存在" }, { status: 404 });
  }
  if (supplier.enterpriseId) {
    return NextResponse.json(
      { error: "该企业已被认领" },
      { status: 409 }
    );
  }

  const existing = await db
    .select()
    .from(supplierClaims)
    .where(
      and(
        eq(supplierClaims.supplierListingId, id),
        eq(supplierClaims.userId, me.id),
        inArray(supplierClaims.status, ["pending", "approved"])
      )
    )
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "您已申请认领该企业，无需重复提交" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { contactName, contactTitle, contactPhone, contactEmail, businessLicenseUrl, note } = body ?? {};

  if (!contactName || !contactPhone || !contactEmail) {
    return NextResponse.json(
      { error: "姓名 / 电话 / 邮箱必填" },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(supplierClaims)
    .values({
      supplierListingId: id,
      userId: me.id,
      contactName,
      contactTitle: contactTitle ?? null,
      contactPhone,
      contactEmail,
      businessLicenseUrl: businessLicenseUrl ?? null,
      note: note ?? null,
    })
    .returning();

  return NextResponse.json(
    {
      data: {
        id: row.id,
        status: row.status,
        message: "认领申请已提交，管理员审核后将通过邮件或电话与您联系。",
      },
    },
    { status: 201 }
  );
}
