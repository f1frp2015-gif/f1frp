"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export function PasteInquiryForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      source: "manual_paste" as const,
      buyerName: String(fd.get("buyerName") ?? "").trim() || undefined,
      buyerEmail: String(fd.get("buyerEmail") ?? "").trim() || undefined,
      buyerCountry: String(fd.get("buyerCountry") ?? "").trim() || undefined,
      buyerCompany: String(fd.get("buyerCompany") ?? "").trim() || undefined,
      originalSubject:
        String(fd.get("originalSubject") ?? "").trim() || undefined,
      originalText: String(fd.get("originalText") ?? "").trim(),
    };
    if (payload.originalText.length < 10) {
      setBusy(false);
      setErr("询盘正文太短 (≥ 10 字符)");
      return;
    }
    try {
      const res = await fetch("/api/factory-inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { id: string };
      router.push(`/dashboard/factory-inquiries/${data.id}`);
    } catch (e) {
      setBusy(false);
      setErr(e instanceof Error ? e.message : "提交失败");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="buyerName"
          placeholder="买家姓名(可选)"
          className="rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
        <input
          name="buyerCompany"
          placeholder="买家公司"
          className="rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
        <input
          name="buyerEmail"
          type="email"
          placeholder="买家邮箱"
          className="rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
        <input
          name="buyerCountry"
          placeholder="国家(如 US / DE / AU)"
          className="rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
      </div>
      <input
        name="originalSubject"
        placeholder="邮件主题(可选)"
        className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
      />
      <textarea
        name="originalText"
        required
        rows={6}
        placeholder="把海外买家询盘邮件正文粘贴到这里（英文 / 中文都可以）..."
        className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
      />
      {err && (
        <p className="text-[12px] text-destructive">{err}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            创建中…
          </>
        ) : (
          <>
            创建询盘 + 进入 AI 草拟
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
