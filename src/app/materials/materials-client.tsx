"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { materials, materialCategories, type Material } from "@/lib/data/materials";

function MaterialDetail({ material }: { material: Material }) {
  const props = material.properties;
  const entries = Object.entries(props).filter(([, v]) => v);
  const propLabels: Record<string, string> = {
    density: "密度",
    tensileStrength: "拉伸强度",
    flexuralStrength: "弯曲强度",
    flexuralModulus: "弯曲模量",
    hdt: "热变形温度",
    elongation: "断裂伸长率",
    hardness: "硬度",
    flameRetardant: "阻燃等级",
    waterAbsorption: "吸水率",
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{material.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {material.applications.map((app) => (
            <Badge key={app} variant="secondary" className="text-xs">
              {app}
            </Badge>
          ))}
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>属性</TableHead>
              <TableHead>数值</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">品牌</TableCell>
              <TableCell>{material.brand}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">型号</TableCell>
              <TableCell className="font-mono text-sm">{material.model}</TableCell>
            </TableRow>
            {entries.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium">
                  {propLabels[key] || key}
                </TableCell>
                <TableCell className="font-mono text-sm">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MaterialsClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = materials.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.includes(search) ||
      m.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.includes(search) ||
      m.model.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">材料数据库</h1>
        <p className="mt-2 text-muted-foreground">
          中国首个结构化FRP复合材料属性数据库 — 查询、筛选、对比
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="搜索材料名称、品牌、型号..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setActiveCategory("all")}
          >
            全部
          </Badge>
          {materialCategories.map((cat) => (
            <Badge
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead className="hidden sm:table-cell">分类</TableHead>
                  <TableHead className="hidden md:table-cell">品牌</TableHead>
                  <TableHead className="hidden md:table-cell">型号</TableHead>
                  <TableHead className="hidden lg:table-cell">密度</TableHead>
                  <TableHead className="hidden lg:table-cell">拉伸强度</TableHead>
                  <TableHead className="hidden lg:table-cell">弯曲强度</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {material.nameEn}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {material.subCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {material.brand}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {material.model}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      {material.properties.density || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      {material.properties.tensileStrength || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      {material.properties.flexuralStrength || "-"}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger className="text-sm text-primary underline-offset-4 hover:underline">
                          查看
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{material.name}</DialogTitle>
                            <DialogDescription>
                              {material.nameEn} — {material.brand}{" "}
                              {material.model}
                            </DialogDescription>
                          </DialogHeader>
                          <MaterialDetail material={material} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      未找到匹配的材料，请调整搜索条件
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        当前收录 {materials.length} 种材料 · 数据持续更新中 ·{" "}
        <span className="text-primary cursor-pointer hover:underline">
          提交材料数据
        </span>
      </div>
    </div>
  );
}
