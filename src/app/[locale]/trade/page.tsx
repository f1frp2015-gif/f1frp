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
import { getLatestPublishedReport } from "@/lib/prices/queries";

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

export const revalidate = 60;

type L = { zh: string; en: string };
const tr = (v: L, locale: string) => (locale === "en" ? v.en : v.zh);

// 行情价格来自 DB「最新已发布一期」(price_reports)，name/region 为中文。
// 报价已带可选 nameEn；缺失时回退此静态映射(键须与当期 quotes 的中文名一致)。
const PRICE_NAME_EN: Record<string, string> = {
  "196# 树脂": "#196 UPR",
  "191# 树脂": "#191 UPR",
  "乙烯基酯树脂": "Vinyl ester resin",
  "E-51 环氧树脂": "E-51 epoxy",
  "酚醛树脂 PF": "Phenolic (PF) resin",
  "风电叶片灌注环氧": "Wind blade infusion epoxy",
  "双马来酰亚胺 BMI": "BMI (bismaleimide)",
  "ECR 无碱粗纱": "ECR boron-free roving",
  "E 玻纤短切毡": "E-glass chopped strand mat",
  "E 玻纤方格布": "E-glass woven roving",
  "T300 碳纤维 (3K)": "T300-grade 3K carbon fiber",
  "T700 碳纤维 (12K)": "T700-grade 12K carbon fiber",
  "玄武岩纤维粗纱": "Basalt fiber roving",
  "PVC 泡沫 (H80)": "PVC foam core H80",
  "模塑格栅 (38 型)": "Molded FRP grating (38)",
};

const REGION_EN: Record<string, string> = {
  华东: "East China",
  华南: "South China",
  华北: "North China",
  华中: "Central China",
  西南: "Southwest China",
  西北: "Northwest China",
  东北: "Northeast China",
  全国: "Nationwide",
};

const demandList: Array<{
  id: string;
  type: "buy";
  title: L;
  company: L;
  location: L;
  date: string;
  urgent: boolean;
}> = [
  {
    id: "d1",
    type: "buy",
    title: { zh: "采购196#不饱和聚酯树脂 20吨", en: "Buying #196 UPR — 20 tons" },
    company: { zh: "某环保设备公司", en: "Environmental equipment company" },
    location: { zh: "江苏盐城", en: "Yancheng, Jiangsu" },
    date: "2026-04-17",
    urgent: true,
  },
  {
    id: "d2",
    type: "buy",
    title: { zh: "求购ECR玻璃纤维方格布 5000㎡", en: "Buying ECR glass woven roving — 5000 m²" },
    company: { zh: "某游艇制造公司", en: "Yacht manufacturer" },
    location: { zh: "广东珠海", en: "Zhuhai, Guangdong" },
    date: "2026-04-16",
    urgent: false,
  },
  {
    id: "d3",
    type: "buy",
    title: { zh: "采购FRP拉挤型材（工字型/槽型）大量长期", en: "Buying FRP pultruded profiles (I/U sections) — long-term volume" },
    company: { zh: "某建筑安装公司", en: "Construction & installation company" },
    location: { zh: "浙江杭州", en: "Hangzhou, Zhejiang" },
    date: "2026-04-16",
    urgent: false,
  },
  {
    id: "d4",
    type: "buy",
    title: { zh: "采购乙烯基酯树脂 10吨 防腐项目用", en: "Buying vinyl ester resin — 10 tons, anti-corrosion project" },
    company: { zh: "某化工工程公司", en: "Chemical engineering firm" },
    location: { zh: "山东淄博", en: "Zibo, Shandong" },
    date: "2026-04-15",
    urgent: true,
  },
];

const supplyList: Array<{
  id: string;
  type: "sell";
  title: L;
  company: L;
  location: L;
  date: string;
  featured: boolean;
}> = [
  {
    id: "s1",
    type: "sell",
    title: { zh: "长期供应191#/196#不饱和聚酯树脂", en: "Long-term supply of #191/#196 UPR" },
    company: { zh: "华昌聚合物有限公司", en: "Huachang Polymer Co., Ltd." },
    location: { zh: "江苏常州", en: "Changzhou, Jiangsu" },
    date: "2026-04-17",
    featured: true,
  },
  {
    id: "s2",
    type: "sell",
    title: { zh: "供应模塑玻璃钢格栅 多规格现货", en: "Molded FRP grating — multiple specs in stock" },
    company: { zh: "南通恒新复合材料", en: "Nantong Hengxin Composites" },
    location: { zh: "江苏南通", en: "Nantong, Jiangsu" },
    date: "2026-04-16",
    featured: true,
  },
  {
    id: "s3",
    type: "sell",
    title: { zh: "供应FRP电缆桥架/管箱 来图定制", en: "FRP cable trays / boxes — custom to drawing" },
    company: { zh: "河北枣强华瑞公司", en: "Hebei Zaoqiang Huarui Co." },
    location: { zh: "河北衡水", en: "Hengshui, Hebei" },
    date: "2026-04-16",
    featured: false,
  },
  {
    id: "s4",
    type: "sell",
    title: { zh: "供应碳纤维预浸料 T300/T700 多规格", en: "Carbon fiber prepreg — T300/T700 multiple specs" },
    company: { zh: "光威复材股份有限公司", en: "Guangwei Composites Co., Ltd." },
    location: { zh: "山东威海", en: "Weihai, Shandong" },
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

  // 行情价格:最新已发布一期(随每周发布自动更新);无则回退静态基线。
  const latestPriceReport = await getLatestPublishedReport();
  const prices =
    latestPriceReport?.quotes && latestPriceReport.quotes.length
      ? latestPriceReport.quotes
      : priceData;
  const priceSourceNames = (latestPriceReport?.sources ?? [])
    .slice(0, 3)
    .map((s) => s.split(/[ （(]/)[0])
    .filter(Boolean)
    .join(" / ");

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
            {prices.map((item) => {
              const isEn = locale === "en";
              const displayName = isEn
                ? (item as { nameEn?: string }).nameEn ??
                  PRICE_NAME_EN[item.name] ??
                  item.name
                : item.name;
              const displayRegion = isEn
                ? REGION_EN[item.region] ?? item.region
                : item.region;
              const displayUnit = isEn
                ? item.unit
                    .replace("元/吨", "CNY/MT")
                    .replace("元/㎡", "CNY/m²")
                    .replace("元/kg", "CNY/kg")
                    .replace("元/米", "CNY/m")
                : item.unit;
              return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="text-sm font-medium">{displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {displayRegion}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold">
                    {isEn ? "CNY " : "¥"}{item.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {displayUnit}
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
              );
            })}
          </div>
          {latestPriceReport && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t("priceUpdated", { date: latestPriceReport.weekOf })}
              {priceSourceNames && (
                <> · {t("priceSources", { names: priceSourceNames })}</>
              )}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
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
                    <h3 className="mt-1 font-medium">{tr(item.title, locale)}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{tr(item.company, locale)}</span>
                      <span>{tr(item.location, locale)}</span>
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
                    <h3 className="mt-1 font-medium">{tr(item.title, locale)}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{tr(item.company, locale)}</span>
                      <span>{tr(item.location, locale)}</span>
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
