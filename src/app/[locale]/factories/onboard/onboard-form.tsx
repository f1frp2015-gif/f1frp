"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";

type Tier = "s1_starter" | "s2_pro" | "s5_enterprise" | "undecided";

const CATEGORIES = [
  { id: "manufacturer", label: "制品生产商(成品 / 拉挤 / 缠绕等)" },
  { id: "fiber", label: "纤维供应商(玻纤 / 碳纤 / 玄武岩等)" },
  { id: "resin", label: "树脂供应商(不饱和聚酯 / 乙烯基酯 / 环氧)" },
  { id: "additive", label: "助剂 / 固化剂供应商" },
  { id: "equipment", label: "设备供应商(拉挤线 / RTM 压机 / 缠绕机)" },
  { id: "mold", label: "模具 / 模头制造商" },
  { id: "tooling", label: "工装 / NDT 检测装备" },
  { id: "service", label: "检测 / 认证服务" },
] as const;

const PROVINCES = [
  "江苏",
  "山东",
  "浙江",
  "广东",
  "河北",
  "河南",
  "湖北",
  "上海",
  "北京",
  "天津",
  "重庆",
  "四川",
  "辽宁",
  "陕西",
  "福建",
  "其他",
] as const;

const TIER_LABEL: Record<Tier, string> = {
  s1_starter: "S1 验证标 · ¥500/月",
  s2_pro: "S2 询盘助手 · ¥1,800/月",
  s5_enterprise: "S5 全套 · ¥4,500/月",
  undecided: "还没决定 · 先聊聊",
};

export function OnboardForm({ initialTier }: { initialTier: Tier }) {
  const [state, setState] = useState<
    "idle" | "submitting" | "ok" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tier, setTier] = useState<Tier>(initialTier);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      companyName: String(fd.get("companyName") ?? "").trim(),
      contactName: String(fd.get("contactName") ?? "").trim(),
      contactPhone: String(fd.get("contactPhone") ?? "").trim() || undefined,
      contactEmail: String(fd.get("contactEmail") ?? "").trim(),
      contactWechat: String(fd.get("contactWechat") ?? "").trim() || undefined,
      factoryWebsite:
        String(fd.get("factoryWebsite") ?? "").trim() || undefined,
      province: String(fd.get("province") ?? "").trim() || undefined,
      category: String(fd.get("category") ?? "").trim() || undefined,
      monthlyInquiryEstimate: (() => {
        const n = Number(fd.get("monthlyInquiryEstimate"));
        return Number.isFinite(n) && n > 0 ? n : undefined;
      })(),
      interestedTier: tier,
      note: String(fd.get("note") ?? "").trim() || undefined,
      source: "web_onboard",
    };

    if (!payload.companyName || !payload.contactName || !payload.contactEmail) {
      setState("error");
      setErrorMsg("公司名 / 联系人 / 邮箱 是必填字段");
      return;
    }

    try {
      const res = await fetch("/api/factory-waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setState("ok");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "提交失败");
    }
  }

  if (state === "ok") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
              收到 · 1 个工作日内联系你
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-emerald-900/90 dark:text-emerald-100/90">
              我们的客户成功团队会通过你留的邮箱或微信联系你,确认 30 分钟通话时间。
              如果 24 小时内没收到我们消息,请直接发邮件到{" "}
              <a
                href="mailto:f1frp2015@gmail.com"
                className="font-medium underline"
              >
                f1frp2015@gmail.com
              </a>
              ,我们会立即响应。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={"/factories" as never}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted dark:border-emerald-800"
              >
                回到工厂主页
              </Link>
              <Link
                href={"/source-from-china" as never}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted dark:border-emerald-800"
              >
                看看我们 getfrp 海外侧
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FieldGroup title="联系信息" required>
        <Field
          label="公司名(全称)"
          name="companyName"
          placeholder="例:江苏 XX 复合材料有限公司"
          required
        />
        <Field
          label="联系人姓名"
          name="contactName"
          placeholder="例:王某某"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="联系邮箱"
            name="contactEmail"
            type="email"
            placeholder="business@example.com"
            required
          />
          <Field
            label="联系电话"
            name="contactPhone"
            type="tel"
            placeholder="138xxxx xxxx"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="微信号(可选)"
            name="contactWechat"
            placeholder="wechat_id"
          />
          <Field
            label="工厂官网(可选)"
            name="factoryWebsite"
            type="url"
            placeholder="https://..."
          />
        </div>
      </FieldGroup>

      <FieldGroup title="工厂概况">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="省份" name="province">
            <option value="">— 选择省份 —</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select label="主营类别" name="category">
            <option value="">— 选择类别 —</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <Field
          label="每月海外询盘估算(条数,可选)"
          name="monthlyInquiryEstimate"
          type="number"
          placeholder="例:30"
        />
      </FieldGroup>

      <FieldGroup title="意向套餐">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                tier === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/70 bg-background hover:border-foreground/40"
              }`}
            >
              <input
                type="radio"
                name="interestedTier"
                value={t}
                checked={tier === t}
                onChange={() => setTier(t)}
                className="mt-1 shrink-0 accent-foreground"
              />
              <span className="text-[14px] font-medium">{TIER_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="备注(可选)">
        <Textarea
          label="任何想我们提前知道的:目前用什么工具 / 主要海外市场 / 痛点 / 其他要求"
          name="note"
          placeholder="例:目前用 Outlook 收询盘,每月 50-100 条,业务员英文一般,主要市场美国和德国..."
        />
      </FieldGroup>

      {state === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-[13px] text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            提交中…
          </>
        ) : (
          <>
            提交申请
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}

function FieldGroup({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-border/70 bg-background p-5">
      <legend className="-mb-1 inline-flex items-center gap-1.5 px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
        {required && (
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
            必填
          </span>
        )}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12.5px] font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[14px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
      />
    </label>
  );
}

function Select({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12.5px] font-medium text-foreground">{label}</span>
      <select
        name={name}
        className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[14px] focus:border-foreground/40 focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12.5px] font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[14px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
      />
    </label>
  );
}
