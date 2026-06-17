"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FacetGroup, type FacetOption } from "@/components/qualification/facet-group";
import { QualificationLabel } from "@/components/qualification/qualification-label";
import { useProgressiveList } from "@/lib/hooks/use-progressive-list";
import {
  type Facet,
  FACETS,
  FACET_META,
  TAGS_BY_ID,
} from "@/lib/qualification/cert-taxonomy";

export interface DirectorySupplier {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  website: string | null;
  tags: {
    tagId: string;
    facet: string;
    trust: number;
    validTo: string | null;
    certNo: string | null;
  }[];
}

export function CertifiedDirectoryClient({
  suppliers,
  locale,
}: {
  suppliers: DirectorySupplier[];
  locale: "zh" | "en";
}) {
  const t = useTranslations("CertifiedDirectory");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(tagId: string) {
    setSelected((s) =>
      s.includes(tagId) ? s.filter((x) => x !== tagId) : [...s, tagId],
    );
  }

  // 分面选项 + 计数(count = 含该 tag 的供应商数)
  const facetGroups = useMemo(() => {
    const map = new Map<Facet, Map<string, number>>();
    for (const s of suppliers) {
      const seen = new Set<string>();
      for (const tg of s.tags) {
        if (seen.has(tg.tagId)) continue;
        seen.add(tg.tagId);
        const f = tg.facet as Facet;
        if (!FACET_META[f]) continue;
        const inner = map.get(f) ?? new Map<string, number>();
        inner.set(tg.tagId, (inner.get(tg.tagId) ?? 0) + 1);
        map.set(f, inner);
      }
    }
    const out: { facet: Facet; options: FacetOption[] }[] = [];
    for (const f of FACETS) {
      const inner = map.get(f);
      if (!inner) continue;
      const options = [...inner.entries()]
        .map(([tagId, count]) => ({
          tagId,
          count,
          label: TAGS_BY_ID.get(tagId)?.label[locale] ?? tagId,
        }))
        .sort((a, b) => b.count - a.count);
      out.push({ facet: f, options });
    }
    return out;
  }, [suppliers, locale]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selByFacet = new Map<string, string[]>();
    for (const tagId of selected) {
      const f = TAGS_BY_ID.get(tagId)?.facet;
      if (!f) continue;
      const arr = selByFacet.get(f) ?? [];
      arr.push(tagId);
      selByFacet.set(f, arr);
    }
    return suppliers.filter((s) => {
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.location.toLowerCase().includes(q)
      )
        return false;
      const supTags = new Set(s.tags.map((tg) => tg.tagId));
      // facet 内 OR,facet 间 AND
      for (const [, tagIds] of selByFacet) {
        if (!tagIds.some((id) => supTags.has(id))) return false;
      }
      return true;
    });
  }, [suppliers, search, selected]);

  const { visible, remaining, expand } = useProgressiveList(filtered, 24);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("h1")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* 左:分面筛选栏 */}
        <aside className="space-y-5">
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-xs text-primary hover:underline"
            >
              {t("clearFilters")} ({selected.length})
            </button>
          )}
          {facetGroups.map((g) => (
            <FacetGroup
              key={g.facet}
              facet={g.facet}
              locale={locale}
              options={g.options}
              selected={selected}
              onToggle={toggle}
            />
          ))}
        </aside>

        {/* 右:结果 */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t("resultCount", { count: filtered.length })}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t("noResults")}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {visible.map((s) => (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{s.name}</CardTitle>
                        {s.verified && (
                          <Badge variant="default" className="shrink-0">
                            {t("verified")}
                          </Badge>
                        )}
                      </div>
                      {s.location && (
                        <div className="text-xs text-muted-foreground">{s.location}</div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <QualificationLabel tags={s.tags} locale={locale} />
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-primary hover:underline"
                        >
                          {s.website} ↗
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {remaining > 0 && (
                <div className="text-center">
                  <Button variant="outline" onClick={expand}>
                    {t("showMore", { count: Math.min(remaining, 24) })}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
