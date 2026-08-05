"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, FileUp, RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MATERIAL_SYSTEMS,
  OBJECT_TYPES,
  PROCESS_TYPES,
  PRODUCT_FAMILIES,
  PRODUCT_FORMS,
  RESIN_SYSTEMS,
  classifySupplierProduct,
  taxonomyLabel,
  type MaterialSystem,
  type ObjectType,
  type ProcessType,
  type ProductFamily,
  type ProductForm,
  type ResinSystem,
} from "@/lib/supplier-products/taxonomy";
import {
  archiveSupplierProduct,
  createSupplierProduct,
} from "./actions";

type ProductRow = {
  id: string;
  name: string;
  nameEn: string;
  objectType: string;
  productFamily: string;
  form: string | null;
  processes: string[];
  materials: string[];
  resins: string[];
  standards: string[];
  specifications: Record<string, string>;
  datasheetFileName: string | null;
  classificationStatus: string;
  classificationRuleVersion: string;
  classificationConfidence: number;
  publicationStatus: string;
  createdAt: string;
};

type Props = {
  enterprise: { id: string; name: string; status: string } | null;
  initialProducts: ProductRow[];
};

type FormState = {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  standards: string;
  dimensions: string;
  model: string;
  moq: string;
  leadTime: string;
  overrideObjectType: string;
  overrideProductFamily: string;
  overrideForm: string;
  overrideProcess: string;
  overrideMaterial: string;
  overrideResin: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  standards: "",
  dimensions: "",
  model: "",
  moq: "",
  leadTime: "",
  overrideObjectType: "",
  overrideProductFamily: "",
  overrideForm: "",
  overrideProcess: "",
  overrideMaterial: "",
  overrideResin: "",
};

const PULTRUDED_PROFILE_SAMPLE: FormState = {
  ...EMPTY_FORM,
  name: "玻璃钢拉挤槽钢",
  nameEn: "Pultruded GFRP Channel",
  description: "连续拉挤成型的玻璃纤维增强乙烯基酯槽型结构型材，用于化工防腐平台、电缆支架和基础设施。",
  descriptionEn:
    "Continuous-pultruded glass-fiber/vinyl-ester structural channel for corrosion-resistant platforms, cable supports and infrastructure.",
  standards: "EN 13706",
  dimensions: "100 × 50 × 8 mm; custom lengths available",
  model: "C100-50-8",
  moq: "500 m / profile size",
  leadTime: "20–30 days",
};

const labelClass = "mb-1.5 block text-sm font-medium";
const selectClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function FacetBadges({
  facet,
  values,
}: {
  facet: "process" | "material" | "resin" | "application";
  values: string[];
}) {
  if (values.length === 0) return <span className="text-xs text-muted-foreground">待补充</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Badge key={value} variant="secondary">
          {taxonomyLabel(facet, value, "zh")}
        </Badge>
      ))}
    </div>
  );
}

