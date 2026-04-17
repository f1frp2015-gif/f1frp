import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { priceData } from "@/lib/data/materials";

export const metadata: Metadata = {
  title: "交易市场 - 纤维复合材料价格行情与供需信息",
  description:
    "纤维复合材料原材料实时价格行情，树脂、玻纤、碳纤、玄武岩纤维、芳纶价格走势，在线发布采购和供应信息。",
};

const demandList = [
  {
    id: "d1",
    type: "采购",
    title: "采购196#不饱和聚酯树脂 20吨",
    company: "某环保设备公司",
    location: "江苏盐城",
    date: "2026-04-17",
    urgent: true,
  },
  {
    id: "d2",
    type: "采购",
    title: "求购ECR玻璃纤维方格布 5000㎡",
    company: "某游艇制造公司",
    location: "广东珠海",
    date: "2026-04-16",
    urgent: false,
  },
  {
    id: "d3",
    type: "采购",
    title: "采购FRP拉挤型材（工字型/槽型）大量长期",
    company: "某建筑安装公司",
    location: "浙江杭州",
    date: "2026-04-16",
    urgent: false,
  },
  {
    id: "d4",
    type: "采购",
    title: "采购乙烯基酯树脂 10吨 防腐项目用",
    company: "某化工工程公司",
    location: "山东淄博",
    date: "2026-04-15",
    urgent: true,
  },
];

const supplyList = [
  {
    id: "s1",
    type: "供应",
    title: "长期供应191#/196#不饱和聚酯树脂",
    company: "华昌聚合物有限公司",
    location: "江苏常州",
    date: "2026-04-17",
    featured: true,
  },
  {
    id: "s2",
    type: "供应",
    title: "供应模塑玻璃钢格栅 多规格现货",
    company: "南通恒新复合材料",
    location: "江苏南通",
    date: "2026-04-16",
    featured: true,
  },
  {
    id: "s3",
    type: "供应",
    title: "供应FRP电缆桥架/管箱 来图定制",
    company: "河北枣强华瑞公司",
    location: "河北衡水",
    date: "2026-04-16",
    featured: false,
  },
  {
    id: "s4",
    type: "供应",
    title: "供应碳纤维预浸料 T300/T700 多规格",
    company: "光威复材股份有限公司",
    location: "山东威海",
    date: "2026-04-15",
    featured: false,
  },
];

export default function TradePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">交易市场</h1>
          <p className="mt-2 text-muted-foreground">
            FRP原材料价格行情 · 供需信息发布 · 供应商匹配
          </p>
        </div>
        <div className="flex gap-2">
          <Button>发布采购需求</Button>
          <Button variant="outline">发布供应信息</Button>
        </div>
      </div>

      {/* Price Center */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>价格行情中心</CardTitle>
          <CardDescription>
            华东地区主要FRP原材料出厂参考价格（元）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {priceData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.region}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold">
                    ¥{item.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.unit}
                  </div>
                  <div
                    className={`text-xs font-mono font-semibold ${
                      item.change > 0
                        ? "text-red-500"
                        : item.change < 0
                          ? "text-green-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {item.change > 0 ? "↑" : item.change < 0 ? "↓" : "—"}{" "}
                    {item.change !== 0
                      ? `${Math.abs(item.change)}%`
                      : "持平"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            * 价格数据仅供参考，实际成交价以双方协商为准。更新时间: 2026-04-17
          </p>
        </CardContent>
      </Card>

      {/* Supply & Demand */}
      <Tabs defaultValue="demand">
        <TabsList>
          <TabsTrigger value="demand">采购需求</TabsTrigger>
          <TabsTrigger value="supply">供应信息</TabsTrigger>
        </TabsList>

        <TabsContent value="demand" className="mt-4">
          <div className="space-y-3">
            {demandList.map((item) => (
              <Card key={item.id} className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          急需
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-1 font-medium">{item.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.company}</span>
                      <span>{item.location}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    联系采购方
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="supply" className="mt-4">
          <div className="space-y-3">
            {supplyList.map((item) => (
              <Card key={item.id} className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.featured && (
                        <Badge
                          variant="outline"
                          className="border-amber-500 text-xs text-amber-600"
                        >
                          推荐
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-1 font-medium">{item.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.company}</span>
                      <span>{item.location}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    联系供应商
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-10" />

      {/* CTA */}
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">找不到合适的供应商？</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          发布您的采购需求，复材在线AI将自动匹配最合适的供应商并推送给您
        </p>
        <Button className="mt-4" size="lg">
          免费发布采购需求
        </Button>
      </div>
    </div>
  );
}
