import { isDynamicColorAvailable } from '@expo/ui/jetpack-compose';

/**
 * Ikigai's brand green. Used as the Material 3 seed ONLY where Material You is
 * unavailable.
 */
export const BRAND_SEED = '#1A5C3A';

/**
 * The seed passed to every <Host>.
 *
 * On Android 12+ this is `undefined`, so the palette comes from the user's
 * wallpaper (Material You) — the chosen design. On older Android, Compose's own
 * fallback is Google's baseline purple, and a large share of budget phones in
 * Sierra Leone run Android 10 or 11; those users would see an app that looks
 * like nobody's. Seeding from brand green there means every phone gets either
 * the user's own colours or Ikigai's, never generic purple.
 */
export const hostSeedColor: string | undefined = isDynamicColorAvailable
  ? undefined
  : BRAND_SEED;
