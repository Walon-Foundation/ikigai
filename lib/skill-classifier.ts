// Classifies a mentee's free-text interest tag into a skill category by
// matching it against each category's aliases. Pure — no database — so
// lib/skill-tracks.ts can call it without an extra round trip per tag.

export type SkillCategoryLite = {
  id: string;
  aliases: string[] | null;
  isFallback: boolean;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function classifySkillTag(
  tag: string,
  categories: SkillCategoryLite[],
): string | null {
  const needle = normalize(tag);
  if (!needle) return null;

  for (const category of categories) {
    for (const alias of category.aliases ?? []) {
      if (normalize(alias) === needle) return category.id;
    }
  }

  // No exact alias match: fall back to substring containment either
  // direction, so "python developer" still matches an alias of "python" and
  // "content" matches an alias of "content creation".
  for (const category of categories) {
    for (const alias of category.aliases ?? []) {
      const a = normalize(alias);
      if (a.length >= 3 && (needle.includes(a) || a.includes(needle))) {
        return category.id;
      }
    }
  }

  return categories.find((c) => c.isFallback)?.id ?? null;
}
