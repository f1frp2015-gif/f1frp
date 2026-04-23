// Human-readable slug generator for paper / patent / etc.
// Keeps CJK characters (safe in URLs, Next decodes), hyphenates ASCII,
// falls back to a short hash when input is empty.

import { createHash } from "node:crypto";

const MAX = 120;

function shortHash(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 8);
}

export function makeSlug(
  input: string,
  fallbackSeed?: string
): string {
  let s = (input || "").toLowerCase();
  // Keep letters, digits, CJK; everything else becomes hyphen.
  s = s.replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
  // Collapse duplicate hyphens.
  s = s.replace(/-+/g, "-");
  if (!s) s = shortHash(fallbackSeed ?? input ?? Math.random().toString());
  if (s.length > MAX) s = s.slice(0, MAX).replace(/-+$/, "");
  return s;
}

export function paperSlug(title: string, id: string): string {
  return `${makeSlug(title, id)}-${shortHash(id).slice(0, 6)}`;
}

export function patentSlug(title: string, id: string): string {
  return `${makeSlug(title, id)}-${shortHash(id).slice(0, 6)}`;
}
