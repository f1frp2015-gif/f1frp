import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Bot,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { alternates } from "@/lib/seo";

// /factories — S2 AI 询盘助手对工厂的销售页。
//
// 这是 v4.1 主现金流的"获客落地页"。海外侧(getfrp.com) 不serve 这条产品
// 线 (买家不付钱),所以页面在 EN locale 直接 notFound。中文侧 (f1frp.com)
// 是主战场,文案围绕"工厂老板把 AI 当兼职业务员"心理账户展开。

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "zh") return { robots: { index: false, follow: false } };
  return {
    title: "工厂 AI 询盘助手 — 一个兼职业务员的价格,出货量翻倍 | f1frp",
    description:
      "复材工厂出海工具:AI 自动读海外询盘 → 草拟双语回复 → 一键发邮件。S1 验证标 ¥500/月,S2 询盘助手 ¥1,800/月,S5 全套 ¥4,500/月。前 30 家工厂签早鸟价。",
    alternates: alternates("/factories"),
  };
}

const TIERS = [
  {
    id: "s1",
    name: "S1 · 验证标",
    price: "¥500",
    period: "月",
    annual: "或 ¥4,800/年(8 折)",
    tagline: "出海第一步:把'我们靠谱'说清楚",
    badge: null,
    features: [
      "营业执照 + USCC + 认证证书 AI 审核",
      "可嵌入工厂网站的验证徽章(SVG)",
      "进入 getfrp.com 海外验证目录",
      "每月 5 条海外询盘试用 S2",
      "中英文双语 dashboard",
    ],
    cta: "了解 S1",
    href: "/factories/onboard?tier=s1_starter",
  },
  {
    id: "s2",
    name: "S2 · AI 询盘助手",
    price: "¥1,800",
    period: "月",
    annual: "或 ¥18,000/年(¥1,500/月,17% 折扣)",
    tagline: "AI 当外贸业务员,业务员的产能,工具的价格",
    badge: "推荐",
    features: [
      "邮箱接入(QQ 邮箱 / Gmail / Outlook / 自建 IMAP)",
      "每条询盘 AI 自动抽取规格 / 数量 / 收货地 / Incoterm",
      "草拟中英双语专业回复(根据产品技术档案 + 国别习惯)",
      "工厂老板/业务员一键修改 + 发送",
      "回复率 / 成交率 / 平均响应时间 实时统计",
      "无限询盘量",
    ],
    cta: "✓ North Star · 申请加入",
    href: "/factories/onboard?tier=s2_pro",
  },
  {
    id: "s5",
    name: "S5 · 全套(询盘 + 报价 + 行情)",
    price: "¥4,500",
    period: "月",
    annual: "或 ¥45,000/年(¥3,750/月,17% 折扣)",
    tagline: "把 1 个外贸业务员的工作交给 AI,腾出来跑订单",
    badge: null,
    features: [
      "✓ S2 全部能力",
      "S4 · AI 报价器:规格 + 成本库 + 汇率 + 关税 → 自动 FOB/CIF 报价",
      "S6 · 行业周报:海外采购需求 + 同行价格 + 政策变动",
      "Featured Slot:工厂出现在 getfrp.com 海外检索 Top 5",
      "专属客户经理(微信群)",
      "季度策略复盘",
    ],
    cta: "对接客户经理",
    href: "/factories/onboard?tier=s5_enterprise",
  },
];

const TESTIMONIALS_STATS = [
  { value: "30+", label: "试点工厂(2026 Q2 早鸟)" },
  { value: "¥1,500-3,000", label: "平均月节省人力成本" },
  { value: "3-5×", label: "海外询盘回复速度提升" },
  { value: "60 天", label: "退款承诺" },
];

