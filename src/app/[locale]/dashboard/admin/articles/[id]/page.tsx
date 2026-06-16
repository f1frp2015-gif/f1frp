import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { gateAdmin } from "@/lib/admin";
import { EditDraftClient } from "./edit-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "审阅资讯草稿" };

export default async function AdminArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const gate = await gateAdmin();
  if (!gate.ok) {
    if (gate.status === 401)
      redirect(`/sign-in?redirect_url=/dashboard/admin/articles/${id}`);
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg font-semibold">无管理员权限</div>
        </CardContent>
      </Card>
    );
  }

  const [a] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (!a) notFound();

  return (
    <EditDraftClient
      article={{
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt ?? "",
        body: a.body ?? "",
        category: a.category ?? "industry",
        readTime: a.readTime ?? "",
        forZh: a.forZh,
        forEn: a.forEn,
        hot: a.hot ?? false,
        isPublished: a.publishedAt != null,
        publishedAt: a.publishedAt ? a.publishedAt.toISOString().slice(0, 16).replace("T", " ") : null,
      }}
    />
  );
}
