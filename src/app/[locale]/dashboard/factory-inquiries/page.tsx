import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { Inbox, ArrowRight, Plus, Mail } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { factoryInquiries, users } from "@/lib/db/schema";
import { PasteInquiryForm } from "./paste-inquiry-form";

export const metadata: Metadata = {
  title: "AI 询盘助手 · 待处理 | f1frp",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  new: {
    label: "新 · 待 AI 草拟",
    tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  drafting: {
    label: "AI 草拟中",
    tone: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  },
  drafted: {
    label: "已草拟 · 待发送",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  sent: {
    label: "已发送",
    tone: "border-border bg-muted text-muted-foreground",
  },
  replied_by_buyer: {
    label: "买家已回复",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  won: { label: "成单 🎉", tone: "border-emerald-500 bg-emerald-100" },
  lost: {
    label: "流单",
    tone: "border-border bg-muted text-muted-foreground",
  },
  spam: {
    label: "Spam",
    tone: "border-destructive/40 bg-destructive/5 text-destructive",
  },
};

export default async function FactoryInquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in?redirect_url=/dashboard/factory-inquiries");

  const [me] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!me) redirect("/dashboard"); // layout will create the users row

  const rows = await db
    .select({
      id: factoryInquiries.id,
      buyerName: factoryInquiries.buyerName,
      buyerCompany: factoryInquiries.buyerCompany,
      buyerCountry: factoryInquiries.buyerCountry,
      originalSubject: factoryInquiries.originalSubject,
      originalText: factoryInquiries.originalText,
      status: factoryInquiries.status,
      createdAt: factoryInquiries.createdAt,
    })
    .from(factoryInquiries)
    .where(eq(factoryInquiries.factoryUserId, me.id))
    .orderBy(desc(factoryInquiries.createdAt))
    .limit(50);

  return (
    <div>
      <header className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          S2 · AI 询盘助手
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          海外询盘 · 待处理
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          手动粘贴邮箱里的询盘 → AI 自动草拟中英双语回复 → 一键编辑 + 发送。
          邮箱自动接入(IMAP/Gmail/Outlook)将于 Phase 2 上线;现阶段用粘贴模式。
        </p>
      </header>

      {/* Paste a new inquiry */}
      <section className="mb-10 rounded-xl border border-border/70 bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <Plus size={14} className="text-muted-foreground" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            粘贴新询盘
          </h2>
        </div>
        <PasteInquiryForm />
      </section>

      {/* List */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Inbox size={14} className="text-muted-foreground" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            收件箱({rows.length})
          </h2>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-10 text-center">
            <Mail
              size={28}
              strokeWidth={1.5}
              className="mx-auto text-muted-foreground"
            />
            <p className="mt-4 text-[14px] text-muted-foreground">
              还没有询盘 — 把任意一封海外询盘邮件正文粘贴到上面试试。
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
            {rows.map((r) => {
              const meta = STATUS_LABEL[r.status] ?? STATUS_LABEL.new;
              return (
                <li key={r.id}>
                  <Link
                    href={
                      `/dashboard/factory-inquiries/${r.id}` as never
                    }
                    className="group block bg-background px-5 py-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold tracking-tight">
                            {r.originalSubject ?? "(无主题)"}
                          </span>
                          <span
                            className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tone}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {r.buyerName && <span>{r.buyerName}</span>}
                          {r.buyerCompany && <span>· {r.buyerCompany}</span>}
                          {r.buyerCountry && (
                            <span>· {r.buyerCountry}</span>
                          )}
                          <span>
                            · {new Date(r.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground/80">
                          {r.originalText.slice(0, 160)}
                        </p>
                      </div>
                      <ArrowRight
                        size={14}
                        className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
