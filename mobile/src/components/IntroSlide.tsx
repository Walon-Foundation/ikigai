import { Box, Button, Column, Row, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  offset,
  padding,
  Shapes,
  size,
  weight,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { type Accent, BRAND } from '@/theme/brand';
import { BrandMark } from './BrandMark';
import { Glyph } from './Glyph';
import { Type } from './Type';

export const INTRO_STEPS = 4;

/**
 * One page of the first-run intro: artwork, headline, a line of copy, page
 * dots, and Skip / Next. The last page swaps Next for the sign-up actions.
 */
export function IntroSlide({
  step,
  art,
  eyebrow,
  title,
  body,
  accent,
  next,
}: {
  step: number;
  art: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  /** The page's brand color: eyebrow, active dot. */
  accent: Accent;
  /** Where Next goes. Absent on the last page. */
  next?: Href;
}) {
  const c = useMaterialColors();
  const last = !next;

  return (
    <Column modifiers={[fillMaxSize(), background(c.surface)]}>
      {/* brand + skip */}
      <Row
        verticalAlignment="center"
        horizontalArrangement={{ spacedBy: 8 }}
        modifiers={[fillMaxWidth(), height(56), padding(20, 0, 8, 0)]}
      >
        <BrandMark size={28} />
        <Type variant="titleMedium" color={BRAND.green}>
          Ikigai
        </Type>
        <Box modifiers={[weight(1)]} />
        {last ? null : (
          <TextButton onClick={() => router.replace('/sign-in')}>
            <Text>Skip</Text>
          </TextButton>
        )}
      </Row>

      {/* art */}
      <Box contentAlignment="center" modifiers={[fillMaxWidth(), weight(1)]}>
        {art}
      </Box>

      {/* copy */}
      <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[fillMaxWidth(), padding(24, 0, 24, 24)]}>
        <Type variant="labelLarge" color={accent.strong}>
          {eyebrow}
        </Type>
        <Type variant="headlineLarge" color={c.onSurface}>
          {title}
        </Type>
        <Type variant="bodyLarge" color={c.onSurfaceVariant}>
          {body}
        </Type>
      </Column>

      {/* dots + actions */}
      <Column verticalArrangement={{ spacedBy: 16 }} modifiers={[fillMaxWidth(), padding(24, 8, 24, 24)]}>
        <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
          {Array.from({ length: INTRO_STEPS }, (_, i) => {
            const current = i + 1 === step;
            return (
              <Box
                key={i}
                modifiers={[
                  size(current ? 24 : 8, 8),
                  clip(Shapes.RoundedCorner(4)),
                  background(current ? accent.strong : c.outlineVariant),
                ]}
              />
            );
          })}
        </Row>
        {last ? (
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
            <Button onClick={() => router.replace('/sign-up')} modifiers={[fillMaxWidth(), height(56)]}>
              <Text>Get started</Text>
            </Button>
            <TextButton onClick={() => router.replace('/sign-in')} modifiers={[fillMaxWidth()]}>
              <Text>I already have an account</Text>
            </TextButton>
          </Column>
        ) : (
          <Row modifiers={[fillMaxWidth()]}>
            <Box modifiers={[weight(1)]} />
            <Button onClick={() => router.push(next)} modifiers={[height(56), width(128)]}>
              <Text>Next</Text>
            </Button>
          </Row>
        )}
      </Column>
    </Column>
  );
}

/**
 * Intro artwork: a soft disc in the page's accent with either the Ikigai mark
 * or a symbol at its centre, and small badges orbiting it.
 */
export function ArtDisc({
  accent,
  icon,
  children,
}: {
  accent: Accent;
  /** A Material Symbol; omit to show the Ikigai mark. */
  icon?: string;
  children?: ReactNode;
}) {
  return (
    <Box contentAlignment="center" modifiers={[size(280, 280)]}>
      <Box modifiers={[size(280, 280), clip(Shapes.Circle), background(accent.soft)]} />
      {icon ? (
        <Box contentAlignment="center" modifiers={[size(140, 140), clip(Shapes.Circle), background(accent.strong)]}>
          <Glyph name={icon} color={BRAND.onBrand} size={72} />
        </Box>
      ) : (
        <BrandMark size={176} coin />
      )}
      {children}
    </Box>
  );
}

/** A small badge orbiting an ArtDisc, offset from its centre, in a brand color. */
export function Orbit({ icon, x, y, color }: { icon: string; x: number; y: number; color: string }) {
  return (
    <Box
      contentAlignment="center"
      modifiers={[offset(x, y), size(60, 60), clip(Shapes.Circle), background(color)]}
    >
      <Glyph name={icon} color={color === BRAND.sun ? BRAND.greenDeep : BRAND.onBrand} size={30} />
    </Box>
  );
}
