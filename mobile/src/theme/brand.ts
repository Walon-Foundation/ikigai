/**
 * Ikigai's brand colors, sampled from the logo (client/docs/brand).
 *
 * The Material palette (theme/colors.ts) is generated from BRAND.green and
 * drives every standard component. These are the accents on top of it — the
 * logo's orange, teal and sun — used where the app should look like Ikigai
 * rather than like any Material app: headers, avatars, journey stages.
 */
export const BRAND = {
  green: '#1A5C3A',
  greenDeep: '#123F28',
  leaf: '#469E4C',
  leafSoft: '#E3F1E1',
  teal: '#156F81',
  tealSoft: '#DDEFF1',
  orange: '#E66D21',
  orangeSoft: '#FCE8D8',
  sun: '#FAC613',
  sunSoft: '#FEF4CC',
  onBrand: '#FFFFFF',
} as const;

/** A strong color and its soft tint, for chips, cards and avatars. */
export type Accent = { strong: string; soft: string };

export const ACCENTS: Accent[] = [
  { strong: BRAND.orange, soft: BRAND.orangeSoft },
  { strong: BRAND.teal, soft: BRAND.tealSoft },
  { strong: BRAND.leaf, soft: BRAND.leafSoft },
];

/** A stable accent for a name, so a person keeps their color everywhere. */
export function accentFor(key: string): Accent {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

/** One color per journey stage, following the logo from sunrise to canopy. */
export const STAGE_ACCENT: Record<'discover' | 'thrive' | 'build' | 'lead', Accent> = {
  discover: { strong: BRAND.orange, soft: BRAND.orangeSoft },
  thrive: { strong: BRAND.leaf, soft: BRAND.leafSoft },
  build: { strong: BRAND.teal, soft: BRAND.tealSoft },
  lead: { strong: BRAND.green, soft: BRAND.sunSoft },
};
