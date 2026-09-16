import {
  Box,
  Card,
  Column,
  FilledIconButton,
  FilledTonalButton,
  IconButton,
  Row,
  Text,
  TextField,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Glyph } from './Glyph';
import { Type } from './Type';

/**
 * Material 3 small top app bar for a thread: back, avatar, title, subtitle,
 * optional trailing action. Compose has no TopAppBar in @expo/ui yet, so this is
 * the same anatomy built from Row + IconButton.
 */
export function ThreadAppBar({
  avatar,
  title,
  subtitle,
  action,
}: {
  avatar: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  const c = useMaterialColors();
  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: 4 }}
      modifiers={[fillMaxWidth(), height(64), background(c.surfaceContainer), padding(4, 0, 4, 0)]}
    >
      <IconButton onClick={() => router.back()}>
        <Glyph name="arrow_back" color={c.onSurface} />
      </IconButton>
      {avatar}
      <Column modifiers={[weight(1), padding(8, 0, 0, 0)]}>
        <Type variant="titleMedium"  color={c.onSurface}>
          {title}
        </Type>
        <Type variant="bodySmall"  color={c.onSurfaceVariant}>
          {subtitle}
        </Type>
      </Column>
      {action}
    </Row>
  );
}

/** A day label between groups of messages. */
export function DayDivider({ label }: { label: string }) {
  const c = useMaterialColors();
  return (
    <Row horizontalArrangement="center" modifiers={[fillMaxWidth(), padding(0, 8, 0, 4)]}>
      <Type variant="labelMedium"  color={c.onSurfaceVariant}>
        {label}
      </Type>
    </Row>
  );
}

/**
 * A chat bubble.
 *
 * Width is capped by padding the OPPOSITE side of the row rather than by a
 * max-width. Compose measures an unweighted Row child against the full width,
 * so a trailing spacer would be squeezed to nothing by a long message; padding
 * the row itself is what actually bounds it.
 */
export function Bubble({ fromMe, children }: { fromMe: boolean; children: string }) {
  const c = useMaterialColors();
  const shape = fromMe
    ? Shapes.RoundedCorner({ topStart: 20, topEnd: 20, bottomStart: 20, bottomEnd: 4 })
    : Shapes.RoundedCorner({ topStart: 20, topEnd: 20, bottomStart: 4, bottomEnd: 20 });
  return (
    <Row
      horizontalArrangement={fromMe ? 'end' : 'start'}
      modifiers={[fillMaxWidth(), fromMe ? padding(56, 0, 0, 0) : padding(0, 0, 56, 0)]}
    >
      <Box
        modifiers={[
          clip(shape),
          background(fromMe ? c.primary : c.surfaceContainerHigh),
          padding(14, 10, 14, 10),
        ]}
      >
        <Type variant="bodyLarge"  color={fromMe ? c.onPrimary : c.onSurface}>
          {children}
        </Type>
      </Box>
    </Row>
  );
}

/** A mission the mentor set, shown inside the thread rather than on a task screen. */
export function MissionCard({
  title,
  detail,
  due,
  onOpen,
}: {
  title: string;
  detail: string;
  due: string;
  onOpen?: () => void;
}) {
  const c = useMaterialColors();
  return (
    <Row modifiers={[fillMaxWidth(), padding(0, 0, 40, 0)]}>
      <Card
        colors={{ containerColor: c.surfaceContainerLow }}
        border={{ width: 1, color: c.outlineVariant }}
        modifiers={[fillMaxWidth()]}
      >
        <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[paddingAll(16)]}>
          <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }}>
            <Glyph name="assignment" color={c.primary} size={20} />
            <Type variant="labelMedium"  color={c.primary}>
              New mission
            </Type>
          </Row>
          <Type variant="titleMedium"  color={c.onSurface}>
            {title}
          </Type>
          <Type variant="bodyMedium"  color={c.onSurfaceVariant}>
            {detail}
          </Type>
          <Row
            verticalAlignment="center"
            horizontalArrangement="spaceBetween"
            modifiers={[fillMaxWidth()]}
          >
            <Type variant="labelLarge"  color={c.tertiary}>
              {due}
            </Type>
            <FilledTonalButton onClick={onOpen}>
              <Text>Open</Text>
            </FilledTonalButton>
          </Row>
        </Column>
      </Card>
    </Row>
  );
}

/**
 * Message composer: attach, text field, send.
 *
 * `onSend` receives the trimmed text; empty sends are ignored here so no caller
 * has to repeat the check.
 */
export function Composer({
  placeholder,
  onSend,
  header,
}: {
  placeholder: string;
  onSend: (text: string) => void;
  header?: ReactNode;
}) {
  const c = useMaterialColors();
  const [draft, setDraft] = useState('');
  const [fieldKey, setFieldKey] = useState(0);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
    // The native field owns its own text. Remounting it is the dependable way
    // to clear it after a send without a controlled-value round-trip.
    setFieldKey((k) => k + 1);
  };

  return (
    <Column
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxWidth(), background(c.surfaceContainer), padding(8, 8, 8, 16)]}
    >
      {header}
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
        <IconButton onClick={() => {}}>
          <Glyph name="attach_file" color={c.onSurfaceVariant} />
        </IconButton>
        <Box modifiers={[weight(1)]}>
          <TextField key={fieldKey} singleLine={false} maxLines={4} onValueChange={setDraft} modifiers={[fillMaxWidth()]}>
            <TextField.Placeholder>
              <Text>{placeholder}</Text>
            </TextField.Placeholder>
          </TextField>
        </Box>
        <FilledIconButton onClick={send}>
          <Glyph name="send" color={c.onPrimary} />
        </FilledIconButton>
      </Row>
    </Column>
  );
}
