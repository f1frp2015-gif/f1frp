/**
 * 映射层:把 AI 抽取出的结构化字段(doc-schema 的 CertData / TestReportData /
 * ProductData / LicenseData)→ 受控词表里的 canonical 标签实例。
 *
 * 裁决顺序(确定性优先,模型不裁决):
 *  1. 精确别名(cert-taxonomy.lookupAlias,归一化后等值)
 *  2. 子串兜底(归一化文本包含某条 ≥4 长度的别名)→ 标记 fuzzy=true 需复核
 *  3. CJK 关键词扫描(仅 region / industry / mat 等"出现即算"的弱信号 facet)
 *  4. 仍未命中且有意义 → unmapped[](进后台「待治理」队列)
 *
 * 信任分(trust)按来源给初值,人工审核通过后统一抬到 T3:
 *  - cert 文档:有 certNo → T2(可查验),否则 T1(有凭证)
 *  - test 文档(检测报告佐证):T1
 *  - product 自述资料:T0
 *  - license 地址派生 region:T2(执照较可信)
 *
 * 纯逻辑模块,无 DB / 无网络。供 process-doc.ts 调用。
 */
import type {
  CertData,
  DocKind,
  LicenseData,
  ProductData,
  TestReportData,
} from "@/lib/enterprise/doc-schema";

import {
  type Facet,
  type TrustLevel,
  TAGS,
  TAGS_BY_ID,
  lookupAlias,
  normalize,
} from "./cert-taxonomy";

export interface DerivedTag {
  tagId: string;
  facet: Facet;
  trust: TrustLevel;
  fuzzy: boolean; // 靠子串/弱信号命中 → 建议人工复核
  certNo?: string | null;
  validTo?: string | null; // YYYY-MM-DD
}

export interface DeriveResult {
  tags: DerivedTag[];
  unmapped: string[]; // 有意义但没映射上的原文 → 待治理
}

// 子串兜底索引:normalized alias(长度 ≥4)→ tagId。长别名优先,避免短串误命中。
const SUBSTR_INDEX: ReadonlyArray<{ norm: string; tagId: string }> = (() => {
  const out: Array<{ norm: string; tagId: string }> = [];
  for (const t of TAGS) {
    const slug = t.id.split(":")[1] ?? "";
    for (const a of [...t.aliases, slug]) {
      const n = normalize(a);
      if (n.length >= 4) out.push({ norm: n, tagId: t.id });
    }
  }
  return out.sort((x, y) => y.norm.length - x.norm.length);
})();

function bestMatch(raw: string): { tagId: string; fuzzy: boolean } | null {
  const exact = lookupAlias(raw);
  if (exact) return { tagId: exact, fuzzy: false };
  const n = normalize(raw);
  if (n.length < 4) return null;
  for (const e of SUBSTR_INDEX) {
    if (n.includes(e.norm)) return { tagId: e.tagId, fuzzy: true };
  }
  return null;
}

// CJK / 关键词扫描:文本里出现某 facet 的别名(长度 ≥2)即算命中。仅用于弱信号 facet。
function scanFacets(text: string, facets: Facet[]): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const t of TAGS) {
    if (!facets.includes(t.facet)) continue;
    if (t.aliases.some((a) => a.length >= 2 && lower.includes(a.toLowerCase()))) {
      hits.push(t.id);
    }
  }
  return hits;
}

// "2026-07-28" / "2026/7/28" / "2026年7月28日" → "2026-07-28";解析不出 → null
function normalizeDate(s?: string | null): string | null {
  if (!s) return null;
  const m = s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function deriveTagsFromExtraction(
  kind: DocKind,
  data: unknown,
): DeriveResult {
  const tags = new Map<string, DerivedTag>();
  const unmapped: string[] = [];

  const add = (
    tagId: string,
    trust: TrustLevel,
    fuzzy: boolean,
    extra?: { certNo?: string | null; validTo?: string | null },
  ) => {
    const def = TAGS_BY_ID.get(tagId);
    if (!def) return;
    const prev = tags.get(tagId);
    if (!prev || trust > prev.trust) {
      tags.set(tagId, {
        tagId,
        facet: def.facet,
        trust,
        fuzzy: prev ? prev.fuzzy && fuzzy : fuzzy,
        certNo: extra?.certNo ?? prev?.certNo ?? null,
        validTo: extra?.validTo ?? prev?.validTo ?? null,
      });
    }
  };

  const tryMap = (
    raw: string | undefined | null,
    trust: TrustLevel,
    extra?: { certNo?: string | null; validTo?: string | null },
  ) => {
    const s = raw?.trim();
    if (!s) return;
    const m = bestMatch(s);
    if (m) add(m.tagId, trust, m.fuzzy, extra);
    else unmapped.push(s);
  };

  if (kind === "cert") {
    const d = data as CertData;
    const certNo = d.certNo?.trim() || null;
    const validTo = normalizeDate(d.validUntil);
    const baseTrust: TrustLevel = certNo ? 2 : 1;
    tryMap(d.certType, baseTrust, { certNo, validTo });
    if (d.issuer) {
      const m = bestMatch(d.issuer);
      if (m) add(m.tagId, baseTrust, m.fuzzy, { certNo, validTo });
    }
    for (const id of scanFacets(d.scope ?? "", ["industry"])) add(id, 0, false);
  } else if (kind === "test") {
    const d = data as TestReportData;
    tryMap(d.standard, 1);
    for (const id of scanFacets(d.productName ?? "", ["cat"])) add(id, 1, false);
  } else if (kind === "product") {
    const d = data as ProductData;
    for (const p of d.products ?? []) {
      if (p.category) tryMap(p.category, 0);
      if (p.name) {
        const m = bestMatch(p.name);
        if (m) add(m.tagId, 0, m.fuzzy);
      }
      const blob = [p.name, p.category, (p.applications ?? []).join(" "), JSON.stringify(p.properties ?? {})].join(" ");
      for (const id of scanFacets(blob, ["mat", "process", "prop", "industry"]))
        add(id, 0, false);
    }
  } else if (kind === "license") {
    const d = data as LicenseData;
    for (const id of scanFacets(d.address ?? "", ["region"])) add(id, 2, false);
    for (const id of scanFacets(d.businessScope ?? "", ["cat", "process", "industry"]))
      add(id, 0, false);
  }

  return { tags: [...tags.values()], unmapped: [...new Set(unmapped)] };
}
