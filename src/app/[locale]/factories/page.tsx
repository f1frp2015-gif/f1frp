import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bot, Mail, ShieldCheck, Sparkles, ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { alternates } from "@/lib/seo";

// /factories — 工厂 AI 助手产品方向介绍页(在研,非售卖)。
//
// 2026-05-24 起全站取消线上收费。本页只描述产品愿景 + 收集邮箱兴趣报名,
// 不展示分档、不展示价格。EN locale 不 serve(海外侧买家场景,不是工厂卖家)。

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "zh") return { robots: { index: false, follow: false } };
  return {
    title: "工厂 AI 助手 — 复材工厂出海的 AI 工具线(在研) | 复材站",
    description:
      "面向自营海外业务的复材工厂:AI 自动读海外询盘、抽取规格、草拟中英双语回复。工具产品方向在研,可联系邮箱报名内测。也可选择「全链路代理」由我们替工厂全包出海 → 见 /overseas。",
    alternates: alternates("/factories"),
  };
}

const CAPABILITIES = [
  {
    icon: Mail,
    title: "海外询盘统一收件箱",
    body:
      "工厂业务邮箱(QQ / Gmail / Outlook / 自建 IMAP)统一接入,Alibaba 后台、Google 搜来的、客户介绍的、展会回访的——全部进同一个 dashboard,不漏件、不重复。",
  },
  {
    icon: Sparkles,
    title: "AI 抽取关键信息",
    body:
      "每条询盘自动识别规格 / 数量 / 收货国 / Incoterm / 交期意向,结构化字段直接填进 RFQ 模板,业务员看 30 秒就知道这单值不值得跟。",
  },
  {
    icon: Bot,
    title: "中英双语回复草拟",
    body:
      "结合工厂自己的产品技术档案 + 国别商务习惯,AI 写双语回复初稿。业务员只看中文译稿决定要不要发,英文不好也能掌控全流程。",
  },
  {
    icon: ShieldCheck,
    title: "工厂自留客户关系",
    body:
      "客户邮箱、询盘内容、报价历史都留在工厂自己的账户内,平台只做工具不做中间商。和「全链路代理」是两条不同路径,工厂可二选一,也可并行。",
  },
];

const NOT_NOW = [
  "前期投入零、签约长约零、年费零",
  "数据所有权 100% 留在工厂,不用于模型训练",
  "对邮箱英文水平不熟的小厂友好,业务员只需读中文决策",
];