const FAQS = [
  {
    q: "我们工厂业务员英文不好,担心 AI 写错。怎么办?",
    a: "S2 的工作流就是为这种场景设计的:AI 草拟完后,你工厂的业务员只需要读中文翻译(我们同时给中英文双稿),决定要不要发。改不改、发不发都是你说了算。AI 是助手不是老板。前 3 周我们的客户成功团队会陪着你工厂跑前 20 条询盘,确认回复质量你满意后再放手。",
  },
  {
    q: "我们工厂之前用 Alibaba 国际站,跟你们什么关系?",
    a: "完全互补。Alibaba 是流量平台,我们处理的是不管来源的所有海外询盘——Alibaba 后台询盘、Google 搜过来的邮件、客户介绍的、展会名片回访——全部进同一个 dashboard。Alibaba 那边的回复也可以从我们这里出。",
  },
  {
    q: "我们的客户名单 / 询盘内容会被你们用来培训 AI 吗?",
    a: "不会。每个工厂的数据严格隔离,SaaS 服务条款里明文写了——你的询盘和客户邮箱只用于服务你工厂自己。模型层面的 fine-tune 我们只用公开数据 + 经工厂签名授权的匿名样本(签名后才用,默认 opt-out)。",
  },
  {
    q: "前 30 工厂「早鸟价」具体是什么?",
    a: "S2 锁定 ¥1,500/月(年付,即年费 ¥18,000)的价格,锁定 36 个月。也就是说,即使我们 2027 年标价涨到 ¥2,500/月,早鸟 30 家在 2029 年之前继续 ¥1,500/月。同时享受我们 P1 阶段的全程 1-on-1 客户成功支持(产品上线第 1 年免费)。",
  },
  {
    q: "60 天退款是什么意思?",
    a: "签约前 60 天内,如果你工厂感觉 S2 没有产生明显的回复速度提升或外贸业务员工作量减轻,我们全额退款 + 你已经收到的 dashboard 数据归你保留。我们这么做是因为我们的 H1 假设——「工厂愿意付 ¥1,500-3,000/月买 AI 询盘助手」——只有 60 天验证不通过就立即退场,这是我们对自己产品的诚实。",
  },
  {
    q: "S1 验证标真的只要 ¥500/月吗?这么便宜怎么挣钱?",
    a: "S1 我们故意做成钩子,不是利润源。目的是让工厂「试一下」的门槛极低——验证标本身的成本(AI 审核 + 徽章生成)边际趋零。我们靠 S2 / S5 的续费赚钱。如果一家工厂只买 S1,我们也欢迎,但绝大多数 S1 工厂会在 2-3 个月内升级 S2(因为 S1 期间他们也用了 5 条 / 月免费询盘,感受到了价值)。",
  },
];

const STEPS = [
  {
    num: "01",
    title: "申请加入早期 30 家工厂名单",
    body: "提交工厂基本信息 → 我们 1 个工作日内电话/微信联系 → 30 分钟需求确认 → 决定 S1/S2/S5 套餐。",
  },
  {
    num: "02",
    title: "邮箱接入 + 产品档案录入",
    body: "工厂业务邮箱授权接入 → 上传工厂产品/认证档案给 AI 学习 → 试跑 5-10 条历史询盘,你看 AI 草拟是否到位。",
  },
  {
    num: "03",
    title: "上线 · 你的兼职 AI 业务员开始上班",
    body: "新询盘自动入 dashboard → AI 草拟双语回复 → 业务员修改 + 一键发 → 一周后看回复率 / 响应时间 / 转化率统计。",
  },
];

