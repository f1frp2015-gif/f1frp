import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { sql, isNotNull } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ACTIVE_LOCALE } from "@/lib/sites";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import {
  enterprises,
  supplierListings,
  materials as materialsTable,
  standards as standardsTable,
  papers as papersTable,
  patents as patentsTable,
  posts,
  comments,
} from "@/lib/db/schema";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "出海方案 — 全链路出海代理 | 复材站",
  description:
    "复材站作为出口实体接管整个出海流程 — 英文站、SEO、AI 询盘、商务谈判、报关、CBAM、退税全部由我们做,工厂只负责按图生产、按时交付。仅按成交订单 GMV 收费,不收年费、不签长约。想自己接询盘 → 见工厂 AI 助手 SaaS 工具。",
};

async function countOne(
  table: Parameters<typeof db.select>[0] extends infer _
    ? Parameters<ReturnType<typeof db.select>["from"]>[0]
    : never,
): Promise<number> {
  try {
    const rows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(table);
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

async function countSuppliersWithEn(): Promise<number> {
  try {
    const rows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierListings)
      .where(isNotNull(supplierListings.nameEn));
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

export default async function OverseasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // /overseas is a Chinese-language pitch aimed at PRC manufacturers selling
  // their products through getfrp. It has no purpose on the EN-host (getfrp.com),
  // so redirect overseas-side visitors back to the English home.
  if (ACTIVE_LOCALE === "en" || locale === "en") {
    redirect("/");
  }

  setRequestLocale(locale);

  const [
    materialsCount,
    standardsCount,
    papersCount,
    patentsCount,
    suppliersCount,
    suppliersEnCount,
    enterprisesCount,
    postsCount,
    commentsCount,
  ] = await Promise.all([
    countOne(materialsTable),
    countOne(standardsTable),
    countOne(papersTable),
    countOne(patentsTable),
    countOne(supplierListings),
    countSuppliersWithEn(),
    countOne(enterprises),
    countOne(posts),
    countOne(comments),
  ]);

  const stats = [
    { label: "复材牌号库", value: materialsCount, suffix: "条" },
    { label: "国内外标准", value: standardsCount, suffix: "项" },
    { label: "学术论文索引", value: papersCount, suffix: "篇" },
    { label: "专利数据", value: patentsCount, suffix: "件" },
    { label: "供应商总池", value: suppliersCount, suffix: "家" },
    { label: "已英文化（出海就绪）", value: suppliersEnCount, suffix: "家" },
    { label: "入驻企业", value: enterprisesCount, suffix: "家" },
    { label: "社区互动", value: postsCount + commentsCount, suffix: "条" },
  ];

  return (
    <main>
      {/* ─────────────── Hero ─────────────── */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-sm opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          {/* Top quick-jump banner */}
          <div className="mb-10 flex flex-col gap-3 rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                海外版直达
              </div>
              <div className="mt-0.5 text-sm">
                <span className="font-semibold">getfrp.com</span> 是 f1frp 的英文海外版，面向全球采购商展示中国复材供应链
              </div>
            </div>
            <a
              href="https://getfrp.com"
              target="_blank"
              rel="noopener"
              className={buttonVariants({ size: "default" })}
            >
              访问 getfrp.com
              <ArrowUpRight size={16} className="ml-1" />
            </a>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              AI-NATIVE · 复材中小企业出海加速
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-[64px]">
              让中国复材中小企业的产品和服务，
              <br />
              <span className="text-muted-foreground">被全世界采购商找到。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-muted-foreground sm:text-base">
              <span className="font-semibold text-foreground">getfrp.com</span> 是 f1frp 的英文海外版。<span className="font-semibold text-foreground">复材站以出口实体身份接管整个出海流程</span> — 英文站、SEO、AI 询盘、商务谈判、Incoterms、信用证、报关、CBAM、海运、退税全部由我们做。工厂只负责按图生产、按时交付，<span className="font-semibold text-foreground">仅按成交订单 GMV 收费</span>，不收年费、不签长约。
            </p>
            <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              想保留自己的业务员、用 AI 工具提效自营海外？请见{" "}
              <Link
                href={"/factories" as never}
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                工厂 AI 助手
              </Link>
              {" "}产品方向(在研,可联系邮箱报名内测)。
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#pricing"
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                看代理服务详情
              </a>
              <a
                href="https://getfrp.com"
                target="_blank"
                rel="noopener"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                访问 getfrp.com
                <ArrowUpRight size={16} className="ml-1.5" />
              </a>
              <a
                href="#pain-points"
                className="ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                先了解痛点和方案 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Pain Points ─────────────── */}
      <section id="pain-points" className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              出海痛点
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              中国中小复材企业出海，5 个绕不过去的坎
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              我们调研过几十家年产值 ¥3000 万到 ¥3 亿的复材厂老板。出海这件事，不是因为不想做，是因为这 5 个坎一个比一个真。
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-5">
            {[
              {
                no: "01",
                title: "英文资产从零开始",
                body: "工厂中文资料齐全，但英文产品页、英文 datasheet、英文工艺规范几乎没有。临时找翻译公司，3 个月做不完一个网站，做完没人维护。",
              },
              {
                no: "02",
                title: "Google Ads / 阿里巴巴成本高",
                body: "Google Ads CPC 5-15 美金一次点击，阿里巴巴金品诚企会员一年 10-30 万，钱花了不一定有询盘，询盘真假混杂没有筛选。",
              },
              {
                no: "03",
                title: "海外询盘响应跟不上",
                body: "海外采购商邮件深夜发来，第二天上班才回，黄金 6 小时窗口已经过去；英文邮件来回 2-3 周，对方早转去其他厂家了。",
              },
              {
                no: "04",
                title: "海外信任建不起来",
                body: "工厂有 ISO 9001、有真实案例、做过出口，但海外买家进官网什么都看不到 — 没有规范化的认证展示、没有可验证的工艺数据、没有第三方背书。",
              },
              {
                no: "05",
                title: "全链路服务缺位",
                body: "终于谈成订单，又卡在 Incoterms、信用证、出口报关、CBAM 碳排放申报、海运保险、退税。每一步都能让小厂踩坑。",
              },
            ].map((p) => (
              <div
                key={p.no}
                className="flex flex-col rounded-lg border border-border/70 bg-background p-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  痛点 {p.no}
                </div>
                <h3 className="mt-2 text-base font-semibold tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── AI-Native Solutions ─────────────── */}
      <section className="border-b border-border/80 bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              AI-NATIVE 解决方案
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              一套 AI-native 平台，把 5 个坎全部抹平
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              不是把传统外贸翻译成英文，而是用 AI 重写一套面向海外采购商的获客逻辑。
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              {
                no: "01",
                title: "AI 自动生成英文站资产",
                pain: "对应痛点 ① 英文资产从零开始",
                body: "上传中文产品资料 + 工厂照片，AI 自动产出英文产品页、datasheet、工艺规范、行业洞察。多模型 AI 引擎保证术语准确（ASTM、CE、CBAM 标准号原样保留），术语不一致自动校对。每月增量内容由 AI 持续维护，不用养英文运营团队。",
              },
              {
                no: "02",
                title: "SEO + GEO 双轨获流",
                pain: "对应痛点 ② Google Ads 成本高",
                body: "传统 SEO（搜索引擎）+ 生成式引擎优化 GEO（让主流 AI 答案引擎引用我们的内容）。海外采购商用 AI 搜索『拉挤型材中国供应商』时，引用源直接是 getfrp.com 的产品页 — 这是越用越值钱的资产，不是越用越贵的广告。",
              },
              {
                no: "03",
                title: "AI 询盘助手 24/7 英文回复",
                pain: "对应痛点 ③ 询盘响应跟不上",
                body: "海外询盘 5 分钟内 AI 用专业英文回复，自动识别询盘真假（CC 一群中国厂家的询盘直接过滤），合格询盘引导填 RFQ 表单（材料/规格/数量/目的国/交期），结构化数据落库后转人工跟进。中文厂家只需要看处理过的中文摘要。",
              },
              {
                no: "04",
                title: "数据化资质背书",
                pain: "对应痛点 ④ 海外信任建不起来",
                body: "把工厂的认证（ISO 9001 / IATF 16949 / DNV-GL 等）规范化结构化展示；案例配工艺参数、检测报告链接；AI 把工厂中文资料映射到 ASTM / EN / DIN 等海外标准对照表 — 海外采购商一目了然。复材站作为出口实体提供海外信用背书，让单个小厂也能做大金额订单。",
              },
              {
                no: "05",
                title: "全链路代理服务",
                pain: "对应痛点 ⑤ 全链路服务缺位",
                body: "RFQ 谈成后由我们的出海团队接管：商务谈判、Incoterms 选择、信用证 / TT 收款、出口报关、CBAM 碳排放申报、海运 + 保险、退税 / 货款结算。中国小厂只需要按图生产、按时交货，海外的所有事我们全包。",
              },
              {
                no: "06",
                title: "AI 选材助手反向引流",
                pain: "复材买家先选材料，再选供应商",
                body: "海外工程师在 getfrp.com AI 助手上描述工况，AI 推荐复材方案后再接到匹配的中国供应商。我们不卖广告位，AI 推荐的逻辑是材料-工艺-需求匹配 — 这让小厂有机会和大厂在同一起跑线竞争同一个订单。",
              },
            ].map((s) => (
              <div
                key={s.no}
                className="flex flex-col rounded-lg border border-border/70 bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    解决方案 {s.no}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {s.pain}
                  </div>
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── Pricing / Business Model ─────────────── */}
      <section id="pricing" className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              商业模式 / 定价
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              全链路代理，按成交分成
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              不收年费、不卖竞价排名、不锁定包年合同。复材站作为出口实体接管全部海外环节，
              <span className="font-medium text-foreground">仅按成交订单 GMV 收费</span>
              {" "}— 没成交不收费，激励完全对齐。
            </p>
          </div>

          {/* Single tier — full-agency only */}
          <div className="mt-10 flex justify-center">
            <div className="flex w-full max-w-2xl flex-col rounded-lg border-2 border-foreground bg-background p-8 shadow-sm sm:p-10">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  全链路代理 · 单一档
                </div>
                <span className="rounded-sm border border-foreground/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                  唯一服务
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                复材站 · 全链路出海代理
              </h3>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">
                  成交分成
                </span>
                <span className="text-base text-muted-foreground">
                  / 按订单 GMV 谈定
                </span>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                费率按订单规模、产品类别、国别风险阶梯式约定，签合同前一次性谈定，
                合作期内不浮动。
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { t: "出口主体", b: "复材站以出口实体身份接单" },
                  { t: "商务", b: "谈判 / Incoterms / 信用证 / TT" },
                  { t: "通关", b: "出口报关 / CBAM 申报 / 退税" },
                  { t: "物流", b: "海运 / 保险 / 海外仓（可选）" },
                  { t: "海外信任", b: "平台信用背书 + 英文资产 + AI 助手 24/7 应答" },
                  { t: "工厂分工", b: "按图生产、按时交付，海外的所有事我们全包" },
                ].map((it) => (
                  <div
                    key={it.t}
                    className="rounded-md border border-border/70 bg-foreground/[0.02] p-3"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {it.t}
                    </div>
                    <div className="mt-1 text-[13px] leading-relaxed text-foreground/90">
                      {it.b}
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="mailto:f1frp2015@gmail.com?subject=%E7%94%B3%E8%AF%B7%E5%85%A8%E9%93%BE%E8%B7%AF%E5%87%BA%E6%B5%B7%E4%BB%A3%E7%90%86"
                className={
                  buttonVariants({ size: "lg", variant: "default" }) +
                  " mt-8 w-full"
                }
              >
                联系我们，谈合作
              </a>

              <p className="mt-4 text-center text-[12px] text-muted-foreground">
                适合：第一次走出口、或不想自建外贸团队的工厂
              </p>
            </div>
          </div>

          {/* SaaS alternative pointer — keep buyers from confusing the two product lines */}
          <div className="mt-10 rounded-lg border border-border/70 bg-foreground/[0.02] p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              另一条路 — 不想全托管?
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">
              如果您有自己的外贸业务员、希望保留对海外客户的直接关系、只想用 AI
              工具提效自营,请见{" "}
              <Link
                href={"/factories" as never}
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                工厂 AI 助手
              </Link>
              {" "}产品方向(目前在研,可联系
              <a href="mailto:f1frp2015@gmail.com" className="underline">
                f1frp2015@gmail.com
              </a>
              报名内测)。两条路径互不依赖,您可以只选其一,也可以两条并行。
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────── Live AI Capability Stats ─────────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              平台能力（实时数据）
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              不是 PPT 上的 AI，是已经在跑的资产
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              下面的数字每 5 分钟从数据库实时刷新。AI-native 获客平台的可见性来自「数据资产 × 内容资产 × 模型能力」三层叠加。
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border/70 bg-background p-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">
                    {s.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">{s.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Architecture summary */}
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ① 数据底座
              </div>
              <h3 className="mt-2 text-base font-semibold">
                结构化的复材产业数据
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                牌号库 + 标准库 + 论文/专利索引 + 供应商池 + 工艺库 + 入驻企业。所有数据中英双轨字段化，向量索引支持 AI 语义检索。海外询盘进来时，AI 在 200ms 内匹配最相关的牌号、工艺、供应商。
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ② 内容资产
              </div>
              <h3 className="mt-2 text-base font-semibold">
                AI 持续生成英文 SEO 内容
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                每月数百篇 AI 生成的英文行业洞察、产品对比、应用案例文章，全部经过术语校对和事实引用。为 getfrp.com 在主流搜索引擎和 AI 答案引擎上累积持续可见性 — 关键词排名是越用越靠前的资产。
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ③ 模型能力
              </div>
              <h3 className="mt-2 text-base font-semibold">
                多模型路由 + 双轨部署
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                多模型分工协作（推理写作模型 + 嵌入检索模型 + 国内合规备选模型），AI 网关智能路由。海外侧（getfrp.com）+ 国内侧（f1frp.com）双部署架构，全球访问无障碍。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Comparison ─────────────── */}
      <section className="border-b border-border/80 bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              对比传统出海方案
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              为什么不是阿里巴巴 / 不是独立站 / 不是 Google Ads
            </h2>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    维度
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    阿里巴巴 / 中国制造网
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    自建独立站
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Google Ads
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground">
                    getfrp 平台
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {[
                  {
                    dim: "前期投入",
                    alibaba: "¥10-30 万/年会员 + 运营人力",
                    site: "¥5-20 万建站 + 长期 SEO 运营",
                    ads: "¥20-100 万/年 CPC 烧钱",
                    getfrp: "¥0 前期 · 按成交订单 GMV 分成",
                  },
                  {
                    dim: "流量类型",
                    alibaba: "平台内询价（货架竞争）",
                    site: "需自己引流（多数为零）",
                    ads: "付费流（停了就归零）",
                    getfrp: "SEO + GEO 自然流（资产）",
                  },
                  {
                    dim: "买家信任来源",
                    alibaba: "平台背书，但同质化严重",
                    site: "纯靠企业自身 — 海外买家不认",
                    ads: "无 — 全靠落地页转化",
                    getfrp: "平台出口实体 + 数据化资质",
                  },
                  {
                    dim: "询盘质量",
                    alibaba: "群发询盘多，转化率低",
                    site: "看 SEO 做得怎么样",
                    ads: "依赖关键词匹配精度",
                    getfrp: "AI 预筛 + 工程师风格回复",
                  },
                  {
                    dim: "可持续性",
                    alibaba: "续费即停止，资产不在企业",
                    site: "资产在企业，但维护成本高",
                    ads: "停投即停止",
                    getfrp: "数据 + 内容 + 模型三层资产沉淀",
                  },
                  {
                    dim: "适合谁",
                    alibaba: "标品、价格战玩家",
                    site: "已经有海外经验和团队的中大厂",
                    ads: "高客单价 + 标准化产品",
                    getfrp: "技术驱动型中小复材厂",
                  },
                ].map((r) => (
                  <tr key={r.dim}>
                    <td className="px-4 py-3 align-top font-medium">
                      {r.dim}
                    </td>
                    <td className="px-4 py-3 align-top text-[13px] text-muted-foreground">
                      {r.alibaba}
                    </td>
                    <td className="px-4 py-3 align-top text-[13px] text-muted-foreground">
                      {r.site}
                    </td>
                    <td className="px-4 py-3 align-top text-[13px] text-muted-foreground">
                      {r.ads}
                    </td>
                    <td className="px-4 py-3 align-top text-[13px]">
                      <span className="font-medium">{r.getfrp}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────── How it works ─────────────── */}
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="border-b border-border/70 pb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              出海四步
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              从入驻到第一笔订单，一般 30-60 天
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                no: "01",
                title: "上传企业资料",
                body: "提交营业执照、ISO 证书、产品清单、工艺规范、案例图。我们 3-5 个工作日完成数据化录入和 AI 生成英文档案。",
              },
              {
                no: "02",
                title: "AI 内容引擎接管",
                body: "AI 自动生成英文产品页、datasheet、对比文章、应用案例，每月持续更新。同步在 Google / Bing / 生成式 AI 引擎建立可见性。",
              },
              {
                no: "03",
                title: "海外询盘进来",
                body: "AI 助手 5 分钟内英文回复 + 询盘真伪筛选。合格询盘引导填 RFQ 表单，结构化数据 + 中文摘要发给您。",
              },
              {
                no: "04",
                title: "全链路代理接管",
                body: "我们接管商务谈判、合同、信用证、报关、CBAM、海运、退税。您只需要按图生产、按时交货。",
              },
            ].map((step) => (
              <div
                key={step.no}
                className="flex flex-col rounded-lg border border-border/70 bg-background p-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  STEP {step.no}
                </div>
                <h3 className="mt-2 text-base font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section className="border-b border-border/80 bg-foreground/[0.04]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              准备好让海外买家找到您了吗？
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              先到 getfrp.com 看看英文站长什么样，对比一下您的工厂目前在海外搜索引擎能找到什么。
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="https://getfrp.com"
                target="_blank"
                rel="noopener"
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                访问 getfrp.com
                <ArrowUpRight size={18} className="ml-1.5" />
              </a>
              <Link
                href="/suppliers"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                查看已入驻供应商
                <ArrowRight size={18} className="ml-1.5" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
              联系邮箱 · f1frp2015@gmail.com
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
