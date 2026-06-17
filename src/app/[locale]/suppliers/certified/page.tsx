import type { Metadata } from "next";
import { and, gte, inArray, isNotNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { db } from "@/lib/db";
import { supplierDocumentTags, supplierListings } from "@/lib/db/schema";

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
  return { title: t("metaTitle"), description: t("subtitle") };
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

  // 只取「可查验 / 已审核」(T2+)且已关联供应商的标签实例
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
    .where(
      and(
        gte(supplierDocumentTags.trust, 2),
        isNotNull(supplierDocumentTags.supplierListingId),
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
