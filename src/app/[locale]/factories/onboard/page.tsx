import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { alternates } from "@/lib/seo";
import { OnboardForm } from "./onboard-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "zh") return { robots: { index: false, follow: false } };
  return {
    title: "申请加入早期 30 家工厂 | f1frp 工厂 AI 询盘助手",
    description:
      "前 30 家工厂签约锁定 S2 ¥1,500/月早鸟价 36 个月。提交表单后 1 个工作日内电话/微信联系。",
    alternates: alternates("/factories/onboard"),
    robots: { index: true, follow: true },
  };
}

export default async function OnboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();
  const { tier } = await searchParams;

  const initialTier = (() => {
    switch (tier) {
      case "s1_starter":
      case "s2_pro":
      case "s5_enterprise":
        return tier;
      default:
        return "undecided";
    }
  })();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "申请加入早期 30 家工厂",
          inLanguage: "zh-CN",
          description:
            "复材工厂 AI 询盘助手 S2 产品早鸟申请表 — 60 天 H1 验证窗口。",
        }}
      />
      <PageBreadcrumbs
        homeLabel="首页"
        trail={[
          { label: "工厂出海", href: "/factories" },
          { label: "申请加入", href: "/factories/onboard" },
        ]}
      />

      <header className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          STEP 01 OF 03 · 申请阶段
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          告诉我们你工厂的情况
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          1 个工作日内有人联系你 —— 我们的客户成功团队(P1 阶段创始人亲自接)
          会先 30 分钟电话/微信确认是否合适合作。不合适我们直说不浪费你时间。
        </p>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">隐私承诺:</strong>{" "}
          表单数据只用于联系你与判断 fit,不分享给任何第三方,不用于 AI 训练。
          如果合作不成功,数据 60 天内删除。
        </p>
      </header>

      <OnboardForm initialTier={initialTier} />
    </div>
  );
}
