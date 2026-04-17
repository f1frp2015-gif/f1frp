"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PostType = "buy" | "sell" | "question";

const postTypes = [
  { id: "buy" as const, label: "发布采购需求", icon: "🛒", description: "我需要采购原材料或制品" },
  { id: "sell" as const, label: "发布供应信息", icon: "🏭", description: "我可以供应材料或制品" },
  { id: "question" as const, label: "发布技术问答", icon: "❓", description: "我有技术问题想请教" },
];

const materialCategories = [
  "不饱和聚酯树脂", "乙烯基酯树脂", "环氧树脂", "酚醛树脂",
  "玻璃纤维纱", "玻璃纤维布", "碳纤维", "玄武岩纤维", "芳纶纤维",
  "PVC泡沫芯材", "巴沙木芯材",
  "玻璃钢管道", "玻璃钢储罐", "FRP格栅", "FRP型材", "FRP桥架",
  "固化剂/促进剂", "胶衣", "脱模剂", "其他",
];

const techCategories = [
  "手糊工艺", "缠绕工艺", "拉挤工艺", "模压工艺", "RTM工艺",
  "真空导入", "材料选型", "设备模具", "质量问题", "标准规范", "其他",
];

export default function NewPostPage() {
  const [type, setType] = useState<PostType | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">发布信息</h1>
        <p className="text-sm text-muted-foreground">选择发布类型，填写详细信息</p>
      </div>

      {!type && (
        <div className="grid gap-4 sm:grid-cols-3">
          {postTypes.map((pt) => (
            <Card
              key={pt.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => setType(pt.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl">{pt.icon}</div>
                <h3 className="mt-3 font-bold">{pt.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{pt.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {type && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {type === "buy" ? "🛒 采购需求" : type === "sell" ? "🏭 供应信息" : "❓ 技术问答"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setType(null)}>
                返回选择
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">标题 *</label>
              <Input
                placeholder={
                  type === "buy"
                    ? "例：采购196#不饱和聚酯树脂 20吨"
                    : type === "sell"
                      ? "例：长期供应ECR玻纤方格布 多规格"
                      : "例：真空导入时树脂流速太慢怎么办？"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">分类 *</label>
              <div className="flex flex-wrap gap-1.5">
                {(type === "question" ? techCategories : materialCategories).map((c) => (
                  <Badge key={c} variant="outline" className="cursor-pointer px-2 py-1 text-xs hover:bg-primary hover:text-primary-foreground">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">详细描述 *</label>
              <Textarea
                rows={6}
                placeholder={
                  type === "buy"
                    ? "请描述：品名/牌号、数量、质量要求、交货地点、期望价格区间等"
                    : type === "sell"
                      ? "请描述：产品详情、规格参数、产能、价格区间、交货方式等"
                      : "请详细描述您的问题，包括使用的材料、工艺、出现的现象等"
                }
              />
            </div>

            {(type === "buy" || type === "sell") && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">数量</label>
                  <Input placeholder="例：20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">单位</label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option>吨</option>
                    <option>千克</option>
                    <option>平方米</option>
                    <option>米</option>
                    <option>件</option>
                    <option>套</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">参考价格</label>
                  <Input placeholder="例：8000-9000元/吨" />
                </div>
              </div>
            )}

            {(type === "buy" || type === "sell") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">所在地区</label>
                  <Input placeholder="例：江苏南通" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    标记为急需
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">上传图片（可选）</label>
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  点击或拖拽上传，最多5张，支持 JPG/PNG，单张不超过 2MB
                </p>
                <Button variant="outline" size="sm" className="mt-2">选择图片</Button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              <span>📌</span>
              <span>
                {type === "question"
                  ? "问题发布后将在社区展示，其他用户可以回答。采纳最佳回答后问题标记为已解决。"
                  : "信息发布后经审核将在交易市场展示，有效期30天。其他用户可通过平台向您发送询盘。"
                }
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">存为草稿</Button>
              <Button>提交发布</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
