// getfrp.com (EN-side) SEO/GEO evaluator.
//
// Inspects messages/en.json metaTitle / metaDescription strings + a hardcoded
// landing-page keyword map. Reports length violations (Title 30-60,
// Description 120-160 per current Google guidance) and missing S/A-tier
// keywords on the pages that ought to carry them. Exits non-zero on any
// violation when run with --strict (intended for future CI gate; not wired
// into `next build` yet per W1 plan in
// 2026-05-18-getfrp定位与SEO-GEO-AI-native规划.md).
//
// Usage:
//   pnpm tsx scripts/seo-check.ts           # warn-only, exit 0
//   pnpm tsx scripts/seo-check.ts --strict  # exit 1 on violations

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Severity = "error" | "warn";

interface Violation {
  page: string;
  field: string;
  severity: Severity;
  message: string;
  actual?: string;
}

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 165;

// S-tier keywords are required on these EN landing pages. A page passes if
// at least one S-tier keyword appears in Title OR Description (case-insensitive).
const S_TIER_PAGES: Record<string, string[]> = {
  Site: ["frp from china", "frp supplier", "frp sourcing"],
  Suppliers: ["china frp supplier", "chinese frp", "frp supplier"],
  Pultrusion: ["china pultrusion", "pultruded frp", "pultrusion supplier"],
  HpRtm: ["hp-rtm", "china cfrp", "automotive cfrp"],
};

// Namespaces backing routes that are robots-disallowed (auth-gated, internal).
// Length budgets don't apply — Google never sees these.
const NOINDEX_NAMESPACES = new Set<string>(["Dashboard"]);

// Brand tokens — at least one expected somewhere in the meta for entity grounding.
const BRAND_TOKENS = ["getfrp", "f1 composite"];

function lc(s: string): string {
  return s.toLowerCase();
}

function checkLength(
  page: string,
  field: "metaTitle" | "metaDescription" | "tagline" | "description",
  value: string,
  min: number,
  max: number,
): Violation[] {
  const out: Violation[] = [];
  const len = value.length;
  if (len < min) {
    out.push({
      page,
      field,
      severity: "warn",
      message: `length ${len} < min ${min}`,
      actual: value,
    });
  } else if (len > max) {
    out.push({
      page,
      field,
      severity: "error",
      message: `length ${len} > max ${max}`,
      actual: value,
    });
  }
  return out;
}

function checkKeyword(
  page: string,
  haystack: string,
  needles: string[],
): Violation | null {
  const h = lc(haystack);
  const found = needles.some((n) => h.includes(lc(n)));
  if (found) return null;
  return {
    page,
    field: "keyword",
    severity: "error",
    message: `none of [${needles.join(" | ")}] present in meta`,
  };
}

function main() {
  const strict = process.argv.includes("--strict");
  const en = JSON.parse(
    readFileSync(resolve("messages/en.json"), "utf8"),
  ) as Record<string, Record<string, string>>;

  const violations: Violation[] = [];

  // Site-level: tagline + description (drive the layout default home Title/Desc).
  if (en.Site) {
    const t = en.Site.tagline ?? "";
    const d = en.Site.description ?? "";
    // Layout composes home title as `${name} — ${tagline}` — account for the
    // brand prefix length when validating the tagline budget.
    const composedTitle = `${en.Site.name ?? "getfrp"} — ${t}`;
    violations.push(
      ...checkLength("Site", "tagline", composedTitle, TITLE_MIN, TITLE_MAX),
    );
    violations.push(
      ...checkLength("Site", "description", d, DESC_MIN, DESC_MAX),
    );
    const sTier = S_TIER_PAGES.Site;
    const kw = checkKeyword("Site", `${t} ${d}`, sTier);
    if (kw) violations.push(kw);
    const brandHit = BRAND_TOKENS.some((b) =>
      lc(`${en.Site.name ?? ""} ${t} ${d}`).includes(b),
    );
    if (!brandHit) {
      violations.push({
        page: "Site",
        field: "brand",
        severity: "warn",
        message: `no brand token in Site meta`,
      });
    }
  }

  // Page-level metaTitle / metaDescription, scanning every namespace.
  for (const [ns, body] of Object.entries(en)) {
    if (ns === "Site") continue;
    if (NOINDEX_NAMESPACES.has(ns)) continue;
    if (typeof body !== "object" || body === null) continue;
    const mt = (body as Record<string, unknown>).metaTitle;
    const md = (body as Record<string, unknown>).metaDescription;
    if (typeof mt === "string") {
      violations.push(...checkLength(ns, "metaTitle", mt, TITLE_MIN, TITLE_MAX));
    }
    if (typeof md === "string") {
      violations.push(
        ...checkLength(ns, "metaDescription", md, DESC_MIN, DESC_MAX),
      );
    }
    const need = S_TIER_PAGES[ns];
    if (need && (typeof mt === "string" || typeof md === "string")) {
      const kw = checkKeyword(
        ns,
        `${typeof mt === "string" ? mt : ""} ${typeof md === "string" ? md : ""}`,
        need,
      );
      if (kw) violations.push(kw);
    }
  }

  const errors = violations.filter((v) => v.severity === "error");
  const warns = violations.filter((v) => v.severity === "warn");

  for (const v of violations) {
    const tag = v.severity === "error" ? "✗" : "⚠";
    const head = `${tag} ${v.page}.${v.field}: ${v.message}`;
    if (v.actual) {
      console.log(`${head}\n    → ${v.actual.slice(0, 120)}${v.actual.length > 120 ? "…" : ""}`);
    } else {
      console.log(head);
    }
  }

  console.log(
    `\nSEO check: ${errors.length} error(s), ${warns.length} warning(s).`,
  );

  if (strict && errors.length > 0) {
    process.exit(1);
  }
}

main();
