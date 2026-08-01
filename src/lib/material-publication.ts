export type EnglishMaterialPublicationInput = {
  id: string;
  status?: string | null;
  category?: string | null;
  nameEn?: string | null;
  brandEn?: string | null;
  modelEn?: string | null;
  descriptionEn?: string | null;
  propertiesEn?: unknown;
  applicationsEn?: unknown;
};

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function propertyCount(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value).filter(
    (item) => typeof item === "string" && item.trim().length > 0,
  ).length;
}

function applicationCount(value: unknown): number {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).length
    : 0;
}

export function englishMaterialQualityScore(
  material: EnglishMaterialPublicationInput,
): number {
  const descriptionLength = normalized(material.descriptionEn).length;
  return (
    Math.min(descriptionLength, 500) +
    propertyCount(material.propertiesEn) * 60 +
    applicationCount(material.applicationsEn) * 40 +
    (normalized(material.brandEn) ? 20 : 0) +
    (normalized(material.modelEn) ? 30 : 0)
  );
}

export function isIndexableEnglishMaterial(
  material: EnglishMaterialPublicationInput,
): boolean {
  if (material.status && material.status !== "verified") return false;
  if (!/^[\x00-\x7F]+$/.test(material.id)) return false;
  if (!normalized(material.nameEn)) return false;
  return (
    normalized(material.descriptionEn).length >= 80 ||
    propertyCount(material.propertiesEn) >= 3 ||
    applicationCount(material.applicationsEn) >= 2
  );
}

function identityKey(material: EnglishMaterialPublicationInput): string {
  const category = normalized(material.category);
  const brand = normalized(material.brandEn);
  const model = normalized(material.modelEn);
  const name = normalized(material.nameEn);
  return model
    ? `${category}|${brand}|${model}`
    : `${category}|${brand}|${name}`;
}

export function dedupeEnglishMaterials<
  T extends EnglishMaterialPublicationInput,
>(materials: T[]): T[] {
  const best = new Map<string, { item: T; index: number; score: number }>();
  materials.forEach((item, index) => {
    const key = identityKey(item);
    const score = englishMaterialQualityScore(item);
    const current = best.get(key);
    if (!current || score > current.score) {
      best.set(key, { item, index: current?.index ?? index, score });
    }
  });
  return [...best.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ item }) => item);
}