export default async function FactoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "工厂 AI 助手 — 产品方向",
            inLanguage: "zh-CN",
            description:
              "面向自营海外的复材工厂的 AI 询盘工具,产品方向在研,邮箱报名内测。",
          }}
        />
        <PageBreadcrumbs
          homeLabel="首页"
          trail={[{ label: "工厂 AI 助手", href: "/factories" }]}
        />

        <section className="mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            产品方向 · 在研 · 邮箱报名内测
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
            给自营海外的复材工厂,
            <br />
            <span className="text-muted-foreground">配一个 24/7 不睡觉的 AI 业务员。</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-muted-foreground sm:text-base">
            如果您的工厂有自己的外贸业务员、希望保留对海外客户的直接关系、只是想用 AI
            工具提效自营,这条产品线为您而设。
            <span className="font-semibold text-foreground">
              当前阶段不收任何费用、不卖会员、不签长约
            </span>
            ——我们在做产品验证,需要的是真实的工厂场景反馈,不是订单。
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="mailto:f1frp2015@gmail.com?subject=%E5%B7%A5%E5%8E%82%20AI%20%E5%8A%A9%E6%89%8B%20%E5%86%85%E6%B5%8B%E6%8A%A5%E5%90%8D&body=%E5%B7%A5%E5%8E%82%E5%90%8D%E7%A7%B0%EF%BC%9A%0A%E5%B9%B4%E4%BA%A7%E5%80%BC%E8%8C%83%E5%9B%B4%EF%BC%9A%0A%E4%B8%BB%E8%A6%81%E4%BA%A7%E5%93%81%EF%BC%9A%0A%E7%9B%AE%E5%89%8D%E5%87%BA%E6%B5%B7%E6%96%B9%E5%BC%8F%EF%BC%88Alibaba%2F%E5%B1%95%E4%BC%9A%2F%E8%87%AA%E5%BB%BA%E7%AB%99%2F%E5%85%B6%E4%BB%96%EF%BC%89%EF%BC%9A%0A%E6%9C%88%E5%9D%87%E6%B5%B7%E5%A4%96%E8%AF%A2%E7%9B%98%E4%B8%AA%E6%95%B0%EF%BC%9A%0A%E5%85%B6%E4%BB%96%E5%B8%8C%E6%9C%9B%E8%A1%A5%E5%85%85%E7%9A%84%E5%9C%BA%E6%99%AF%EF%BC%9A"
              className={buttonVariants({ size: "lg", variant: "default" })}
            >
              <Mail size={16} className="mr-2" />
              邮件报名内测
            </a>
            <Link
              href={"/overseas" as never}
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              另一条路 · 全链路代理
              <ArrowUpRight size={16} className="ml-2" />
            </Link>
          </div>
        </section>

        <section className="mt-16 border-t border-border/70 pt-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            产品愿景
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            把外贸业务员的重复劳动交给 AI
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            不是替代业务员——是把"读邮件 + 翻译 + 抽规格 + 起草回复"这 4 件每天
            占用 60% 时间的事 batch 给 AI,业务员专注做谈判、拜访、跟单这种 AI
            做不了的事。
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="rounded-lg border border-border/70 bg-background p-5"
              >
                <c.icon size={20} className="text-foreground/80" />
                <h3 className="mt-3 text-base font-semibold tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-border/70 pt-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            当前阶段说明
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            为什么现在不收费?
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            产品还在验证早期。我们现在最需要的不是营收,是真实场景下的工厂反馈
            ——把功能打磨到工厂业务员愿意每天用。所以:
          </p>
          <ul className="mt-5 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            {NOT_NOW.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-foreground/60" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
            未来产品成熟、有明显 ROI 数据后,我们可能会推出付费版,
            但参与早期内测的工厂会享有长期优惠或免费名额——具体方式到时和您一对一谈。
          </p>
        </section>

        <section className="mt-16 border-t border-border/70 pt-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            两条路径
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            自营 vs 全包,选哪条?
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ① 工厂 AI 助手(本页)
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                您留外贸业务员,用 AI 提效自营
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                客户关系、报价权、出口主体全部由您工厂保留。AI 只做工具,
                不接触客户、不抽佣。适合已经有外贸团队和出口资质的中大型厂。
              </p>
              <div className="mt-5 text-[12px] font-mono uppercase tracking-wider text-muted-foreground">
                CTA · 邮箱报名内测
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ② 全链路代理(/overseas)
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                我们替您接管整个出海流程
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                复材站以出口实体身份接单,商务谈判、报关、CBAM、海运、退税
                全部我们做。您只按图生产、按时交付。适合没出口经验或不想自建
                外贸团队的工厂。
              </p>
              <div className="mt-5">
                <Link
                  href={"/overseas" as never}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground underline underline-offset-4 hover:no-underline"
                >
                  了解全链路代理方案 <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-lg border border-border/70 bg-foreground/[0.03] p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            想试试 AI 助手?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            告诉我们您工厂的基本情况,我们 1-2 个工作日内回复确认是否合适合作内测。
          </p>
          <a
            href="mailto:f1frp2015@gmail.com?subject=%E5%B7%A5%E5%8E%82%20AI%20%E5%8A%A9%E6%89%8B%20%E5%86%85%E6%B5%8B%E6%8A%A5%E5%90%8D"
            className={
              buttonVariants({ size: "lg", variant: "default" }) + " mt-6"
            }
          >
            <Mail size={16} className="mr-2" />
            f1frp2015@gmail.com
          </a>
        </section>
      </div>
    </main>
  );
}
