import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { CONTACT } from "@/lib/contact";
import {
  getPlan,
  personalPlans,
  formatPrice,
  type PlanId,
  type Plan,
} from "@/lib/pricing";
import { effectiveTier, tierLabel, type MembershipTier } from "@/lib/membership";

export const dynamic = "force-dynamic";

type SearchParams = { plan?: string; status?: string; pending?: string };

function PlanRow({
  plan,
  currentTier,
}: {
  plan: Plan;
  currentTier: MembershipTier;
}) {
  const isCurrent = plan.tier === currentTier;
  const price = formatPrice(plan.priceCents, plan.period, "zh");
  const highlight = plan.id === "pro_yearly" && !isCurrent;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 ${
        isCurrent
          ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40"
          : highlight
            ? "border-emerald-400 ring-2 ring-emerald-300/40 dark:border-emerald-500"
            : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {isCurrent ? (
        <div className="absolute -top-3 left-5 rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-200 dark:text-zinc-900">
          当前方案
        </div>
      ) : plan.badgeZh ? (
        <div
          className={`absolute -top-3 left-5 rounded-full px-2 py-0.5 text-xs font-medium ${
            highlight
              ? "bg-emerald-500 text-white"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {plan.badgeZh}
        </div>
      ) : null}

      <div className="mb-3">
        <h3 className="text-lg font-semibold">{plan.nameZh}</h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {plan.taglineZh}
        </p>
      </div>
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{price}</span>
        {plan.trialDays && !isCurrent ? (
          <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
            首 {plan.trialDays} 天免费
          </span>
        ) : null}
      </div>
      <ul className="mb-5 flex-1 space-y-1.5 text-[13px]">
        {plan.featuresZh.map((f) => (
          <li key={f} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-emerald-500">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="rounded-lg bg-zinc-100 px-4 py-2.5 text-center text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          已订阅
        </div>
      ) : plan.id === "free" ? (
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-100 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          回到免费档
        </Link>
      ) : (
        <Link
          href={`/api/checkout?plan=${plan.id}`}
          className={`rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
            highlight
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          }`}
        >
          {plan.trialDays ? `免费试用 ${plan.trialDays} 天` : "立即订阅"}
        </Link>
      )}
    </div>
  );
}

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

  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  const currentTier = u ? effectiveTier(u) : "free";

  const successful = sp.status === "success";
  const stripePending = sp.pending === "stripe-not-configured";
  const plans = personalPlans();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold">订阅升级</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          当前权益：<span className="font-medium">{tierLabel(currentTier)}</span>
          {currentTier !== "free"
            ? "（如需取消订阅，请前往「设置 → 订阅管理」）"
            : null}
        </p>
      </div>

      {successful ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-900/30">
          <h2 className="mb-1 text-lg font-semibold text-emerald-800 dark:text-emerald-300">
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
        <div className="mb-6 rounded-2xl bg-amber-50 p-6 dark:bg-amber-900/30">
          <h2 className="mb-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
            在线支付暂未开通，已为你保留升级意向
          </h2>
          <p className="mb-3 text-sm text-amber-800/90 dark:text-amber-300/90">
            {plan
              ? `你选择的方案：${plan.nameZh}（¥${(plan.priceCents / 100).toLocaleString("zh-CN")}）。`
              : null}
            请联系销售完成对公转账，到账当日开通：
          </p>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
            <li>• 联系人：{CONTACT.name}</li>
            <li>
              • 电话 / 微信：
              <a
                href={`tel:+86${CONTACT.phoneRaw}`}
                className="ml-1 text-emerald-600 hover:underline"
              >
                {CONTACT.phone}
              </a>
            </li>
            <li>
              • 邮箱：
              <a
                href={`mailto:${CONTACT.email}`}
                className="ml-1 text-emerald-600 hover:underline"
              >
                {CONTACT.email}
              </a>
            </li>
          </ul>
        </div>
      ) : null}

      {/* ─────────── Plan cards (moved up — primary action) ─────────── */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">个人方案</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            复材站对个人永久免费 · 仅高频 AI 用户需付费
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <PlanRow key={p.id} plan={p} currentTier={currentTier} />
          ))}
        </div>
      </section>

      {/* ─────────── Overseas spotlight ─────────── */}
      <section className="mb-10 rounded-2xl border border-foreground/15 bg-foreground/[0.02] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              企业 / 供应商出海
            </div>
            <p className="mt-1 text-sm">
              企业年费已下架。供应商通过{" "}
              <Link
                href="/overseas"
                className="font-medium text-foreground underline underline-offset-2"
              >
                /overseas
              </Link>{" "}
              按有效 RFQ 付费（¥300-500/条）变现，可选成交分成代理。
            </p>
          </div>
          <Link
            href="/overseas"
            className="self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 sm:self-auto"
          >
            查看出海方案 →
          </Link>
        </div>
      </section>

      {/* ─────────── Payment methods (moved down) ─────────── */}
      <section className="mb-6 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-3 text-base font-semibold">支付方式</h2>
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-1 font-medium">Stripe（境外卡）</div>
            <div className="text-xs text-zinc-500">
              支持 Visa / Master / Amex，自动续费
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-1 font-medium">微信支付</div>
            <div className="text-xs text-zinc-500">
              扫码下单，到账即开通（联系销售）
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-1 font-medium">支付宝 / 对公转账</div>
            <div className="text-xs text-zinc-500">
              企业用户首选，开发票（联系销售）
            </div>
          </div>
        </div>
      </section>

      <section className="text-center">
        <Link
          href="/pricing"
          className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
        >
          查看完整套餐对比 →
        </Link>
      </section>
    </main>
  );
}
