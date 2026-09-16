import { getMaterialColors, type MaterialColors } from '@expo/ui/jetpack-compose';
import { useMemo } from 'react';
import { Platform } from 'react-native';

/** Ikigai's brand green: the Material 3 seed for the whole app. */
export const BRAND_SEED = '#1A5C3A';

/**
 * The seed passed to every <Host>: always Ikigai green.
 *
 * Material You (wallpaper colors) was tried first and made the app look like
 * whatever the phone's wallpaper happened to be — blue on one phone, purple on
 * the next, and never like Ikigai. A fixed brand seed gives every phone the
 * same, recognisable palette.
 */
export const hostSeedColor: string = BRAND_SEED;

/** Light only, for now. The dark palette did not suit the brand colors. */
export const APP_SCHEME = 'light' as const;

/**
 * The Material palette for React Native views that sit OUTSIDE a Compose Host —
 * navigators, tab bars, the strip behind the status bar — so they paint in the
 * same colors as the Compose screens inside them. Android only; on other
 * platforms there is no Material palette and callers fall back to defaults.
 */
export function useAppPalette(): MaterialColors | undefined {
  return useMemo(
    () => (Platform.OS === 'android' ? getMaterialColors({ scheme: APP_SCHEME, seedColor: hostSeedColor }) : undefined),
    [],
  );
}
