import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { and, eq, gte, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { db } from "@/lib/db";
import {
  supplierDocumentTags,
  supplierDocuments,
  supplierListings,
} from "@/lib/db/schema";

import {
  CertifiedDirectoryClient,
  type DirectorySupplier,
} from "./certified-directory-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CertifiedDirectory" });
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
    alternates: alternates("/suppliers/certified"),
  };
}

export const dynamic = "force-dynamic";

export default async function CertifiedDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  // 公开「认证供应商」目录只展示真正过了人工审核的标签:
  //   ① INNER JOIN supplier_documents 且 status='approved' —— 这是关键安全闸门。
  //      AI 抽取在上传时就会给 cert(含证号)/license 派生标签写 trust=2,若仅按
  //      trust>=2 取数,未经审核(甚至他人伪造挂到本供应商)的标签会立即公开。必须
  //      要求其来源文档已被管理员 approve。
  //   ② trust>=2 仍保留(approve 时该文档所有标签会被抬到 T3)。
  //   ③ 过滤掉已过期的标签(validTo 早于今天),避免过期证书仍占目录与分面计数。
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD(force-dynamic,请求期计算)
  const tagRows = await db
    .select({
      supplierListingId: supplierDocumentTags.supplierListingId,
      tagId: supplierDocumentTags.tagId,
      facet: supplierDocumentTags.facet,
      trust: supplierDocumentTags.trust,
      validTo: supplierDocumentTags.validTo,
      certNo: supplierDocumentTags.certNo,
    })
    .from(supplierDocumentTags)
    .innerJoin(
      supplierDocuments,
      eq(supplierDocumentTags.documentId, supplierDocuments.id),
    )
    .where(
      and(
        eq(supplierDocuments.status, "approved"),
        gte(supplierDocumentTags.trust, 2),
        isNotNull(supplierDocumentTags.supplierListingId),
        or(
          isNull(supplierDocumentTags.validTo),
          gte(supplierDocumentTags.validTo, today),
        ),
      ),
    );

  const tagsBySupplier = new Map<string, DirectorySupplier["tags"]>();
  for (const r of tagRows) {
    if (!r.supplierListingId) continue;
    const arr = tagsBySupplier.get(r.supplierListingId) ?? [];
    // 同一 tag 取最高 trust
    const existing = arr.find((x) => x.tagId === r.tagId);
    if (existing) {
      if (r.trust > existing.trust) existing.trust = r.trust;
    } else {
      arr.push({
        tagId: r.tagId,
        facet: r.facet,
        trust: r.trust,
        validTo: r.validTo,
        certNo: r.certNo,
      });
    }
    tagsBySupplier.set(r.supplierListingId, arr);
  }

  const ids = [...tagsBySupplier.keys()];
  const supRows = ids.length
    ? await db.select().from(supplierListings).where(inArray(supplierListings.id, ids))
    : [];

  const suppliers: DirectorySupplier[] = supRows
    .map((s) => ({
      id: s.id,
      name: (isEn ? s.nameEn : s.name) ?? s.name,
      location: (isEn ? s.locationEn : s.location) ?? "",
      verified: Boolean(s.verified),
      website: s.website ?? null,
      tags: tagsBySupplier.get(s.id) ?? [],
    }))
    .sort((a, b) => b.tags.length - a.tags.length);

  return (
    <CertifiedDirectoryClient
      suppliers={suppliers}
      locale={isEn ? "en" : "zh"}
    />
  );
}
