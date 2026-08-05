"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import {
  enterprises,
  supplierListings,
  supplierProducts,
} from "@/lib/db/schema";
import {
  MATERIAL_SYSTEMS,
  OBJECT_TYPES,
  PROCESS_TYPES,
  PRODUCT_FAMILIES,
  PRODUCT_FORMS,
  RESIN_SYSTEMS,
  classifySupplierProduct,
  taxonomyLabel,
} from "@/lib/supplier-products/taxonomy";

const ProductInputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().min(2).max(200),
  description: z.string().trim().max(3000).optional().default(""),
  descriptionEn: z.string().trim().max(3000).optional().default(""),
  standards: z.string().trim().max(800).optional().default(""),
  dimensions: z.string().trim().max(300).optional().default(""),
  model: z.string().trim().max(120).optional().default(""),
  moq: z.string().trim().max(80).optional().default(""),
  leadTime: z.string().trim().max(80).optional().default(""),
  overrideObjectType: z.enum(OBJECT_TYPES).optional(),
  overrideProductFamily: z.enum(PRODUCT_FAMILIES).optional(),
  overrideForm: z.enum(PRODUCT_FORMS).optional(),
  overrideProcess: z.enum(PROCESS_TYPES).optional(),
  overrideMaterial: z.enum(MATERIAL_SYSTEMS).optional(),
  overrideResin: z.enum(RESIN_SYSTEMS).optional(),
  datasheetKey: z.string().trim().max(500).optional().default(""),
  datasheetFileName: z.string().trim().max(200).optional().default(""),
});

export type CreateSupplierProductInput = z.input<typeof ProductInputSchema>;

export type CreateSupplierProductResult =
  | {
      ok: true;
      product: typeof supplierProducts.$inferSelect;
      message: string;
    }
  | { ok: false; error: string };

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