export function ProductsClient({ enterprise, initialProducts }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [datasheet, setDatasheet] = useState<{ key: string; name: string } | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const suggestion = useMemo(
    () =>
      classifySupplierProduct({
        name: form.name,
        nameEn: form.nameEn,
        description: form.description,
        descriptionEn: form.descriptionEn,
        standards: form.standards,
      }),
    [form.name, form.nameEn, form.description, form.descriptionEn, form.standards],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadDatasheet(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const signResponse = await fetch("/api/uploads/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, kind: "product" }),
      });
      const sign = await signResponse.json().catch(() => ({}));
      if (!signResponse.ok) throw new Error(sign?.error ?? "产品资料上传初始化失败");
      const putResponse = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) throw new Error("产品资料上传失败");
      setDatasheet({ key: sign.key, name: file.name });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "上传失败" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit() {
    if (!form.name.trim() || !form.nameEn.trim()) {
      setMessage({ kind: "error", text: "请填写中英文产品名称，英文名称用于海外买家搜索。" });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await createSupplierProduct({
        ...form,
        overrideObjectType: (form.overrideObjectType || undefined) as ObjectType | undefined,
        overrideProductFamily: (form.overrideProductFamily || undefined) as ProductFamily | undefined,
        overrideForm: (form.overrideForm || undefined) as ProductForm | undefined,
        overrideProcess: (form.overrideProcess || undefined) as ProcessType | undefined,
        overrideMaterial: (form.overrideMaterial || undefined) as MaterialSystem | undefined,
        overrideResin: (form.overrideResin || undefined) as ResinSystem | undefined,
        datasheetKey: datasheet?.key ?? "",
        datasheetFileName: datasheet?.name ?? "",
      });
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "ok", text: result.message });
      setForm(EMPTY_FORM);
      setDatasheet(null);
      router.refresh();
    });
  }

  function archive(productId: string) {
    startTransition(async () => {
      const result = await archiveSupplierProduct(productId);
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "ok", text: "产品已归档，不再出现在公开结构化目录中。" });
      router.refresh();
    });
  }

  if (!enterprise) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>结构化产品目录</CardTitle>
          <CardDescription>请先认领供应商企业或完成企业入驻，再上传产品。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">结构化产品目录</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {enterprise.name} · 自动分类 → 供应商确认 → 公开展示 → 平台核验
          </p>
        </div>
        <Badge variant={enterprise.status === "verified" ? "default" : "outline"}>
          企业身份：{enterprise.status === "verified" ? "已审核" : "审核中"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">1. 上传产品基础信息</CardTitle>
              <CardDescription className="mt-1">
                中英文名称决定买家关键词覆盖；说明文字用于自动补全工艺、材料、形态和应用。
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm(PULTRUDED_PROFILE_SAMPLE)}>
              <Sparkles size={14} /> 载入 Pultruded Profile 示例
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="product-name">中文产品名 *</label>
              <Input id="product-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="玻璃钢拉挤槽钢" />
            </div>
            <div>
              <label className={labelClass} htmlFor="product-name-en">英文产品名 *</label>
              <Input id="product-name-en" value={form.nameEn} onChange={(event) => update("nameEn", event.target.value)} placeholder="Pultruded GFRP Channel" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="product-description">中文说明</label>
              <Textarea id="product-description" rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="材料、树脂、工艺、用途…" />
            </div>
            <div>
              <label className={labelClass} htmlFor="product-description-en">英文说明</label>
              <Textarea id="product-description-en" rows={4} value={form.descriptionEn} onChange={(event) => update("descriptionEn", event.target.value)} placeholder="Material, resin system, process and applications…" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className={labelClass} htmlFor="product-model">型号</label><Input id="product-model" value={form.model} onChange={(event) => update("model", event.target.value)} placeholder="C100-50-8" /></div>
            <div><label className={labelClass} htmlFor="product-dimensions">尺寸/规格</label><Input id="product-dimensions" value={form.dimensions} onChange={(event) => update("dimensions", event.target.value)} placeholder="100 × 50 × 8 mm" /></div>
            <div><label className={labelClass} htmlFor="product-standards">适用标准</label><Input id="product-standards" value={form.standards} onChange={(event) => update("standards", event.target.value)} placeholder="EN 13706, ASTM D4385" /></div>
            <div><label className={labelClass} htmlFor="product-moq">MOQ</label><Input id="product-moq" value={form.moq} onChange={(event) => update("moq", event.target.value)} placeholder="500 m / size" /></div>
            <div><label className={labelClass} htmlFor="product-lead-time">交期</label><Input id="product-lead-time" value={form.leadTime} onChange={(event) => update("leadTime", event.target.value)} placeholder="20–30 days" /></div>
            <div>
              <label className={labelClass}>产品资料（可选）</label>
              <input ref={fileRef} type="file" className="hidden" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadDatasheet(event.target.files[0])} />
              <Button type="button" variant="outline" className="w-full justify-start" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <FileUp size={14} /> {uploading ? "上传中…" : datasheet?.name ?? "上传 PDF / 图片"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. 自动分类结果与人工确认</CardTitle>
          <CardDescription>
            规则版本 {suggestion.ruleVersion} · 置信度 {suggestion.confidence}%；可在下方纠正主分类。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className={labelClass}>对象类型</label><select className={selectClass} value={form.overrideObjectType} onChange={(event) => update("overrideObjectType", event.target.value)}><option value="">自动：{taxonomyLabel("objectType", suggestion.objectType, "zh")}</option>{OBJECT_TYPES.map((value) => <option key={value} value={value}>{taxonomyLabel("objectType", value, "zh")}</option>)}</select></div>
            <div><label className={labelClass}>产品族</label><select className={selectClass} value={form.overrideProductFamily} onChange={(event) => update("overrideProductFamily", event.target.value)}><option value="">自动：{taxonomyLabel("family", suggestion.productFamily, "zh")}</option>{PRODUCT_FAMILIES.map((value) => <option key={value} value={value}>{taxonomyLabel("family", value, "zh")}</option>)}</select></div>
            <div><label className={labelClass}>产品形态</label><select className={selectClass} value={form.overrideForm} onChange={(event) => update("overrideForm", event.target.value)}><option value="">自动：{taxonomyLabel("form", suggestion.form, "zh")}</option>{PRODUCT_FORMS.map((value) => <option key={value} value={value}>{taxonomyLabel("form", value, "zh")}</option>)}</select></div>
            <div><label className={labelClass}>主工艺</label><select className={selectClass} value={form.overrideProcess} onChange={(event) => update("overrideProcess", event.target.value)}><option value="">自动：{suggestion.processes[0] ? taxonomyLabel("process", suggestion.processes[0], "zh") : "待补充"}</option>{PROCESS_TYPES.map((value) => <option key={value} value={value}>{taxonomyLabel("process", value, "zh")}</option>)}</select></div>
            <div><label className={labelClass}>主增强材料</label><select className={selectClass} value={form.overrideMaterial} onChange={(event) => update("overrideMaterial", event.target.value)}><option value="">自动：{suggestion.materials[0] ? taxonomyLabel("material", suggestion.materials[0], "zh") : "待补充"}</option>{MATERIAL_SYSTEMS.map((value) => <option key={value} value={value}>{taxonomyLabel("material", value, "zh")}</option>)}</select></div>
            <div><label className={labelClass}>树脂体系</label><select className={selectClass} value={form.overrideResin} onChange={(event) => update("overrideResin", event.target.value)}><option value="">自动：{suggestion.resins[0] ? taxonomyLabel("resin", suggestion.resins[0], "zh") : "待补充"}</option>{RESIN_SYSTEMS.map((value) => <option key={value} value={value}>{taxonomyLabel("resin", value, "zh")}</option>)}</select></div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><div className="mb-2 text-xs font-semibold text-muted-foreground">工艺标签</div><FacetBadges facet="process" values={form.overrideProcess ? [form.overrideProcess, ...suggestion.processes.filter((value) => value !== form.overrideProcess)] : suggestion.processes} /></div>
              <div><div className="mb-2 text-xs font-semibold text-muted-foreground">材料/树脂</div><div className="space-y-2"><FacetBadges facet="material" values={form.overrideMaterial ? [form.overrideMaterial, ...suggestion.materials.filter((value) => value !== form.overrideMaterial)] : suggestion.materials} /><FacetBadges facet="resin" values={form.overrideResin ? [form.overrideResin, ...suggestion.resins.filter((value) => value !== form.overrideResin)] : suggestion.resins} /></div></div>
              <div><div className="mb-2 text-xs font-semibold text-muted-foreground">应用场景</div><FacetBadges facet="application" values={suggestion.applications} /></div>
              <div><div className="mb-2 text-xs font-semibold text-muted-foreground">标准代码</div><div className="flex flex-wrap gap-1.5">{suggestion.standards.length ? suggestion.standards.map((value) => <Badge key={value} variant="outline">{value}</Badge>) : <span className="text-xs text-muted-foreground">待补充</span>}</div></div>
            </div>
            <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">查看规则命中依据</summary><ul className="mt-2 list-disc space-y-1 pl-5">{suggestion.evidence.map((item) => <li key={item}>{item}</li>)}</ul></details>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              点击确认表示这些分类由企业确认；平台仅核验企业身份，产品性能、标准和认证需另行提交证据审核。
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => { setForm(EMPTY_FORM); setDatasheet(null); }}><RotateCcw size={14} /> 重置</Button>
              <Button type="button" disabled={isPending || !form.name.trim() || !form.nameEn.trim()} onClick={submit}><CheckCircle2 size={15} /> {isPending ? "保存中…" : "确认分类并保存"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {message && <div role="status" className={`rounded-md border p-3 text-sm ${message.kind === "ok" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">已上传产品（{initialProducts.length}）</CardTitle>
          <CardDescription>“供应商确认”与“平台核验”分开记录，公开页会明确显示信息来源。</CardDescription>
        </CardHeader>
        <CardContent>
          {initialProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">尚未上传结构化产品。可先载入 Pultruded Profile 示例跑通流程。</div>
          ) : (
            <div className="space-y-3">
              {initialProducts.map((product) => (
                <article key={product.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{product.nameEn}</h3><p className="mt-1 text-sm text-muted-foreground">{product.name}</p></div>
                    <div className="flex flex-wrap gap-1.5"><Badge variant="outline">供应商确认</Badge><Badge variant={product.publicationStatus === "published" ? "default" : "secondary"}>{product.publicationStatus === "published" ? "已公开" : product.publicationStatus === "archived" ? "已归档" : "草稿"}</Badge></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="secondary">{taxonomyLabel("family", product.productFamily, "zh")}</Badge>{product.form && <Badge variant="secondary">{taxonomyLabel("form", product.form, "zh")}</Badge>}{product.processes.map((value) => <Badge key={value} variant="outline">{taxonomyLabel("process", value, "zh")}</Badge>)}</div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground"><span>{product.classificationRuleVersion} · {product.classificationConfidence}% · {new Date(product.createdAt).toLocaleDateString("zh-CN")}</span>{product.publicationStatus !== "archived" && <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => archive(product.id)}><Archive size={13} /> 归档</Button>}</div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
