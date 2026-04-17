import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { processes, standards } from "@/lib/data/tech";

export const metadata: Metadata = {
  title: "技术中心 - FRP复合材料工艺百科与标准文库",
  description:
    "FRP复合材料七大成型工艺详解，国家/行业/国际标准查询，在线计算工具。",
};

const tools = [
  {
    name: "FRP型材计算器",
    description: "梁挠度/弯曲应力分析，钢材→FRP等效替换计算，支持EN 13706/GB/T 31539",
    status: "已上线",
    href: "/tech/calculator",
  },
  {
    name: "窗户U值计算器",
    description: "整窗传热系数Uw计算，框材/玻璃/间隔条对比，国内外节能标准对照",
    status: "已上线",
    href: "/tech/u-value-calculator",
  },
  {
    name: "树脂用量计算器",
    description: "根据铺层面积和增强材料计算树脂、固化剂、促进剂用量",
    status: "即将上线",
    href: "#",
  },
  {
    name: "纤维含量计算",
    description: "根据制品重量和增强材料重量计算纤维重量/体积含量",
    status: "即将上线",
    href: "#",
  },
];

export default function TechPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">技术中心</h1>
        <p className="mt-2 text-muted-foreground">
          FRP复合材料工艺百科 · 标准文库 · 在线工具
        </p>
      </div>

      {/* Process Encyclopedia */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold">工艺百科</h2>
        <p className="mt-1 text-muted-foreground">
          7大FRP复合材料成型工艺详细解读
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processes.map((process) => (
            <Card key={process.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{process.name}</CardTitle>
                <CardDescription className="text-xs">
                  {process.nameEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {process.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {process.applications.slice(0, 3).map((app) => (
                    <Badge
                      key={app}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {app}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">工艺详情</h3>
          <Accordion className="w-full">
            {processes.map((process) => (
              <AccordionItem key={process.id} value={process.id}>
                <AccordionTrigger className="text-left">
                  <div>
                    <span className="font-semibold">{process.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {process.nameEn}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-2">
                    <p className="text-sm leading-relaxed">
                      {process.description}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-green-600">
                          优势
                        </h4>
                        <ul className="space-y-1">
                          {process.advantages.map((adv) => (
                            <li
                              key={adv}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="mt-1 text-green-500">✓</span>
                              {adv}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-red-600">
                          局限
                        </h4>
                        <ul className="space-y-1">
                          {process.disadvantages.map((dis) => (
                            <li
                              key={dis}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="mt-1 text-red-500">✗</span>
                              {dis}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        典型应用
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {process.applications.map((app) => (
                          <Badge key={app} variant="outline" className="text-xs">
                            {app}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        关键工艺参数
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {process.keyParameters.map((param) => (
                          <Badge
                            key={param}
                            variant="secondary"
                            className="text-xs"
                          >
                            {param}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Separator />

      {/* Standards */}
      <section id="standards" className="my-12">
        <h2 className="text-2xl font-bold">标准文库</h2>
        <p className="mt-1 text-muted-foreground">
          FRP复合材料相关国家标准、行业标准和国际标准
        </p>

        <Card className="mt-6">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标准编号</TableHead>
                  <TableHead>标准名称</TableHead>
                  <TableHead>类型</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standards.map((std) => (
                  <TableRow key={std.code}>
                    <TableCell className="font-mono text-sm font-medium">
                      {std.code}
                    </TableCell>
                    <TableCell>{std.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          std.type === "国标"
                            ? "default"
                            : std.type === "行标"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {std.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Online Tools */}
      <section id="tools" className="my-12">
        <h2 className="text-2xl font-bold">在线工具</h2>
        <p className="mt-1 text-muted-foreground">
          FRP复合材料工程计算工具（持续开发中）
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link key={tool.name} href={tool.href}>
              <Card className={`h-full transition-colors ${tool.status === "已上线" ? "hover:border-primary/50" : "opacity-70"}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    <Badge variant={tool.status === "已上线" ? "default" : "outline"} className="text-xs">
                      {tool.status}
                    </Badge>
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