export async function createSupplierProduct(
  input: CreateSupplierProductInput,
): Promise<CreateSupplierProductResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "请先登录" };
  if (!me.enterpriseId) {
    return { ok: false, error: "请先认领企业或完成企业入驻" };
  }
  if (!["enterprise_admin", "enterprise_member", "admin"].includes(me.role)) {
    return { ok: false, error: "当前账号没有管理企业产品的权限" };
  }

  const parsed = ProductInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "请检查中英文产品名及字段长度" };
  }
  const values = parsed.data;
  if (
    values.datasheetKey &&
    !values.datasheetKey.startsWith(`enterprise-docs/product/${me.id}/`)
  ) {
    return { ok: false, error: "产品资料文件来源无效，请重新上传" };
  }

  const [enterprise] = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, me.enterpriseId))
    .limit(1);
  if (!enterprise) return { ok: false, error: "关联企业不存在" };

  const [listing] = await db
    .select()
    .from(supplierListings)
    .where(eq(supplierListings.enterpriseId, enterprise.id))
    .orderBy(desc(supplierListings.profilePublished))
    .limit(1);

  const suggested = classifySupplierProduct(values);
  const objectType = values.overrideObjectType ?? suggested.objectType;
  const productFamily = values.overrideProductFamily ?? suggested.productFamily;
  const form = values.overrideForm ?? suggested.form;
  const processes = unique([
    values.overrideProcess,
    ...suggested.processes.filter((item) => item !== values.overrideProcess),
  ]);
  const materials = unique([
    values.overrideMaterial,
    ...suggested.materials.filter((item) => item !== values.overrideMaterial),
  ]);
  const resins = unique([
    values.overrideResin,
    ...suggested.resins.filter((item) => item !== values.overrideResin),
  ]);
  const specifications = Object.fromEntries(
    Object.entries({
      model: values.model,
      dimensions: values.dimensions,
      moq: values.moq,
      lead_time: values.leadTime,
    }).filter(([, value]) => value),
  );
  const publicationStatus = enterprise.status === "verified" ? "published" : "draft";
  const overrideEvidence = [
    values.overrideObjectType ? "供应商调整了对象类型" : null,
    values.overrideProductFamily ? "供应商调整了产品族" : null,
    values.overrideForm ? "供应商调整了产品形态" : null,
    values.overrideProcess ? "供应商确认了主工艺" : null,
    values.overrideMaterial ? "供应商确认了主增强材料" : null,
    values.overrideResin ? "供应商确认了树脂体系" : null,
  ].filter(Boolean) as string[];

  try {
    const [product] = await db
      .insert(supplierProducts)
      .values({
        enterpriseId: enterprise.id,
        supplierListingId: listing?.id ?? null,
        createdByUserId: me.id,
        name: values.name,
        nameEn: values.nameEn,
        description: values.description || null,
        descriptionEn: values.descriptionEn || null,
        objectType,
        productFamily,
        form,
        processes,
        materials,
        resins,
        applications: suggested.applications,
        standards: suggested.standards,
        specifications,
        datasheetKey: values.datasheetKey || null,
        datasheetFileName: values.datasheetFileName || null,
        classificationStatus: "supplier_confirmed",
        classificationSource: "deterministic_rule",
        classificationRuleVersion: suggested.ruleVersion,
        classificationConfidence: suggested.confidence,
        classificationEvidence: unique([...suggested.evidence, ...overrideEvidence]),
        publicationStatus,
      })
      .returning();

    const processNamesZh = processes.map((item) => taxonomyLabel("process", item, "zh"));
    const processNamesEn = processes.map((item) => taxonomyLabel("process", item, "en"));
    await db
      .update(enterprises)
      .set({
        products: unique([...(enterprise.products ?? []), values.name]),
        processes: unique([...(enterprise.processes ?? []), ...processNamesZh]),
        updatedAt: new Date(),
      })
      .where(eq(enterprises.id, enterprise.id));

    if (listing) {
      await db
        .update(supplierListings)
        .set({
          products: unique([...(listing.products ?? []), values.name]),
          productsEn: unique([...(listing.productsEn ?? []), values.nameEn]),
          processList: unique([...(listing.processList ?? []), ...processNamesZh]),
          processListEn: unique([...(listing.processListEn ?? []), ...processNamesEn]),
          updatedAt: new Date(),
        })
        .where(eq(supplierListings.id, listing.id));
      revalidatePath(`/zh/suppliers/${listing.id}`);
      revalidatePath(`/en/suppliers/${listing.id}`);
    }
    revalidatePath("/zh/dashboard/products");

    return {
      ok: true,
      product,
      message:
        publicationStatus === "published"
          ? "产品已保存并以“供应商确认”身份发布，平台核验状态保持独立。"
          : "产品已保存为草稿；企业身份审核通过后可公开展示。",
    };
  } catch (error) {
    console.error("[supplier-products] create failed:", error);
    return { ok: false, error: "产品保存失败，请稍后重试" };
  }
}

export async function archiveSupplierProduct(productId: string) {
  const me = await getCurrentUser();
  if (!me?.enterpriseId) return { ok: false, error: "无权操作" } as const;

  const [product] = await db
    .select({ id: supplierProducts.id, supplierListingId: supplierProducts.supplierListingId })
    .from(supplierProducts)
    .where(
      and(
        eq(supplierProducts.id, productId),
        eq(supplierProducts.enterpriseId, me.enterpriseId),
      ),
    )
    .limit(1);
  if (!product) return { ok: false, error: "产品不存在" } as const;

  await db
    .update(supplierProducts)
    .set({ publicationStatus: "archived", updatedAt: new Date() })
    .where(eq(supplierProducts.id, product.id));
  revalidatePath("/zh/dashboard/products");
  if (product.supplierListingId) {
    revalidatePath(`/zh/suppliers/${product.supplierListingId}`);
    revalidatePath(`/en/suppliers/${product.supplierListingId}`);
  }
  return { ok: true } as const;
}
