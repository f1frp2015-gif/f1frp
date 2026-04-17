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
import { suppliers, supplierCategories, provinces } from "@/lib/data/suppliers";

export const metadata: Metadata = {
  title: "供应商目录 - FRP复合材料企业信息查询",
  description:
    "FRP复合材料行业认证供应商目录，涵盖制品生产商、原材料供应商、设备和模具制造商。",
};

function getCategoryName(id: string) {
  return supplierCategories.find((c) => c.id === id)?.name || id;
}

export default function SuppliersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">供应商目录</h1>
          <p className="mt-2 text-muted-foreground">
            FRP复合材料行业认证企业查询 · 按工艺/产品/地区筛选
          </p>
        </div>
        <Button>免费入驻企业</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">企业类型：</span>
          <Badge variant="default" className="cursor-pointer px-3 py-1">
            全部
          </Badge>
          {supplierCategories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className="cursor-pointer px-3 py-1"
            >
              {cat.name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">所在地区：</span>
          {provinces.slice(0, 8).map((p) => (
            <Badge
              key={p}
              variant={p === "全国" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {p}
            </Badge>
          ))}
        </div>
      </div>

      {/* Supplier List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="flex flex-col transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{supplier.name}</CardTitle>
                {supplier.verified && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-green-500 text-[10px] text-green-600"
                  >
                    已认证
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {getCategoryName(supplier.category)}
                </Badge>
                <span>{supplier.location}</span>
                <span>·</span>
                <span>成立{supplier.established}年</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                {supplier.description}
              </p>

              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  主营产品
                </div>
                <div className="flex flex-wrap gap-1">
                  {supplier.products.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              {supplier.processes.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    生产工艺
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {supplier.processes.map((p) => (
                      <Badge
                        key={p}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  资质认证
                </div>
                <div className="flex flex-wrap gap-1">
                  {supplier.certifications.map((c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className="border-amber-400 text-[10px] text-amber-600"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">入驻复材在线供应商目录</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          展示企业信息、产品和资质，获得精准采购方询价
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg">免费入驻</Button>
          <Button size="lg" variant="outline">
            了解会员权益
          </Button>
        </div>
      </div>
    </div>
  );
}
