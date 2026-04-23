import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { CONTACT } from "@/lib/contact";
import { getPlan, type PlanId } from "@/lib/pricing";
import { effectiveTier, tierLabel } from "@/lib/membership";

export const dynamic = "force-dynamic";

type SearchParams = { plan?: string; status?: string; pending?: string };

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/upgrade");

  const sp = await searchParams;
  const planId = sp.plan as PlanId | undefined;
  const plan = planId ? getPlan(planId) : undefined;

  const [u] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  const currentTier = u ? effectiveTier(u) : "free";

  const successful = sp.status === "success";
  const stripePending = sp.pending === "stripe-not-configured";

  return (
    <main className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">订阅升级</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        当前权益：<span className="font-medium">{tierLabel(currentTier)}</span>
      </p>

      {successful ? (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            订阅成功 🎉
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            订阅已激活。可能需要 1–2 分钟同步。如有问题联系{" "}
            <a href={`mailto:${CONTACT.email}`} className="underline">
              {CONTACT.email}
            </a>
            。
          </p>
        </div>
      ) : null}

      {stripePending ? (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/30 p-6 mb-6">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
            在线支付暂未开通，已为你保留升级意向
          </h2>
          <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mb-3">
            {plan ? `你选择的方案：${plan.nameZh}（¥${(plan.priceCents / 100).toLocaleString("zh-CN")}）。` : null}
            请联系销售完成对公转账，到账当日开通：
          </p>
          <ul className="text-sm space-y-1 text-zinc-700 dark:text-zinc-200">
            <li>• 联系人：{CONTACT.name}</li>
            <li>
              • 电话 / 微信：
              <a href={`tel:+86${CONTACT.phoneRaw}`} className="text-emerald-600 hover:underline ml-1">
                {CONTACT.phone}
              </a>
            </li>
            <li>
              • 邮箱：
              <a href={`mailto:${CONTACT.email}`} className="text-emerald-600 hover:underline ml-1">
                {CONTACT.email}
              </a>
            </li>
          </ul>
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">支付方式</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
            <div className="font-medium mb-1">Stripe（境外卡）</div>
            <div className="text-zinc-500">支持 Visa / Master / Amex，自动续费</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
            <div className="font-medium mb-1">微信支付</div>
            <div className="text-zinc-500">扫码下单，到账即开通（联系销售）</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
            <div className="font-medium mb-1">支付宝 / 对公转账</div>
            <div className="text-zinc-500">企业用户首选，开发票（联系销售）</div>
          </div>
        </div>
      </section>

      <section className="text-center">
        <a
          href="/pricing"
          className="inline-block px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-medium"
        >
          返回套餐对比
        </a>
      </section>
    </main>
  );
}
