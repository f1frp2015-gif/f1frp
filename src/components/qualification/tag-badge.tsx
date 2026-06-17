// Declare 式资质标签原子件:一个 canonical tag → 带 facet 配色 + 信任环 + 有效期
// + 可查验链接的徽章。受控词表见 lib/qualification/cert-taxonomy。
// 纯渲染组件(无 hook),server / client 树皆可用。
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FACET_META, TAGS_BY_ID, verifyUrlFor } from "@/lib/qualification/cert-taxonomy";

// 信任环:T0 自述 / T1 有凭证 / T2 可查验 / T3 已审核
const TRUST_DOT = ["○", "◔", "◑", "●"];

export function TagBadge({
  tagId,
  trust = 0,
  locale,
  validTo,
  certNo,
}: {
  tagId: string;
  trust?: number;
  locale: "zh" | "en";
  validTo?: string | null;
  certNo?: string | null;
}) {
  const def = TAGS_BY_ID.get(tagId);
  if (!def) return null;
  const expired = validTo ? new Date(validTo) < new Date() : false;
  const verifyUrl = verifyUrlFor(tagId, certNo);
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal",
        FACET_META[def.facet].tone,
        expired && "line-through opacity-50",
      )}
    >
      <span title={`trust ${trust}`} aria-hidden>
        {TRUST_DOT[trust] ?? "○"}
      </span>
      {def.label[locale]}
      {verifyUrl && trust >= 2 && (
        <a
          href={verifyUrl}
          target="_blank"
          rel="noopener"
          className="underline underline-offset-2"
          title={locale === "en" ? "Verify" : "查验"}
        >
          ↗
        </a>
      )}
    </Badge>
  );
}
