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
  next,
}: {
  step: number;
  art: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  /** Where Next goes. Absent on the last page. */
  next?: Href;
}) {
  const c = useMaterialColors();
  const last = !next;

  return (
    <Column modifiers={[fillMaxSize(), background(c.surface)]}>
      {/* skip */}
      <Row horizontalArrangement="end" modifiers={[fillMaxWidth(), height(56), padding(8, 0, 8, 0)]}>
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
        <Type variant="labelLarge" color={c.primary}>
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
                  background(current ? c.primary : c.outlineVariant),
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

/** A large tonal disc with a symbol in it — the default intro artwork. */
export function ArtDisc({
  icon,
  tone = 'primary',
  children,
}: {
  icon: string;
  tone?: 'primary' | 'secondary' | 'tertiary';
  children?: ReactNode;
}) {
  const c = useMaterialColors();
  const [outer, inner, fg] =
    tone === 'secondary'
      ? [c.secondaryContainer, c.secondary, c.onSecondary]
      : tone === 'tertiary'
        ? [c.tertiaryContainer, c.tertiary, c.onTertiary]
        : [c.primaryContainer, c.primary, c.onPrimary];
  return (
    <Box contentAlignment="center" modifiers={[size(260, 260)]}>
      <Box modifiers={[size(260, 260), clip(Shapes.Circle), background(outer)]} />
      <Box contentAlignment="center" modifiers={[size(136, 136), clip(Shapes.Circle), background(inner)]}>
        <Glyph name={icon} color={fg} size={72} />
      </Box>
      {children}
    </Box>
  );
}

/** A small circular badge placed around an ArtDisc, offset from its centre. */
export function Orbit({ icon, x, y, tone }: { icon: string; x: number; y: number; tone: 'secondary' | 'tertiary' | 'surface' }) {
  const c = useMaterialColors();
  const [bg, fg] =
    tone === 'secondary'
      ? [c.secondary, c.onSecondary]
      : tone === 'tertiary'
        ? [c.tertiary, c.onTertiary]
        : [c.surfaceContainerHighest, c.onSurface];
  return (
    <Box
      contentAlignment="center"
      modifiers={[offset(x, y), size(56, 56), clip(Shapes.Circle), background(bg)]}
    >
      <Glyph name={icon} color={fg} size={28} />
    </Box>
  );
}
