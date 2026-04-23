import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Trade" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const demandList = [
  {
    id: "d1",
    type: "buy" as const,
    title: "采购196#不饱和聚酯树脂 20吨",
    company: "某环保设备公司",
    location: "江苏盐城",
    date: "2026-04-17",
    urgent: true,
  },
  {
    id: "d2",
    type: "buy" as const,
    title: "求购ECR玻璃纤维方格布 5000㎡",
    company: "某游艇制造公司",
    location: "广东珠海",
    date: "2026-04-16",
    urgent: false,
  },
  {
    id: "d3",
    type: "buy" as const,
    title: "采购FRP拉挤型材（工字型/槽型）大量长期",
    company: "某建筑安装公司",
    location: "浙江杭州",
    date: "2026-04-16",
    urgent: false,
  },
  {
    id: "d4",
    type: "buy" as const,
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
    type: "sell" as const,
    title: "长期供应191#/196#不饱和聚酯树脂",
    company: "华昌聚合物有限公司",
    location: "江苏常州",
    date: "2026-04-17",
    featured: true,
  },
  {
    id: "s2",
    type: "sell" as const,
    title: "供应模塑玻璃钢格栅 多规格现货",
    company: "南通恒新复合材料",
    location: "江苏南通",
    date: "2026-04-16",
    featured: true,
  },
  {
    id: "s3",
    type: "sell" as const,
    title: "供应FRP电缆桥架/管箱 来图定制",
    company: "河北枣强华瑞公司",
    location: "河北衡水",
    date: "2026-04-16",
    featured: false,
  },
  {
    id: "s4",
    type: "sell" as const,
    title: "供应碳纤维预浸料 T300/T700 多规格",
    company: "光威复材股份有限公司",
    location: "山东威海",
    date: "2026-04-15",
    featured: false,
  },
];

export default async function TradePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Trade" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("h1")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button>{t("postBuy")}</Button>
          <Button variant="outline">{t("postSell")}</Button>
        </div>
      </div>

      {/* Price Center */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("priceTitle")}</CardTitle>
          <CardDescription>{t("priceSub")}</CardDescription>
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
                      : t("priceFlat")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("priceDisclaimer")}
          </p>
        </CardContent>
      </Card>

      {/* Supply & Demand */}
      <Tabs defaultValue="demand">
        <TabsList>
          <TabsTrigger value="demand">{t("tabDemand")}</TabsTrigger>
          <TabsTrigger value="supply">{t("tabSupply")}</TabsTrigger>
        </TabsList>

        <TabsContent value="demand" className="mt-4">
          <div className="space-y-3">
            {demandList.map((item) => (
              <Card key={item.id} className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {t("buy")}
                      </Badge>
                      {item.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          {t("urgent")}
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
                    {t("contactBuyer")}
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
                        {t("sell")}
                      </Badge>
                      {item.featured && (
                        <Badge
                          variant="outline"
                          className="border-amber-500 text-xs text-amber-600"
                        >
                          {t("featured")}
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
                    {t("contactSupplier")}
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
        <h3 className="text-xl font-bold">{t("ctaTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("ctaSub")}</p>
        <Button className="mt-4" size="lg">
          {t("ctaBtn")}
        </Button>
      </div>
    </div>
  );
}
