import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const gate = await gateAdmin();
  if (!gate.ok) redirect(gate.status === 401 ? "/sign-in?redirect_url=/dashboard/admin/subscriptions" : "/dashboard");
  const rows = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      tier: subscriptions.tier,
      provider: subscriptions.provider,
      amountCents: subscriptions.amountCents,
      currency: subscriptions.currency,
      status: subscriptions.status,
      startedAt: subscriptions.startedAt,
      expiresAt: subscriptions.expiresAt,
      userId: subscriptions.userId,
      enterpriseId: subscriptions.enterpriseId,
      userEmail: users.email,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(200);

  const totalRevenueCents = rows
    .filter((r) => r.status === "active" || r.status === "trialing")
    .reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <main className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">订阅记录</h1>
        <div className="text-sm text-zinc-500">
          活跃 GMV：
          <span className="text-emerald-600 font-semibold ml-1">
            ¥{(totalRevenueCents / 100).toLocaleString("zh-CN")}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="text-left px-3 py-2">用户</th>
              <th className="text-left px-3 py-2">套餐</th>
              <th className="text-left px-3 py-2">Tier</th>
              <th className="text-left px-3 py-2">渠道</th>
              <th className="text-right px-3 py-2">金额</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2">起始</th>
              <th className="text-left px-3 py-2">到期</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 truncate max-w-[200px]">{r.userEmail ?? r.userId?.slice(0, 8)}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.plan}</td>
                <td className="px-3 py-2">{r.tier}</td>
                <td className="px-3 py-2">{r.provider}</td>
                <td className="px-3 py-2 text-right">¥{(r.amountCents / 100).toLocaleString("zh-CN")}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      r.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "trialing"
                        ? "bg-blue-100 text-blue-700"
                        : r.status === "canceled"
                        ? "bg-zinc-200 text-zinc-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">{r.startedAt.toISOString().slice(0, 10)}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">{r.expiresAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-8">暂无订阅记录。</p>
        ) : null}
      </div>
    </main>
  );
}
