import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "关于我们 - 复材在线",
  description:
    "复材在线是中国FRP复合材料行业一站式数字平台，致力于打造材料数据、交易、技术和社区的综合服务生态。",
};

const timeline = [
  { date: "2026 Q2", event: "平台上线，资讯中心 + 材料数据库 + 供应商目录" },
  { date: "2026 Q3", event: "交易市场上线，价格行情 + 供需发布 + 在线询价" },
  { date: "2026 Q4", event: "技术社区 + 在线工具 + 微信小程序" },
  { date: "2027 H1", event: "AI智能匹配 + 会员体系 + 培训认证" },
  { date: "2027 H2", event: "在线交易闭环 + 供应链服务 + 行业指数" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">关于复材在线</h1>
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          中国纤维复合材料一站式数字平台
        </p>
      </div>

      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <section className="mb-10">
          <h2 className="text-2xl font-bold">我们的使命</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            中国复合材料市场规模超过2800亿元，拥有数千家制造企业，但行业数字化基础设施几乎为零。现有平台大多停留在十年前的技术水平，信息碎片化，价格不透明，供需对接效率低下。
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            复材在线致力于改变这一现状——通过构建中国首个涵盖玻璃纤维、碳纤维、玄武岩纤维、芳纶纤��和生物基纤维五大体系的结构化材料数据库、实时价格行情系统、AI驱动的供需匹配引擎，以及高质量的技术交流社区，让行业信息流通更高效，让上下游合作更便捷。
          </p>
        </section>

        <Separator className="my-8" />

        <section className="mb-10">
          <h2 className="text-2xl font-bold">平台优势</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">材料数据权威</CardTitle>
                <CardDescription>
                  国内唯一覆盖五大纤维体系的结构化复合材料属性数据库，300+种材料性能数据
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">行业深耕</CardTitle>
                <CardDescription>
                  团队深耕FRP行业多年，熟悉产业链每个环节，内容专业可靠
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI赋能</CardTitle>
                <CardDescription>
                  智能选材推荐、工艺选择建议、供需自动匹配，让决策更科学
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">全链覆盖</CardTitle>
                <CardDescription>
                  从原材料到制品，从技术到贸易，一个平台解决FRP行业全流程需求
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-10">
          <h2 className="text-2xl font-bold">发展路线</h2>
          <div className="mt-6 space-y-4">
            {timeline.map((item, i) => (
              <div key={item.date} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="mt-1 h-full w-px bg-border" />
                  )}
                </div>
                <div className="pb-6">
                  <div className="text-sm font-semibold">{item.date}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.event}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        <section id="contact" className="mb-10">
          <h2 className="text-2xl font-bold">联系我们</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl">📧</div>
                <div className="mt-2 text-sm font-medium">商务合作</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  contact@f1frp.com
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl">💬</div>
                <div className="mt-2 text-sm font-medium">微信客服</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  f1frp_com
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl">📱</div>
                <div className="mt-2 text-sm font-medium">微信公众号</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  搜索"复材在线"
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="ad" className="rounded-lg border bg-muted/30 p-8 text-center">
          <h3 className="text-xl font-bold">广告与合作</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            复材在线面向FRP行业企业提供精准的广告投放和品牌推广服务，包括首页Banner、分类页推荐位、资讯软文等多种形式。
          </p>
          <Button className="mt-4">获取广告方案</Button>
        </section>
      </div>
    </div>
  );
}
