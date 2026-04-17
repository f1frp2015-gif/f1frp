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
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formulas,
  processFilters,
  categoryFilters,
  type Formula,
} from "@/lib/data/formulas";

function DifficultyBadge({ level }: { level: string }) {
  const variant =
    level === "入门"
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : level === "中级"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${variant}`}>
      {level}
    </span>
  );
}

function FormulaDetail({ formula }: { formula: Formula }) {
  return (
    <div className="space-y-5 pb-2">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {formula.description}
      </p>

      {/* 树脂体系 */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">1</span>
          树脂体系
        </h4>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">材料</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>用量</TableHead>
                <TableHead className="hidden sm:table-cell">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formula.resinSystem.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{item.role}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{item.amount}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{item.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 增强材料 */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">2</span>
          增强材料
        </h4>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">材料</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>用量/位置</TableHead>
                <TableHead className="hidden sm:table-cell">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formula.reinforcement.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{item.role}</Badge></TableCell>
                  <TableCell className="text-xs">{item.amount}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{item.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 辅助材料 */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">3</span>
          辅助材料
        </h4>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">材料</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>用量</TableHead>
                <TableHead className="hidden sm:table-cell">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formula.auxiliaries.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{item.role}</Badge></TableCell>
                  <TableCell className="text-xs">{item.amount}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{item.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 工艺参数 + 预期性能 */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">4</span>
            工艺参数
          </h4>
          <div className="space-y-1.5">
            {formula.processing.map((p, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">{p.name}</span>
                <span className="shrink-0 text-right text-xs font-medium">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">5</span>
            预期性能
          </h4>
          <div className="space-y-1.5">
            {formula.properties.map((p, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">{p.name}</span>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-medium">{p.value}</span>
                  {p.standard && (
                    <span className="ml-1 text-[10px] text-muted-foreground">({p.standard})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 实操要点 */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-xs text-amber-600">!</span>
          实操要点
        </h4>
        <ul className="space-y-1.5">
          {formula.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0 text-amber-500">●</span>
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 安全须知 */}
      <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">安全须知</h4>
        <ul className="space-y-1">
          {formula.safetyNotes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <span className="mt-0.5 shrink-0">⚠</span>
              {note}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] text-muted-foreground">
        * 配方数据仅供参考，实际生产请根据原材料批次、环境条件和设备参数进行调整。建议先做小样试验验证。
      </p>
    </div>
  );
}

export function FormulasClient() {
  const [search, setSearch] = useState("");
  const [activeProcess, setActiveProcess] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = formulas.filter((f) => {
    const matchSearch =
      !search ||
      f.name.includes(search) ||
      f.process.includes(search) ||
      f.application.includes(search) ||
      f.description.includes(search);
    const matchProcess = activeProcess === "all" || f.processId === activeProcess;
    const matchCategory = activeCategory === "all" || f.category === activeCategory;
    return matchSearch && matchProcess && matchCategory;
  });

  const groupedByProcess = filtered.reduce<Record<string, Formula[]>>((acc, f) => {
    if (!acc[f.process]) acc[f.process] = [];
    acc[f.process].push(f);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">配方数据库</h1>
        <p className="mt-2 text-muted-foreground">
          FRP复合材料工艺配方大全 — 树脂体系、增强材料、辅材配比、工艺参数和实操要点
        </p>
      </div>

      {/* 统计概览 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formulas.length}</div>
            <div className="text-xs text-muted-foreground">配方总数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{processFilters.length - 1}</div>
            <div className="text-xs text-muted-foreground">覆盖工艺</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formulas.filter((f) => f.difficulty === "入门").length}</div>
            <div className="text-xs text-muted-foreground">入门级配方</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formulas.filter((f) => f.difficulty === "高级").length}</div>
            <div className="text-xs text-muted-foreground">高级配方</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选 */}
      <div className="mb-6 space-y-3">
        <Input
          placeholder="搜索配方名称、工艺、应用场景..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">工艺：</span>
          {processFilters.map((p) => (
            <Badge
              key={p.id}
              variant={activeProcess === p.id ? "default" : "outline"}
              className="cursor-pointer px-2.5 py-1 text-xs"
              onClick={() => setActiveProcess(p.id)}
            >
              {p.icon} {p.name}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">类型：</span>
          {categoryFilters.map((c) => (
            <Badge
              key={c.id}
              variant={activeCategory === c.id ? "default" : "outline"}
              className="cursor-pointer px-2.5 py-1 text-xs"
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 配方列表 */}
      {Object.entries(groupedByProcess).map(([processName, processFormulas]) => (
        <div key={processName} className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <span className="text-lg">
              {processFilters.find((p) => p.name === processName)?.icon}
            </span>
            {processName}
            <Badge variant="secondary" className="text-xs">{processFormulas.length}个配方</Badge>
          </h2>

          <Accordion className="w-full space-y-3">
            {processFormulas.map((formula) => (
              <AccordionItem
                key={formula.id}
                value={formula.id}
                className="rounded-lg border bg-background px-5"
              >
                <AccordionTrigger className="py-4">
                  <div className="flex flex-1 flex-col items-start gap-1.5 pr-4 text-left sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-semibold">{formula.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <DifficultyBadge level={formula.difficulty} />
                      <Badge variant="outline" className="text-[10px]">
                        {formula.application.split("、")[0]}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Separator className="mb-5" />
                  <FormulaDetail formula={formula} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          未找到匹配的配方，请调整筛选条件
        </div>
      )}

      {/* 底部说明 */}
      <Separator className="my-10" />
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-bold">贡献配方</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          您有经过验证的FRP配方愿意分享吗？配方数据库持续扩充中，欢迎行业专家投稿。
          投稿配方经审核后发布，标注贡献者信息。
        </p>
        <div className="mt-3 text-sm text-muted-foreground">
          投稿邮箱: formula@f1frp.com · 微信: f1frp_com
        </div>
      </div>
    </div>
  );
}
