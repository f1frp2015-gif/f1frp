import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, enterprises, supplierUpgradeRequests } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import ApprovalActions from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSupplierUpgradesPage() {
  const gate = await gateAdmin();
  if (!gate.ok)
    redirect(gate.status === 401 ? "/sign-in?redirect_url=/dashboard/admin/supplier-upgrades" : "/dashboard");
  const rows = await db
    .select({
      id: supplierUpgradeRequests.id,
      targetTier: supplierUpgradeRequests.targetTier,
      targetCategory: supplierUpgradeRequests.targetCategory,
      contactName: supplierUpgradeRequests.contactName,
      contactPhone: supplierUpgradeRequests.contactPhone,
      contactWechat: supplierUpgradeRequests.contactWechat,
      note: supplierUpgradeRequests.note,
      status: supplierUpgradeRequests.status,
      discountApplied: supplierUpgradeRequests.discountApplied,
      createdAt: supplierUpgradeRequests.createdAt,
      enterpriseId: supplierUpgradeRequests.enterpriseId,
      enterpriseName: enterprises.name,
      currentTier: enterprises.membershipTier,
      userEmail: users.email,
    })
    .from(supplierUpgradeRequests)
    .leftJoin(enterprises, eq(supplierUpgradeRequests.enterpriseId, enterprises.id))
    .leftJoin(users, eq(supplierUpgradeRequests.userId, users.id))
    .orderBy(desc(supplierUpgradeRequests.createdAt))
    .limit(200);

  return (
    <main className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">供应商升级申请</h1>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="text-left px-3 py-2">企业 / 联系人</th>
              <th className="text-left px-3 py-2">目标 Tier</th>
              <th className="text-left px-3 py-2">品类</th>
              <th className="text-left px-3 py-2">折扣</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2">提交时间</th>
              <th className="text-right px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800 align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.enterpriseName ?? "—"}</div>
                  <div className="text-xs text-zinc-500">
                    {r.contactName} · {r.contactPhone}
                    {r.contactWechat ? ` · 微信:${r.contactWechat}` : ""}
                  </div>
                  <div className="text-xs text-zinc-500">{r.userEmail}</div>
                  {r.note ? <div className="text-xs text-zinc-400 mt-1">{r.note}</div> : null}
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs">{r.targetTier}</span>
                  <div className="text-xs text-zinc-500">当前 {r.currentTier}</div>
                </td>
                <td className="px-3 py-2 text-xs">{r.targetCategory ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{r.discountApplied ? `${r.discountApplied}%` : "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      r.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : r.status === "paid"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.status === "pending" ? (
                    <ApprovalActions
                      requestId={r.id}
                      enterpriseId={r.enterpriseId ?? ""}
                      targetTier={r.targetTier as "basic" | "pro"}
                      targetCategory={r.targetCategory ?? undefined}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-8">暂无升级申请。</p>
        ) : null}
      </div>
    </main>
  );
}
