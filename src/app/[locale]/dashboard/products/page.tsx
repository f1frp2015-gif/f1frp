import { desc, eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { enterprises, supplierProducts } from "@/lib/db/schema";
import { ProductsClient } from "./products-client";

export default async function SupplierProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();

  if (!me?.enterpriseId) {
    return <ProductsClient enterprise={null} initialProducts={[]} />;
  }

  const [[enterprise], products] = await Promise.all([
    db
      .select({ id: enterprises.id, name: enterprises.name, status: enterprises.status })
      .from(enterprises)
      .where(eq(enterprises.id, me.enterpriseId))
      .limit(1),
    db
      .select()
      .from(supplierProducts)
      .where(eq(supplierProducts.enterpriseId, me.enterpriseId))
      .orderBy(desc(supplierProducts.createdAt)),
  ]);

  return (
    <ProductsClient
      enterprise={enterprise ?? null}
      initialProducts={products.map((product) => ({
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        reviewedAt: product.reviewedAt?.toISOString() ?? null,
      }))}
    />
  );
}
