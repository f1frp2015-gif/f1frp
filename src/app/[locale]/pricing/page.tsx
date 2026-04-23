import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { personalPlans, supplierPlans, formatPrice, type Plan } from "@/lib/pricing";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "套餐价格 / Pricing | f1frp",
  description: "f1frp 复材平台收费方案：免费版、学生版、专业版、团队版；供应商 Verified / Featured。",
  alternates: {
    canonical: "https://f1frp.com/pricing",
    languages: {
      zh: "https://f1frp.com/pricing",
      en: "https://f1frp.com/en/pricing",
    },
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
      ? lang === "zh" ? "立即注册" : "Sign up free"
      : plan.id === "student"
      ? lang === "zh" ? "学生认证" : "Verify student"
      : plan.audience === "supplier"
      ? lang === "zh" ? "申请升级" : "Request upgrade"
      : plan.trialDays
      ? lang === "zh" ? `免费试用 ${plan.trialDays} 天` : `Try ${plan.trialDays} days free`
      : lang === "zh" ? "立即订阅" : "Subscribe";

  const ctaHref =
    plan.id === "free"
      ? "/sign-up"
      : plan.id === "student"
      ? "/dashboard/verify-student"
      : plan.audience === "supplier"
      ? "/dashboard/supplier-upgrade"
      : `/api/checkout?plan=${plan.id}`;

  const highlight = plan.badgeZh === "推荐" || plan.id === "pro_yearly";

  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col ${
        highlight
          ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-300/50 shadow-lg"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {badge ? (
        <div
          className={`absolute -top-3 left-6 px-2 py-0.5 text-xs font-medium rounded-full ${
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{tagline}</p>
      </div>
      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        {plan.trialDays ? (
          <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-2">
            {lang === "zh" ? `首 ${plan.trialDays} 天免费` : `${plan.trialDays}-day free trial`}
          </span>
        ) : null}
      </div>
      <ul className="space-y-2 text-sm flex-1 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`text-center px-4 py-2.5 rounded-lg font-medium transition ${
          highlight
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white"
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export default async function PricingPage() {
  const locale = (await getLocale()) as "zh" | "en";
  const lang: "zh" | "en" = locale === "en" ? "en" : "zh";

  const personal = personalPlans();
  const supplier = supplierPlans();

  return (
    <main className="container max-w-7xl mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          {lang === "zh" ? "选择最适合你的方案" : "Choose your plan"}
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          {lang === "zh"
            ? "学生免费、工程师一杯奶茶钱、供应商按价值付费 —— 三档分明。"
            : "Free for students, affordable for engineers, value-priced for suppliers."}
        </p>
      </header>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {lang === "zh" ? "个人 — 工程师 / 设计师 / 学生" : "Personal — Engineers / Designers / Students"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {personal.map((p) => (
            <PlanCard key={p.id} plan={p} lang={lang} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {lang === "zh" ? "供应商 — 复材生产 / 贸易企业" : "Suppliers — Manufacturers & Traders"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {supplier.map((p) => (
            <PlanCard key={p.id} plan={p} lang={lang} />
          ))}
        </div>
        <p className="text-center text-sm text-zinc-500 mt-4">
          {lang === "zh"
            ? "Featured 每个品类前 10 名限额。已认领企业请到「控制台 → 升级供应商版」申请。"
            : "Featured: 10 slots per category. Claimed enterprises: apply via Dashboard → Supplier Upgrade."}
        </p>
      </section>

      <section className="text-center text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto space-y-2">
        <p>
          {lang === "zh"
            ? "支持微信支付 / 支付宝 / Stripe（境外卡）。年付可开企业增值税普通发票。"
            : "Pay via WeChat Pay / Alipay / Stripe. Annual plans get VAT invoice on request."}
        </p>
        <p>
          {lang === "zh" ? "联系销售：" : "Contact sales: "}
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{CONTACT.name}</span>
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
