// Declare 式「资质标签卡」:把一组 tag 按 facet 分组渲染(认证/标准/品类/材料…)。
// 复用在供应商卡片、供应商详情页、后台审核页。纯渲染组件。
import {
  type Facet,
  FACETS,
  FACET_META,
} from "@/lib/qualification/cert-taxonomy";

import { TagBadge } from "./tag-badge";

export interface LabelTag {
  tagId: string;
  facet: string;
  trust?: number;
  validTo?: string | null;
  certNo?: string | null;
}

export function QualificationLabel({
  tags,
  locale,
}: {
  tags: LabelTag[];
  locale: "zh" | "en";
}) {
  if (!tags.length) return null;

  const byFacet = new Map<Facet, LabelTag[]>();
  for (const t of tags) {
    const f = t.facet as Facet;
    if (!FACET_META[f]) continue;
    const arr = byFacet.get(f) ?? [];
    arr.push(t);
    byFacet.set(f, arr);
  }

  return (
    <div className="space-y-1.5">
      {FACETS.filter((f) => byFacet.has(f)).map((f) => (
        <div key={f} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {FACET_META[f].label[locale]}
          </span>
          {byFacet.get(f)!.map((t) => (
            <TagBadge
              key={t.tagId}
              tagId={t.tagId}
              trust={t.trust ?? 0}
              locale={locale}
              validTo={t.validTo}
              certNo={t.certNo}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
