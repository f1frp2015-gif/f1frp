import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, MapPin, Building2, Mail, Clock } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { factoryInquiries, users } from "@/lib/db/schema";
import { InquiryDraftPanel } from "./draft-panel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function FactoryInquiryDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (locale !== "zh") notFound();

  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [me] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!me) redirect("/dashboard");

  const [row] = await db
    .select()
    .from(factoryInquiries)
    .where(
      and(
        eq(factoryInquiries.id, id),
        eq(factoryInquiries.factoryUserId, me.id),
      ),
    )
    .limit(1);
  if (!row) notFound();

  return (
    <div className="max-w-4xl">
      <Link
        href={"/dashboard/factory-inquiries" as never}
        className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={12} />
        返回收件箱
      </Link>

      <header className="mb-6 mt-4 border-b border-border/70 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {row.originalSubject ?? "(无主题)"}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          {row.buyerName && (
            <span className="inline-flex items-center gap-1">
              <Building2 size={11} />
              {row.buyerName}
              {row.buyerCompany ? ` · ${row.buyerCompany}` : ""}
            </span>
          )}
          {row.buyerCountry && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} />
              {row.buyerCountry}
            </span>
          )}
          {row.buyerEmail && (
            <span className="inline-flex items-center gap-1">
              <Mail size={11} />
              {row.buyerEmail}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock size={11} />
            {new Date(row.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          买家原文
        </h2>
        <pre className="whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/30 p-5 text-[13px] leading-relaxed text-foreground/90">
          {row.originalText}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          AI 草拟回复
        </h2>
        <InquiryDraftPanel
          inquiry={{
            originalText: row.originalText,
            originalSubject: row.originalSubject,
            buyerName: row.buyerName,
            buyerCompany: row.buyerCompany,
            buyerCountry: row.buyerCountry,
          }}
        />
      </section>
    </div>
  );
}
