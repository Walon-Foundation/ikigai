import {
  Box,
  Card,
  Column,
  FilterChip,
  FlowRow,
  IconButton,
  LazyColumn,
  LinearProgressIndicator,
  ListItem,
  OutlinedTextField,
  Row,
  Text,
  type TextFieldRef,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { type ReactNode, useCallback, useRef } from 'react';
import { Glyph } from './Glyph';
import { Type } from './Type';

/**
 * The building blocks every non-thread screen shares, so a screen file is
 * mostly its content: a back app bar, a scrolling body, an optional pinned
 * bottom bar, and the handful of Material pieces that repeat across them.
 */

/** Material 3 small top app bar: back, title, optional subtitle and action. */
export function AppBar({
  title,
  subtitle,
  action,
  back = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
}) {
  const c = useMaterialColors();
  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: 4 }}
      modifiers={[fillMaxWidth(), height(64), background(c.surface), padding(4, 0, 4, 0)]}
    >
      {back ? (
        <IconButton onClick={() => router.back()}>
          <Glyph name="arrow_back" color={c.onSurface} />
        </IconButton>
      ) : (
        <Box modifiers={[padding(12, 0, 0, 0)]} />
      )}
      <Column modifiers={[weight(1), padding(4, 0, 0, 0)]}>
        <Type variant="titleLarge" color={c.onSurface} maxLines={1}>
          {title}
        </Type>
        {subtitle ? (
          <Type variant="bodySmall" color={c.onSurfaceVariant} maxLines={1}>
            {subtitle}
          </Type>
        ) : null}
      </Column>
      {action}
    </Row>
  );
}

/**
 * A screen's layout: app bar, scrolling body, optional pinned bottom bar.
 *
 * Render it inside <Screen> from a component of the screen's own, so that
 * component can hold state shared by the body and the bottom bar and can read
 * Material colors (they only resolve under the Host).
 */
export function Page({
  title,
  subtitle,
  action,
  back,
  bottom,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
  bottom?: ReactNode;
  children: ReactNode;
}) {
  const c = useMaterialColors();
  return (
    <Column modifiers={[fillMaxSize(), background(c.surface)]}>
      <AppBar title={title} subtitle={subtitle} action={action} back={back} />
      <LazyColumn modifiers={[weight(1), fillMaxWidth()]}>
        {children}
        <Box modifiers={[height(24)]} />
      </LazyColumn>
      {bottom ? (
        <Row
          horizontalArrangement={{ spacedBy: 8 }}
          verticalAlignment="center"
          modifiers={[fillMaxWidth(), background(c.surfaceContainer), padding(16, 12, 16, 16)]}
        >
          {bottom}
        </Row>
      ) : null}
    </Column>
  );
}

/** A small label above a group of rows. */
export function SectionHeader({ children }: { children: string }) {
  const c = useMaterialColors();
  return (
    <Box modifiers={[padding(16, 20, 16, 8)]}>
      <Type variant="titleSmall" color={c.primary}>
        {children}
      </Type>
    </Box>
  );
}

/** Body copy with the standard horizontal inset. */
export function Paragraph({ children, muted }: { children: string; muted?: boolean }) {
  const c = useMaterialColors();
  return (
    <Box modifiers={[padding(16, 4, 16, 4)]}>
      <Type variant="bodyLarge" color={muted ? c.onSurfaceVariant : c.onSurface}>
        {children}
      </Type>
    </Box>
  );
}

/** An outlined card with the standard inset around it. */
export function InfoCard({
  children,
  tone = 'plain',
  onPress,
}: {
  children: ReactNode;
  tone?: 'plain' | 'primary' | 'tertiary' | 'error';
  onPress?: () => void;
}) {
  const c = useMaterialColors();
  const container =
    tone === 'primary'
      ? c.primaryContainer
      : tone === 'tertiary'
        ? c.tertiaryContainer
        : tone === 'error'
          ? c.errorContainer
          : c.surfaceContainerLow;
  return (
    <Box modifiers={[padding(16, 4, 16, 4)]}>
      <Card
        colors={{ containerColor: container }}
        border={tone === 'plain' ? { width: 1, color: c.outlineVariant } : undefined}
        modifiers={onPress ? [fillMaxWidth(), clickable(onPress)] : [fillMaxWidth()]}
      >
        <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[paddingAll(16)]}>
          {children}
        </Column>
      </Card>
    </Box>
  );
}

