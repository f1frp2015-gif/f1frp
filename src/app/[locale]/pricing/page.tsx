import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { personalPlans, formatPrice, type Plan } from "@/lib/pricing";
import { CONTACT } from "@/lib/contact";
import { PaymentDialog } from "@/components/payment/payment-dialog";

// 仅中文站（f1frp.com）需要套餐页 — getfrp.com 海外侧已取消会员/收费体系
export const metadata: Metadata = {
  title: "套餐价格 / Pricing | f1frp",
  description:
    "复材站对个人 100% 免费，AI 重度用户可选 ¥29/月 高频版；供应商出海变现走 /overseas 按有效 RFQ 付费方案，无任何企业年费。",
  alternates: {
    canonical: "https://f1frp.com/pricing",
  },
};

function PlanCard({ plan, lang }: { plan: Plan; lang: "zh" | "en" }) {
  const name = lang === "zh" ? plan.nameZh : plan.nameEn;
  const tagline = lang === "zh" ? plan.taglineZh : plan.taglineEn;
  const features = lang === "zh" ? plan.featuresZh : plan.featuresEn;
  const badge = lang === "zh" ? plan.badgeZh : plan.badgeEn;
  const price = formatPrice(plan.priceCents, plan.period, lang);

  const ctaLabel =
    plan.id === "free"
      ? lang === "zh"
        ? "立即注册"
        : "Sign up free"
      : plan.trialDays
        ? lang === "zh"
          ? `免费试用 ${plan.trialDays} 天`
          : `Try ${plan.trialDays} days free`
        : lang === "zh"
          ? "立即订阅"
          : "Subscribe";

  const ctaHref =
    plan.id === "free" ? "/sign-up" : `/api/checkout?plan=${plan.id}`;

  const highlight = plan.badgeZh === "推荐" || plan.id === "pro_yearly";

  const ctaClass = `rounded-lg px-4 py-2.5 text-center font-medium transition ${
    highlight
      ? "bg-emerald-500 text-white hover:bg-emerald-600"
      : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
  }`;

  // 国内 zh + 付费 plan：走对公转账（一次性付一个周期的费用，admin 对账后开通会员）
  // 海外 en + 付费 plan：走 Stripe 订阅（已有，自动续订）
  // 免费档：直接 /sign-up
  const useDomesticPay = lang === "zh" && plan.id !== "free" && plan.priceCents > 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        highlight
          ? "border-emerald-400 ring-2 ring-emerald-300/50 shadow-lg dark:border-emerald-500"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {badge ? (
        <div
          className={`absolute -top-3 left-6 rounded-full px-2 py-0.5 text-xs font-medium ${
            highlight
              ? "bg-emerald-500 text-white"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {badge}
        </div>
      ) : null}
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tagline}</p>
      </div>
      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        {plan.trialDays ? (
          <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400">
            {lang === "zh"
              ? `首 ${plan.trialDays} 天免费`
              : `${plan.trialDays}-day free trial`}
          </span>
        ) : null}
      </div>
      <ul className="mb-6 flex-1 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-500">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {useDomesticPay ? (
        <PaymentDialog
          orderType="pro_membership"
          amountCents={plan.priceCents}
          relatedId={plan.id}
          triggerLabel={ctaLabel}
          triggerClassName={ctaClass}
          dialogTitle={`开通 ${name}`}
          dialogDescription={`¥${(plan.priceCents / 100).toFixed(2)} · ${plan.period === "year" ? "1 年期" : "1 个月"} · 银行对公转账，对账后自动开通会员权益`}
        />
      ) : (
        <Link href={ctaHref} className={ctaClass}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export default async function PricingPage() {
  const locale = (await getLocale()) as "zh" | "en";
  if (locale === "en") notFound();
  const lang: "zh" | "en" = "zh";

  const personal = personalPlans();

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">
          {lang === "zh"
            ? "复材站对个人永久免费"
            : "f1frp is free for individuals — forever"}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          {lang === "zh"
            ? "全部 DB / 论文 / 专利 / 标准 / 供应商资料免费访问。仅高频使用 AI 助手的工程师 / 设计师可选一档付费版。供应商出海变现走 /overseas 按有效 RFQ 付费方案，无任何企业年费。"
            : "Full database access is free. Only heavy AI users opt into a single Pro tier. Supplier monetization happens at /overseas via pay-per-verified-RFQ — no enterprise annual fees."}
        </p>
      </header>

      {/* ─────────── Overseas spotlight banner — main supplier monetization ─────────── */}
      <section className="mb-16 rounded-2xl border-2 border-foreground/20 bg-foreground/[0.03] p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {lang === "zh"
                ? "供应商 / 复材厂家 — 出海变现"
                : "Suppliers — Overseas monetization"}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {lang === "zh"
                ? "想接海外订单？看 /overseas 出海方案"
                : "Want overseas orders? See /overseas"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {lang === "zh"
                ? "0 元入驻 + 按有效 RFQ 付费（¥300-500/条）+ 可选全链路代理（成交 1-3% GMV）。无会员费、无最低消费、不合格 RFQ 不收钱。"
                : "Free signup + pay-per-verified-RFQ (¥300-500/RFQ) + optional full-service agency (1-3% of order GMV). No membership fee, no minimum spend."}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
              <li>· {lang === "zh" ? "AI 自动生成英文站资产" : "AI-generated English site"}</li>
              <li>· {lang === "zh" ? "SEO + GEO 双轨获流" : "SEO + GEO traffic"}</li>
              <li>· {lang === "zh" ? "AI 询盘助手 24/7 英文回复" : "24/7 AI inquiry assistant"}</li>
              <li>· {lang === "zh" ? "曜一全链路代理（合同/报关/CBAM/退税）" : "Yaoyi full-chain agency (contract / customs / CBAM)"}</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Link
              href="/overseas"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-5 py-3 text-base font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              {lang === "zh" ? "查看出海方案" : "See overseas plan"}
              <ArrowRight size={18} />
            </Link>
            <a
              href="https://getfrp.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {lang === "zh" ? "或直接访问 getfrp.com" : "Or visit getfrp.com"}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ─────────── Personal plans ─────────── */}
      <section className="mb-16">
        <h2 className="mb-2 text-center text-2xl font-semibold">
          {lang === "zh"
            ? "个人 — 工程师 / 设计师 / 学生 / 研究员"
            : "Personal — Engineers / Designers / Students / Researchers"}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
          {lang === "zh"
            ? "免费版 = 完整数据访问 + AI 助手 10 次/天，覆盖 95% 的日常使用。仅当你每天 AI 问答超过 10 次（典型为做研究 / 投标的工程师）时再考虑付费。"
            : "Free = full data + 10 AI Q&A/day, covering 95% of usage. Upgrade only if you hit the daily AI cap (typical for research-heavy engineers)."}
        </p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {personal.map((p) => (
            <PlanCard key={p.id} plan={p} lang={lang} />
          ))}
        </div>
      </section>

      {/* ─────────── Supplier path pointer ─────────── */}
      <section className="mb-12 rounded-lg border border-border/70 bg-zinc-50 p-6 dark:bg-zinc-900/50">
        <h3 className="text-base font-semibold tracking-tight">
          {lang === "zh" ? "面向供应商出海" : "For suppliers going overseas"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {lang === "zh" ? (
            <>
              企业出海变现走{" "}
              <Link href="/overseas" className="text-foreground underline underline-offset-2">
                /overseas 出海方案
              </Link>
              ：免费入驻 + 按有效 RFQ 付费 + 可选全链路代理分成。无任何会员年费。
            </>
          ) : (
            <>
              Suppliers monetize via{" "}
              <Link href="/overseas" className="text-foreground underline underline-offset-2">
                /overseas
              </Link>
              : free signup, pay-per-verified-RFQ, optional full-service agency commission. No annual fees.
            </>
          )}
        </p>
      </section>

      <section className="mx-auto max-w-3xl space-y-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          {lang === "zh"
            ? "支持微信支付 / 支付宝 / Stripe（境外卡）。AI 高频版可开企业增值税普通发票。"
            : "Pay via WeChat Pay / Alipay / Stripe. VAT invoice on request."}
        </p>
        <p>
          {lang === "zh" ? "联系销售：" : "Contact sales: "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{CONTACT.name}</span>
          {" · "}
          <a
            className="text-emerald-600 hover:underline"
            href={`tel:+86${CONTACT.phoneRaw}`}
          >
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
