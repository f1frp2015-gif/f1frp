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
import { Separator } from "@/components/ui/separator";

const categoryOptions = [
  "制品生产商",
  "树脂供应商",
  "纤维供应商",
  "芯材供应商",
  "设备供应商",
  "模具制造商",
  "检测/认证服务",
  "贸易商",
  "设计/咨询",
  "其他",
];

const processOptions = [
  "手糊成型",
  "缠绕成型",
  "拉挤成型",
  "模压成型(SMC/BMC)",
  "RTM/LRTM",
  "真空导入(VARTM)",
  "喷射成型",
  "预浸料热压罐",
  "3D打印",
  "其他",
];

const certOptions = [
  "ISO 9001",
  "ISO 14001",
  "ISO 45001",
  "CE认证",
  "ASME认证",
  "CCS船级社",
  "GJB军标",
  "AS9100",
  "API认证",
  "其他",
];

const labelCls = "block text-sm font-medium mb-1.5";
const inputCls = "w-full";

export default function EnterprisePage() {
  const [category, setCategory] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">企业入驻</h1>
        <p className="text-sm text-muted-foreground">
          完善企业信息，获得供应商目录展示、供需信息优先推荐等权益
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
          <CardDescription>带 * 为必填项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>企业全称 *</label>
              <Input placeholder="例：XX复合材料有限公司" />
            </div>
            <div>
              <label className={labelCls}>企业简称</label>
              <Input placeholder="例：XX复材" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>企业类型 *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">请选择</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>成立年份</label>
              <Input type="number" placeholder="例：2010" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>所在省份 *</label>
              <Input placeholder="例：江苏" />
            </div>
            <div>
              <label className={labelCls}>所在城市 *</label>
              <Input placeholder="例：南通" />
            </div>
            <div>
              <label className={labelCls}>员工规模</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">请选择</option>
                <option>1-50人</option>
                <option>50-200人</option>
                <option>200-500人</option>
                <option>500-1000人</option>
                <option>1000人以上</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>详细地址</label>
            <Input placeholder="街道门牌号" />
          </div>

          <div>
            <label className={labelCls}>企业简介 *</label>
            <Textarea
              placeholder="介绍企业主营业务、产能规模、主要客户群体等（100-500字）"
              rows={4}
            />
          </div>

          <div>
            <label className={labelCls}>主营产品 *</label>
            <Input placeholder="用逗号分隔，例：玻璃钢格栅,FRP型材,拉挤产品" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">生产工艺</CardTitle>
          <CardDescription>选择您企业擅长的成型工艺（可多选）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {processOptions.map((p) => (
              <Badge
                key={p}
                variant={selectedProcesses.includes(p) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggleItem(selectedProcesses, setSelectedProcesses, p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">资质认证</CardTitle>
          <CardDescription>选择已获得的认证（可多选）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {certOptions.map((c) => (
              <Badge
                key={c}
                variant={selectedCerts.includes(c) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggleItem(selectedCerts, setSelectedCerts, c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">联系方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>联系人 *</label>
              <Input placeholder="姓名" />
            </div>
            <div>
              <label className={labelCls}>联系电话 *</label>
              <Input placeholder="手机号码" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>微信号</label>
              <Input placeholder="方便客户添加微信咨询" />
            </div>
            <div>
              <label className={labelCls}>企业官网</label>
              <Input placeholder="https://" />
            </div>
          </div>
          <div>
            <label className={labelCls}>电子邮箱</label>
            <Input type="email" placeholder="business@example.com" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">企业资质文件</CardTitle>
          <CardDescription>
            上传营业执照可获得"已认证"标识，提升可信度和排名
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <div className="text-3xl">📄</div>
            <p className="mt-2 text-sm font-medium">点击或拖拽上传营业执照</p>
            <p className="mt-1 text-xs text-muted-foreground">
              支持 JPG、PNG、PDF 格式，文件大小不超过 5MB
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              选择文件
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          提交后将在1-3个工作日内完成审核，审核通过后企业信息将展示在供应商目录中
        </p>
        <Button size="lg">提交入驻申请</Button>
      </div>
    </div>
  );
}
