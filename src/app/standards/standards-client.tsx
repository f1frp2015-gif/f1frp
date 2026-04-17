"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  standards,
  countryFilters,
  standardCategories,
  processTagOptions,
} from "@/lib/data/standards";

export function StandardsClient() {
  const [search, setSearch] = useState("");
  const [activeCountry, setActiveCountry] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeProcess, setActiveProcess] = useState("all");

  const filtered = useMemo(() => {
    return standards.filter((s) => {
      const matchSearch =
        !search ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.title.includes(search) ||
        (s.titleEn && s.titleEn.toLowerCase().includes(search.toLowerCase()));
      const matchCountry = activeCountry === "all" || s.countryCode === activeCountry;
      const matchCategory = activeCategory === "all" || s.category === activeCategory;
      const matchProcess = activeProcess === "all" || s.process.includes(activeProcess);
      return matchSearch && matchCountry && matchCategory && matchProcess;
    });
  }, [search, activeCountry, activeCategory, activeProcess]);

  const countryStats = useMemo(() => {
    const map: Record<string, number> = {};
    standards.forEach((s) => {
      map[s.countryCode] = (map[s.countryCode] || 0) + 1;
    });
    return map;
  }, []);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((s) => {
      map[s.category] = (map[s.category] || 0) + 1;
    });
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">��准数据库</h1>
        <p className="mt-2 text-muted-foreground">
          FRP复合材料国内外标准查询 — 试验标准、产品标准、设计规范
        </p>
      </div>

      {/* 统计概览 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {countryFilters.filter((c) => c.id !== "all").map((c) => (
          <Card
            key={c.id}
            className={`cursor-pointer transition-colors hover:border-primary/50 ${activeCountry === c.id ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setActiveCountry(activeCountry === c.id ? "all" : c.id)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-lg">{c.flag}</div>
              <div className="text-xl font-bold">{countryStats[c.id] || 0}</div>
              <div className="text-[10px] text-muted-foreground">{c.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-6 space-y-3">
        <Input
          placeholder="搜索标准编号或名称... 例如 GB/T 1447、tensile、拉伸"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-lg"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1">类别：</span>
          {standardCategories.map((c) => (
            <Badge
              key={c.id}
              variant={activeCategory === c.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
              {c.id !== "all" && categoryStats[c.id] ? ` (${categoryStats[c.id]})` : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1">工艺：</span>
          {processTagOptions.map((p) => (
            <Badge
              key={p.id}
              variant={activeProcess === p.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setActiveProcess(p.id)}
            >
              {p.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 结果统计 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          共 <span className="font-bold text-foreground">{filtered.length}</span> 项标准
          {activeCountry !== "all" || activeCategory !== "all" || activeProcess !== "all" || search
            ? `（筛选自 ${standards.length} 项）`
            : ""}
        </span>
        {(activeCountry !== "all" || activeCategory !== "all" || activeProcess !== "all" || search) && (
          <button
            onClick={() => { setSearch(""); setActiveCountry("all"); setActiveCategory("all"); setActiveProcess("all"); }}
            className="text-xs text-primary hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 标准表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">标准编号</TableHead>
                  <TableHead>标准名称</TableHead>
                  <TableHead className="hidden md:table-cell w-[80px]">国家/地区</TableHead>
                  <TableHead className="hidden lg:table-cell w-[100px]">类别</TableHead>
                  <TableHead className="hidden lg:table-cell w-[100px]">适用工艺</TableHead>
                  <TableHead className="hidden sm:table-cell w-[60px]">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((std) => (
                  <TableRow key={std.id}>
                    <TableCell className="font-mono text-xs font-semibold whitespace-nowrap">
                      {std.code}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{std.title}</div>
                      {std.titleEn && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                          {std.titleEn}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs">
                        {countryFilters.find((c) => c.id === std.countryCode)?.flag}{" "}
                        {std.country}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                        {standardCategories.find((c) => c.id === std.category)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-0.5">
                        {std.process.slice(0, 2).map((p) => (
                          <Badge key={p} variant="outline" className="text-[9px] px-1 py-0">
                            {processTagOptions.find((pt) => pt.id === p)?.name || p}
                          </Badge>
                        ))}
                        {std.process.length > 2 && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            +{std.process.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={std.status === "现行" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {std.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      未找到匹配的标准，请调整搜索条件或筛选器
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10" />

      {/* 标准体系说明 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-lg">🇨🇳</div>
            <h3 className="mt-2 font-bold">中国标准体系</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              <strong>GB/T</strong> — 国家推荐性标准<br />
              <strong>GB</strong> — 国家强制性标准<br />
              <strong>HG/T</strong> — 化工行业标准<br />
              <strong>JC/T</strong> — 建材行业标准<br />
              中国FRP标准体系以单独试验方法标准为特点，每种力学性能有独立标准编号。
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-lg">��🇸</div>
            <h3 className="mt-2 font-bold">美国ASTM标准</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              <strong>ASTM D系列</strong> — 塑料和复合材料标准<br />
              <strong>ASTM E系列</strong> — 阻燃/烟雾标准<br />
              ASTM标准全球通用性最强，是国际贸易和技术交流的通用语言。许多GB标准参考ASTM制定。
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-lg">🇪🇺</div>
            <h3 className="mt-2 font-bold">欧洲EN标准</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              <strong>EN 13706</strong> — 拉挤型材核心标准(E17/E23)<br />
              <strong>EN 13121</strong> — GRP储罐和容器(4部分)<br />
              <strong>EN 1796/14364</strong> — GRP管道标准<br />
              EN标准侧重产品级规范，试验方法通常引用ISO标准。
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 标准对照表 */}
      <div className="mt-10">
        <h3 className="text-xl font-bold">常用标准对照表</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          同一试验项目在不同标准体系中的对应标准
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left">
                <th className="pb-2 pr-4 font-bold">试验项目</th>
                <th className="pb-2 pr-4 font-bold">🇨🇳 中国 GB/T</th>
                <th className="pb-2 pr-4 font-bold">����🇸 美国 ASTM</th>
                <th className="pb-2 pr-4 font-bold">🌐 国际 ISO</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">拉伸性能</td><td className="py-2 pr-4">GB/T 1447</td><td className="py-2 pr-4">ASTM D3039</td><td className="py-2 pr-4">ISO 527-4/5</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">弯曲性能</td><td className="py-2 pr-4">GB/T 1449</td><td className="py-2 pr-4">ASTM D790 / D7264</td><td className="py-2 pr-4">ISO 14125</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">压缩性能</td><td className="py-2 pr-4">GB/T 1448</td><td className="py-2 pr-4">ASTM D695 / D3410</td><td className="py-2 pr-4">ISO 14126</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">层间剪切</td><td className="py-2 pr-4">GB/T 1450.1</td><td className="py-2 pr-4">ASTM D2344</td><td className="py-2 pr-4">ISO 14130</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">面内剪切</td><td className="py-2 pr-4">GB/T 3355</td><td className="py-2 pr-4">ASTM D3518 / D5379</td><td className="py-2 pr-4">ISO 14129</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">冲击韧性</td><td className="py-2 pr-4">GB/T 1451</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">ISO 179-1</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">密度</td><td className="py-2 pr-4">GB/T 1463</td><td className="py-2 pr-4">ASTM D792</td><td className="py-2 pr-4">—</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">吸水率</td><td className="py-2 pr-4">GB/T 1462</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">ISO 62</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">巴氏硬度</td><td className="py-2 pr-4">GB/T 3854</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">—</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">氧指数</td><td className="py-2 pr-4">GB/T 2406.2 / 8924</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">—</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">纤维含量</td><td className="py-2 pr-4">GB/T 3855</td><td className="py-2 pr-4">ASTM D2584 / D3171</td><td className="py-2 pr-4">ISO 1172</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-sans font-medium">热变形温度</td><td className="py-2 pr-4">GB/T 1634.1</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">ISO 75-1</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <Separator className="my-10" />

      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-bold">标准持续更新中</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          标准数据库定期更新，收录最新发布和修订的FRP相关标准。如发现遗漏或信息有误，欢迎反馈。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          反馈邮箱: standards@f1frp.com
        </p>
      </div>
    </div>
  );
}
