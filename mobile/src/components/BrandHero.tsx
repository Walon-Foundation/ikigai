import { Box, Column, Row } from '@expo/ui/jetpack-compose';
import { background, clip, fillMaxWidth, padding, Shapes, weight } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactNode } from 'react';
import { BRAND } from '@/theme/brand';
import { BrandMark } from './BrandMark';
import { Type } from './Type';

/** White at partial opacity, for secondary text and fills on the green hero. */
export const ON_BRAND_MUTED = '#FFFFFFD9';
export const ON_BRAND_FAINT = '#FFFFFF26';

/**
 * The green header card at the top of each tab: the Ikigai mark, a small label,
 * a title, and room for a search field, progress or stats underneath.
 *
 * Inset from the screen edges and rounded rather than full-bleed, so it never
 * sits behind the status bar and the light status bar icons stay readable.
 */
export function BrandHero({
  eyebrow,
  title,
  subtitle,
  trailing,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box modifiers={[padding(12, 8, 12, 8)]}>
      <Column
        verticalArrangement={{ spacedBy: 14 }}
        modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(28)), background(BRAND.green), padding(20, 16, 20, 20)]}
      >
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
          <BrandMark size={30} coin />
          <Type variant="labelLarge" color={ON_BRAND_MUTED}>
            {eyebrow}
          </Type>
          <Box modifiers={[weight(1)]} />
          {trailing}
        </Row>
        <Column verticalArrangement={{ spacedBy: 2 }}>
          <Type variant="headlineSmall" color={BRAND.onBrand}>
            {title}
          </Type>
          {subtitle ? (
            <Type variant="bodyMedium" color={ON_BRAND_MUTED}>
              {subtitle}
            </Type>
          ) : null}
        </Column>
        {children}
      </Column>
    </Box>
  );
}

/** A number and its label, for the stats row inside a BrandHero. */
export function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <Column modifiers={[weight(1)]}>
      <Type variant="titleLarge" color={BRAND.onBrand}>
        {value}
      </Type>
      <Type variant="labelMedium" color={ON_BRAND_MUTED}>
        {label}
      </Type>
    </Column>
  );
}