export default async function FactoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "f1frp 工厂 AI 询盘助手",
          description:
            "复材工厂出海工具:AI 自动读海外询盘 + 草拟双语回复 + 一键发送。月费 ¥500-4,500。",
          brand: { "@type": "Brand", name: "f1frp" },
          offers: TIERS.map((t) => ({
            "@type": "Offer",
            name: t.name,
            price: t.price.replace("¥", "").replace(",", ""),
            priceCurrency: "CNY",
            availability: "https://schema.org/InStock",
            url: `https://f1frp.com/factories#${t.id}`,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <PageBreadcrumbs
        homeLabel="首页"
        trail={[{ label: "工厂出海", href: "/factories" }]}
      />

      {/* ─────────── Hero ─────────── */}
      <header className="mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Sparkles size={11} />
          前 30 家工厂早鸟价 · 限额开放
        </div>
        <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          AI 帮你处理海外询盘,
          <br />
          <span className="text-muted-foreground">
            业务员的产能,工具的价格。
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          自动读邮件 → AI 草拟中英双语回复 → 工厂业务员一键改 + 一键发。
          覆盖 QQ 邮箱 / Gmail / Outlook / 自建 IMAP。
          <strong className="font-medium text-foreground">
            月费 ¥1,500 起,等于雇外贸兼职的 1/3 价位。
          </strong>
          60 天不满意全额退。
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={"/factories/onboard?tier=s2_pro" as never}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-colors hover:bg-foreground/90"
          >
            申请加入早期 30 家工厂
            <ArrowRight size={15} />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-6 py-3 text-[15px] transition-colors hover:bg-muted"
          >
            看 3 档套餐
            <ChevronDown size={15} />
          </a>
        </div>

        {/* Stat strip */}
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border/70 pt-6 sm:grid-cols-4">
          {TESTIMONIALS_STATS.map((s) => (
            <div key={s.label}>
              <div className="text-xl font-bold tabular-nums sm:text-2xl">
                {s.value}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ─────────── 三个核心能力 ─────────── */}
      <section className="mb-16">
        <div className="mb-6 border-b border-border/70 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            S2 询盘助手 · 三个核心能力
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            把 1 个外贸业务员的工作交给 AI
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <CapCard
            Icon={Mail}
            title="01 · 自动读邮件"
            body="邮箱授权接入(QQ / Gmail / Outlook / IMAP)。新询盘 5 秒内进 dashboard,AI 自动识别买家国家、产品规格、数量、Incoterm、收货地、deadline,标红 spam 和无效询盘。"
          />
          <CapCard
            Icon={Bot}
            title="02 · AI 草拟双语回复"
            body="读取工厂自家产品技术档案 + 历史报价 + 认证 → 针对每条询盘生成 中文 + 英文 双版本回复。语气根据买家国家自动调(美国直接 / 欧洲正式 / 中东尊称)。"
            accent
          />
          <CapCard
            Icon={Zap}
            title="03 · 一键修改 + 发送"
            body="业务员看中文版 → 改几个字 → 点发送 → AI 同步改英文版并通过工厂邮箱发出。整个流程从读邮件到发回复 < 3 分钟,比人工快 10-20×。"
          />
        </div>
      </section>

      {/* ─────────── 套餐 ─────────── */}
      <section id="pricing" className="mb-16 scroll-mt-20">
        <div className="mb-6 border-b border-border/70 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            PRICING
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            三档套餐 · 按工厂阶段配
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            S1 引流, S2 主战场, S5 全套服务。**前 30 家工厂签 S2/S5 锁定早鸟价 36 个月**(2029 年前不涨价)。
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </section>

      {/* ─────────── 流程 ─────────── */}
      <section className="mb-16">
        <div className="mb-6 border-b border-border/70 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            HOW IT WORKS
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            从申请到上线 · 3 步 · 平均 5-7 个工作日
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="rounded-xl border border-border/70 bg-background p-6"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                STEP {s.num}
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── 信任带 ─────────── */}
      <section className="mb-16 rounded-xl border border-border/70 bg-muted/20 p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            为什么我们做得了 — 不是又一个 AI 套壳
          </h2>
        </div>
        <ul className="grid gap-3 text-[14px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          {[
            "团队复材行业 10 年+,深耕拉挤 / RTM / 手糊 / 缠绕全工艺,熟悉 200+ 家国内 FRP 工厂运营",
            "已积累海外 SEO / GEO 资产做引流底座,可直接对接欧美 / 中东 / 东南亚买家",
            "208 家中国 FRP 工厂的现场审计档案 + 标准 / 产品 / 认证图谱(2022+)",
            "AI 模型分流:海外侧 Claude / Gemini + 国内侧 DeepSeek / 通义,质量 + 合规双保",
            "60 天验证窗口透明,paying 工厂 < 10 → 退款 + 公开承认假设错误",
            "前 30 家工厂享 4 小时内响应、客户成功团队直接对接,不外包客服",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2
                size={14}
                strokeWidth={2}
                className="mt-1 shrink-0 text-foreground/70"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section className="mb-16">
        <div className="mb-6 border-b border-border/70 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            FAQ
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            工厂老板最常问的 6 个问题
          </h2>
        </div>
        <div className="divide-y divide-border/70 border-y border-border/70">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group cursor-pointer py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-start justify-between gap-3">
                <span className="text-[15px] font-semibold leading-snug tracking-tight">
                  {f.q}
                </span>
                <ChevronDown
                  size={14}
                  className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 max-w-3xl text-[14px] leading-[1.8] text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ─────────── 终极 CTA ─────────── */}
      <section className="rounded-xl border border-border/70 bg-foreground p-10 text-background sm:p-12">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
            <Clock size={11} className="mr-1 inline-block" />
            限额 · 前 30 家工厂锁定早鸟价
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            填表 → 我们 1 个工作日内联系你 → 决定是不是合作
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-background/80">
            没有销售压力。前 30 家工厂会在 2026 年 7 月之前签约——我们 60 天 H1 验证窗口,
            不到 10 家 paying 我们就退,所以名额必须真。Filter 严格,不浪费你的时间。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={"/factories/onboard?tier=s2_pro" as never}
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-6 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-background/90"
            >
              立即申请加入
              <ArrowRight size={15} />
            </Link>
            <Link
              href={"/factories/onboard?tier=undecided" as never}
              className="inline-flex items-center gap-1.5 rounded-md border border-background/30 px-6 py-3 text-[15px] text-background transition-colors hover:bg-background/10"
            >
              我还没决定 · 先聊聊
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-background/70">
            <span className="inline-flex items-center gap-1">
              <TrendingUp size={12} />
              60 天退款承诺
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={12} />
              数据隔离 · 不用于训练
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CapCard({
  Icon,
  title,
  body,
  accent,
}: {
  Icon: typeof Mail;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-xl bg-foreground p-6 text-background"
          : "rounded-xl border border-border/70 bg-background p-6"
      }
    >
      <Icon
        size={22}
        strokeWidth={1.5}
        className={accent ? "text-background" : "text-foreground"}
      />
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p
        className={`mt-2 text-[13.5px] leading-relaxed ${
          accent ? "text-background/85" : "text-muted-foreground"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function TierCard({ tier }: { tier: (typeof TIERS)[number] }) {
  const isAccent = tier.badge === "推荐";
  return (
    <div
      id={tier.id}
      className={
        isAccent
          ? "relative scroll-mt-20 rounded-xl bg-foreground p-6 text-background ring-2 ring-foreground"
          : "relative scroll-mt-20 rounded-xl border border-border/70 bg-background p-6"
      }
    >
      {tier.badge && (
        <span
          className={`absolute -top-3 left-6 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${
            isAccent
              ? "bg-emerald-400 text-emerald-950"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {tier.badge}
        </span>
      )}
      <div
        className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
          isAccent ? "text-background/70" : "text-muted-foreground"
        }`}
      >
        {tier.name}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums">{tier.price}</span>
        <span
          className={`text-sm ${
            isAccent ? "text-background/70" : "text-muted-foreground"
          }`}
        >
          /{tier.period}
        </span>
      </div>
      <div
        className={`mt-1 text-[11px] ${
          isAccent ? "text-background/70" : "text-muted-foreground"
        }`}
      >
        {tier.annual}
      </div>
      <p
        className={`mt-4 text-[13.5px] leading-relaxed ${
          isAccent ? "text-background/85" : "text-muted-foreground"
        }`}
      >
        {tier.tagline}
      </p>
      <ul className="mt-5 space-y-2 border-t border-border/30 pt-5">
        {tier.features.map((f) => (
          <li
            key={f}
            className={`flex items-start gap-2 text-[13px] leading-relaxed ${
              isAccent ? "text-background/90" : "text-foreground/90"
            }`}
          >
            <CheckCircle2
              size={13}
              strokeWidth={2}
              className={`mt-1 shrink-0 ${
                isAccent ? "text-emerald-300" : "text-foreground/70"
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.href as never}
        className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-[14px] font-medium transition-colors ${
          isAccent
            ? "bg-background text-foreground hover:bg-background/90"
            : "border border-border bg-background text-foreground hover:bg-muted"
        }`}
      >
        {tier.cta}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
