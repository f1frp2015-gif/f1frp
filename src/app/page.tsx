import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { materialCategories, priceData } from "@/lib/data/materials";
import { newsList } from "@/lib/data/news";

const modules = [
  { href: "/materials", label: "材料库", sub: "300+材料属性", mono: "DATABASE" },
  { href: "/formulas", label: "配方库", sub: "12+工艺配方", mono: "FORMULA" },
  { href: "/standards", label: "标准库", sub: "80+国内外标准", mono: "STANDARD" },
  { href: "/trade", label: "交易市场", sub: "供需·行情·匹配", mono: "TRADE" },
  { href: "/ai", label: "复材AI", sub: "选材·配方·问答", mono: "AI" },
  { href: "/tech", label: "技术中心", sub: "7大工艺·计算器", mono: "TECH" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative border-b">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Fiber Reinforced Polymer Platform
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              复合材料
              <br />
              <span className="text-muted-foreground">全链路AI平台</span>
            </h1>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed sm:text-lg">
              玻纤 · 碳纤 · 玄武岩纤维 · 芳纶 · 生物基纤维
              <br />
              从选材到成型，从数据到交易，AI贯穿每一个决策节点。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ai" className={buttonVariants({ size: "lg" })}>
                开始使用 AI
              </Link>
              <Link
                href="/materials"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                浏览材料库
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {modules.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="group flex flex-col justify-between border-r border-b p-5 transition-colors hover:bg-muted/50 last:border-r-0 sm:[&:nth-child(3)]:border-r-0 lg:[&:nth-child(3)]:border-r"
              >
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                    {m.mono}
                  </div>
                  <div className="mt-2 text-sm font-semibold group-hover:text-foreground">
                    {m.label}
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{m.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Price + News */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Price */}
            <div className="lg:col-span-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">行情</h2>
                <Link href="/trade" className="font-mono text-xs text-muted-foreground hover:text-foreground">
                  ALL →
                </Link>
              </div>
              <div className="mt-4 space-y-1">
                {priceData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <div>
                      <span className="text-sm">{p.name}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground">{p.region}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">¥{p.price.toLocaleString()}</span>
                      <span className={`font-mono text-xs ${p.change > 0 ? "text-red-500" : p.change < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {p.change > 0 ? "+" : ""}{p.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News */}
            <div className="lg:col-span-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">资讯</h2>
                <Link href="/news" className="font-mono text-xs text-muted-foreground hover:text-foreground">
                  ALL →
                </Link>
              </div>
              <div className="mt-4 space-y-0">
                {newsList.slice(0, 6).map((n) => (
                  <Link
                    key={n.id}
                    href={`/news#${n.id}`}
                    className="flex items-start gap-3 border-b py-3 transition-colors hover:bg-muted/30"
                  >
                    <span className="shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
                      {n.date.slice(5)}
                    </span>
                    <span className="text-sm leading-snug line-clamp-1">
                      {n.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiber Categories */}
      <section className="border-t border-b py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Coverage
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">五大纤维全覆盖</h2>
          <div className="mt-8 grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: "玻璃纤维", en: "Glass Fiber", stat: "E/ECR/S-glass" },
              { name: "碳纤维", en: "Carbon Fiber", stat: "T300/T700/T800" },
              { name: "玄武岩纤维", en: "Basalt Fiber", stat: "耐温700°C" },
              { name: "芳纶纤维", en: "Aramid Fiber", stat: "Kevlar/Twaron" },
              { name: "生物基纤维", en: "Bio-based", stat: "亚麻/大麻/竹" },
            ].map((f) => (
              <div key={f.name} className="bg-background p-6">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  {f.en}
                </div>
                <div className="mt-2 text-lg font-semibold">{f.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{f.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            AI-Powered
          </p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            用AI重新定义复材选型
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
            描述你的工况和需求，复材AI基于300+材料数据、12+工艺配方和80+标准的知识库，给出专业的选材方案、配方建议和标准指引。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/ai" className={buttonVariants({ size: "lg" })}>
              打开 AI 助手
            </Link>
            <Link
              href="/formulas"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              浏览配方库
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
