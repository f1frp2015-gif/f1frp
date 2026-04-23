// Runtime fuzzy matcher linking formula ingredient names → material records.
// No schema changes: works entirely from existing name/brand/model fields.
//
// Strategy (in priority order):
//   1. exact normalized match on ingredient.name vs any of {name, nameEn, brand+model}
//   2. contains match (ingredient name contained in material index key, or vice versa)
// Returns the strongest match per ingredient, or null.

export type MaterialLite = {
  id: string;
  name: string;
  nameEn?: string | null;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
};

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[#＃()（）\[\]【】\s\-_/\\,，.。、]+/g, "");
}

export type MaterialIndex = {
  byExact: Map<string, MaterialLite>;
  byTokens: Array<{ key: string; material: MaterialLite }>;
};

export function buildMaterialIndex(materials: MaterialLite[]): MaterialIndex {
  const byExact = new Map<string, MaterialLite>();
  const byTokens: Array<{ key: string; material: MaterialLite }> = [];
  for (const m of materials) {
    const keys = new Set<string>();
    const addKey = (raw: string | null | undefined) => {
      const n = normalize(raw);
      if (n && n.length >= 2) keys.add(n);
    };
    addKey(m.name);
    addKey(m.nameEn);
    if (m.brand && m.model) {
      addKey(`${m.brand}${m.model}`);
      addKey(`${m.brand} ${m.model}`);
    }
    addKey(m.model);
    for (const k of keys) {
      if (!byExact.has(k)) byExact.set(k, m);
      byTokens.push({ key: k, material: m });
    }
  }
  return { byExact, byTokens };
}

export function matchIngredient(
  name: string,
  index: MaterialIndex
): MaterialLite | null {
  const q = normalize(name);
  if (!q || q.length < 2) return null;
  const direct = index.byExact.get(q);
  if (direct) return direct;
  // Prefer longest matching key for contains-both-ways check.
  let best: { m: MaterialLite; score: number } | null = null;
  for (const { key, material } of index.byTokens) {
    if (key.length < 2) continue;
    if (q.includes(key) || key.includes(q)) {
      const score = Math.min(q.length, key.length);
      if (!best || score > best.score) best = { m: material, score };
    }
  }
  return best?.m ?? null;
}

export function matchAll(
  names: string[],
  index: MaterialIndex
): Record<string, string> {
  // Map ingredient name → material id (skip unmapped entries).
  const out: Record<string, string> = {};
  for (const name of names) {
    if (out[name]) continue;
    const m = matchIngredient(name, index);
    if (m) out[name] = m.id;
  }
  return out;
}
