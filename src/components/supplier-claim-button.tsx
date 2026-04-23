"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SupplierClaimButton({
  supplierId,
  supplierName,
}: {
  supplierId: string;
  supplierName: string;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <Button variant="outline" size="sm" disabled>
        认领此企业
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <Link
        href={`/sign-in?redirect_url=/suppliers`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        登录后认领
      </Link>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      contactName: String(data.get("contactName") || ""),
      contactTitle: String(data.get("contactTitle") || ""),
      contactPhone: String(data.get("contactPhone") || ""),
      contactEmail: String(data.get("contactEmail") || ""),
      businessLicenseUrl: String(data.get("businessLicenseUrl") || ""),
      note: String(data.get("note") || ""),
    };

    const res = await fetch(`/api/suppliers/${supplierId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error ?? "提交失败，请稍后重试");
      return;
    }
    setMessage(body?.data?.message ?? "申请已提交");
    form.reset();
    setTimeout(() => {
      setOpen(false);
      router.refresh();
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        认领此企业
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>认领「{supplierName}」</DialogTitle>
          <DialogDescription>
            认领成功后可编辑企业信息、上传产品 CAD / PDF、管理询盘。提交后我们会通过邮件或电话与您核实。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">联系人姓名 *</label>
              <Input name="contactName" required placeholder="张经理" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">职位</label>
              <Input name="contactTitle" placeholder="销售总监" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">电话 *</label>
              <Input name="contactPhone" required placeholder="138xxxx0000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">企业邮箱 *</label>
              <Input name="contactEmail" required type="email" placeholder="sales@company.com" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">营业执照 URL（可选）</label>
            <Input name="businessLicenseUrl" type="url" placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">备注（如您与该企业的关系）</label>
            <Textarea name="note" rows={3} placeholder="如：我是该企业销售部，需认领公司资料..." />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              {message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "提交认领"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
