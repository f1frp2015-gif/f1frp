import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, supplierClaims, supplierListings, enterprises } from "@/lib/db/schema";
import { CONTACT } from "@/lib/contact";
import SupplierUpgradeForm from "./form";

export const dynamic = "force-dynamic";

export default async function SupplierUpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/supplier-upgrade");

  const [u] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!u) redirect("/sign-in");

  const claims = await db
    .select({
      claimId: supplierClaims.id,
      listingId: supplierListings.id,
      listingName: supplierListings.name,
      enterpriseId: supplierListings.enterpriseId,
      enterpriseTier: enterprises.membershipTier,
      enterpriseCategory: enterprises.category,
    })
    .from(supplierClaims)
    .innerJoin(supplierListings, eq(supplierClaims.supplierListingId, supplierListings.id))
    .leftJoin(enterprises, eq(supplierListings.enterpriseId, enterprises.id))
    .where(and(eq(supplierClaims.userId, u.id), eq(supplierClaims.status, "approved")));

  const claimedListings = claims.map((c) => ({
    listingId: c.listingId,
    name: c.listingName,
    currentTier: c.enterpriseTier ?? "free",
    category: c.enterpriseCategory ?? "",
    enterpriseLinked: Boolean(c.enterpriseId),
  }));

  return (
    <main className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">供应商升级</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Verified（蓝标）¥3,800/年 · Featured（头部曝光）¥18,800/年（每品类前 10 名限额）。
        Verified 前 100 家自动 5 折。
      </p>

      {claimedListings.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-6">
          <h2 className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-200">
            还没有认领企业
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            请先到{" "}
            <a className="underline" href="/suppliers">
              供应商目录
            </a>{" "}
            找到自家企业，点击"认领此企业" → 等审核通过后再来这里申请升级。
          </p>
        </div>
      ) : (
        <SupplierUpgradeForm listings={claimedListings} />
      )}

      <section className="mt-10 text-sm text-center text-zinc-500 space-y-1">
        <p>
          有任何问题，直接联系销售：
          <span className="text-zinc-800 dark:text-zinc-200 font-medium ml-1">{CONTACT.name}</span>
          {" · "}
          <a className="text-emerald-600 hover:underline" href={`tel:+86${CONTACT.phoneRaw}`}>
            {CONTACT.phone}
          </a>
          {" · "}
          <a className="text-emerald-600 hover:underline" href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>
        </p>
      </section>
    </main>
  );
}