/** A tappable list row with a leading icon. */
export function NavRow({
  icon,
  title,
  detail,
  onPress,
  trailing,
  leading,
}: {
  icon?: string;
  title: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  leading?: ReactNode;
}) {
  const c = useMaterialColors();
  return (
    <ListItem colors={{ containerColor: c.surface }} modifiers={onPress ? [clickable(onPress)] : []}>
      {leading || icon ? (
        <ListItem.LeadingContent>
          {leading ?? <Glyph name={icon!} color={c.onSurfaceVariant} />}
        </ListItem.LeadingContent>
      ) : null}
      <ListItem.HeadlineContent>
        <Type variant="bodyLarge" color={c.onSurface}>
          {title}
        </Type>
      </ListItem.HeadlineContent>
      {detail ? (
        <ListItem.SupportingContent>
          <Type variant="bodyMedium" color={c.onSurfaceVariant}>
            {detail}
          </Type>
        </ListItem.SupportingContent>
      ) : null}
      {trailing ? <ListItem.TrailingContent>{trailing}</ListItem.TrailingContent> : null}
    </ListItem>
  );
}

/** Outlined text field with a label, inset to the page margins. */
export function Field({
  label,
  onChange,
  defaultValue,
  supporting,
  multiline,
  keyboard,
  password,
}: {
  label: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  supporting?: string;
  multiline?: boolean;
  keyboard?: 'text' | 'email' | 'phone' | 'number';
  password?: boolean;
}) {
  // The native field owns its text. Seed it once, on first attach — an inline
  // ref callback would be a new function each render and re-seed over typing.
  const seeded = useRef(false);
  const seed = useCallback(
    (r: TextFieldRef | null) => {
      if (!r || seeded.current || !defaultValue) return;
      seeded.current = true;
      r.setText(defaultValue);
    },
    [defaultValue],
  );
  return (
    <Box modifiers={[padding(16, 4, 16, 4)]}>
      <OutlinedTextField
        singleLine={!multiline}
        minLines={multiline ? 3 : undefined}
        maxLines={multiline ? 8 : 1}
        visualTransformation={password ? 'password' : 'none'}
        keyboardOptions={{
          keyboardType: password ? 'password' : (keyboard ?? 'text'),
          capitalization: multiline ? 'sentences' : 'none',
        }}
        onValueChange={onChange}
        modifiers={[fillMaxWidth()]}
        ref={seed}
      >
        <OutlinedTextField.Label>
          <Text>{label}</Text>
        </OutlinedTextField.Label>
        {supporting ? (
          <OutlinedTextField.SupportingText>
            <Text>{supporting}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>
    </Box>
  );
}

/** A wrapping group of filter chips for picking several options. */
export function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <FlowRow
      horizontalArrangement={{ spacedBy: 8 }}
      verticalArrangement={{ spacedBy: 0 }}
      modifiers={[fillMaxWidth(), padding(16, 4, 16, 4)]}
    >
      {options.map((option) => (
        <FilterChip key={option} selected={selected.includes(option)} onClick={() => onToggle(option)}>
          <FilterChip.Label>
            <Text>{option}</Text>
          </FilterChip.Label>
        </FilterChip>
      ))}
    </FlowRow>
  );
}

/** Add or remove a value — the toggle every ChipGroup caller needs. */
export function toggled(list: string[], value: string, max?: number): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (max && list.length >= max) return list;
  return [...list, value];
}

/** A small rounded status label. */
export function Pill({ label, tone = 'secondary' }: { label: string; tone?: 'secondary' | 'tertiary' | 'error' | 'primary' }) {
  const c = useMaterialColors();
  const [bg, fg] =
    tone === 'tertiary'
      ? [c.tertiaryContainer, c.onTertiaryContainer]
      : tone === 'error'
        ? [c.errorContainer, c.onErrorContainer]
        : tone === 'primary'
          ? [c.primaryContainer, c.onPrimaryContainer]
          : [c.secondaryContainer, c.onSecondaryContainer];
  return (
    <Box modifiers={[clip(Shapes.RoundedCorner(12)), background(bg), padding(10, 4, 10, 4)]}>
      <Type variant="labelMedium" color={fg}>
        {label}
      </Type>
    </Box>
  );
}

/** Step indicator for multi-page flows like onboarding. */
export function StepProgress({ step, of }: { step: number; of: number }) {
  const c = useMaterialColors();
  return (
    <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(16, 0, 16, 8)]}>
      <LinearProgressIndicator progress={step / of} color={c.primary} modifiers={[fillMaxWidth()]} />
      <Type variant="labelMedium" color={c.onSurfaceVariant}>
        {`Step ${step} of ${of}`}
      </Type>
    </Column>
  );
}

/** Fills the remaining width in a Row — for pushing a button to one side. */
export function Grow({ children }: { children?: ReactNode }) {
  return <Box modifiers={[weight(1)]}>{children}</Box>;
}
