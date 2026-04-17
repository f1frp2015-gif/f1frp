import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { materialCategories, priceData } from "@/lib/data/materials";
import { newsList } from "@/lib/data/news";

const features = [
  {
    icon: "📊",
    title: "材料数据库",
    description: "300+种复合材料属性数据，涵盖五大纤维体系，多条件筛选对比",
    href: "/materials",
  },
  {
    icon: "💰",
    title: "交易市场",
    description: "实时价格行情，供需发布，AI智能匹配供应商",
    href: "/trade",
  },
  {
    icon: "🔬",
    title: "技术中心",
    description: "7大工艺百科，在线计算工具，标准文库查询",
    href: "/tech",
  },
  {
    icon: "🏭",
    title: "供应商目录",
    description: "认证企业信息，按工艺/产品/地区精准筛选",
    href: "/suppliers",
  },
  {
    icon: "💬",
    title: "行业社区",
    description: "技术问答，案例分享，专家交流平台",
    href: "/community",
  },
  {
    icon: "📰",
    title: "资讯中心",
    description: "行业新闻，政策法规，展会活动，深度报道",
    href: "/news",
  },
];

const stats = [
  { value: "300+", label: "材料数据" },
  { value: "500+", label: "注册企业" },
  { value: "7大", label: "工艺百科" },
  { value: "2861亿", label: "行业规模" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              中国纤维复合材料一站式数字平台
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              复材在线
            </h1>
            <p className="mt-2 text-lg font-medium text-muted-foreground sm:text-xl">
              玻纤 · 碳纤 · 玄武岩纤维 · 芳纶 · 生物基纤维
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed">
              覆盖玻璃纤维、碳纤维、玄武岩纤维、芳纶纤维、生物基纤维全品类增强材料，从手糊到真空导入、从原材料到终端制品，为复合材料全产业链��供数据、交易、技术和社区服务。
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/materials" className={buttonVariants({ size: "lg" })}>
                浏览材料数据库
              </Link>
              <Link href="/trade" className={buttonVariants({ size: "lg", variant: "outline" })}>
                发布供需信息
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">平台核心功能</h2>
            <p className="mt-2 text-muted-foreground">
              从材料选型到供应商匹配，覆盖纤维复合材料行业全流程需求
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="text-3xl">{feature.icon}</div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Price Ticker + News */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Price Center */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">今日行情</h2>
                <Link
                  href="/trade"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  查看全部 →
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {priceData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.region}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-semibold">
                        ¥{item.price.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{item.unit.replace("元/", "")}
                        </span>
                      </div>
                      <div
                        className={`text-xs font-mono ${
                          item.change > 0
                            ? "text-red-500"
                            : item.change < 0
                              ? "text-green-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {item.change > 0 ? "+" : ""}
                        {item.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">行业资讯</h2>
                <Link
                  href="/news"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  查看全部 →
                </Link>
              </div>
              <div className="mt-4 space-y-1">
                {newsList.slice(0, 6).map((news) => (
                  <Link
                    key={news.id}
                    href={`/news#${news.id}`}
                    className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {news.hot && (
                          <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            热门
                          </Badge>
                        )}
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          {news.category === "industry"
                            ? "行业"
                            : news.category === "policy"
                              ? "政策"
                              : news.category === "tech"
                                ? "技术"
                                : news.category === "company"
                                  ? "企业"
                                  : "展会"}
                        </Badge>
                      </div>
                      <h3 className="mt-1 text-sm font-medium leading-snug line-clamp-2">
                        {news.title}
                      </h3>
                    </div>
                    <span className="shrink-0 pt-1 text-xs text-muted-foreground">
                      {news.date.slice(5)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Material Categories */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">材料分类</h2>
            <p className="mt-2 text-muted-foreground">
              涵盖五大纤维体系及树脂基体、芯材、制品全产业链
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {materialCategories.map((cat) => (
              <Link key={cat.id} href={`/materials?category=${cat.id}`}>
                <Card className="text-center transition-colors hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="text-4xl">{cat.icon}</div>
                    <div className="mt-2 font-semibold">{cat.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {cat.count}种材料
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            加入复材在线，连接产业上下游
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            无论您是原材料供应商、制品生产商还是终端采购方，复材在线都能帮助您拓展业务、获取信息、对接资源。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg">免费入驻企业</Button>
            <Button size="lg" variant="outline">
              发布供需信息
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
