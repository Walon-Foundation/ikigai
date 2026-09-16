import {
  Button,
  Checkbox,
  Column,
  ExtendedFloatingActionButton,
  ModalBottomSheet,
  Row,
  Text,
  TextButton,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Field, Grow, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { type Goal, goals as demoGoals } from '@/data/demo';

export default function GoalsScreen() {
  return (
    <Screen>
      <Goals />
    </Screen>
  );
}

function Goals() {
  const c = useMaterialColors();
  const [goals, setGoals] = useState<Goal[]>(demoGoals);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const open = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);
  const toggle = (id: string) => setGoals((l) => l.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));

  const row = (g: Goal) => (
    <Row key={g.id} verticalAlignment="center" modifiers={[fillMaxWidth(), padding(8, 4, 16, 4)]}>
      <Checkbox value={g.done} onCheckedChange={() => toggle(g.id)} />
      <Column modifiers={[weight(1)]}>
        <Type variant="bodyLarge" color={g.done ? c.onSurfaceVariant : c.onSurface}>
          {g.title}
        </Type>
        {g.detail || g.target ? (
          <Type variant="bodySmall" color={c.onSurfaceVariant}>
            {[g.detail, g.target && `by ${g.target}`].filter(Boolean).join(' · ')}
          </Type>
        ) : null}
      </Column>
    </Row>
  );

  return (
    <Page
      title="Goals"
      subtitle={`${done.length} of ${goals.length} done`}
      bottom={
        <>
          <Grow />
          <ExtendedFloatingActionButton onClick={() => setAdding(true)}>
            <ExtendedFloatingActionButton.Icon>
              <Glyph name="add" color={c.onPrimaryContainer} />
            </ExtendedFloatingActionButton.Icon>
            <ExtendedFloatingActionButton.Text>
              <Text>New goal</Text>
            </ExtendedFloatingActionButton.Text>
          </ExtendedFloatingActionButton>
        </>
      }
    >
      <Paragraph muted>Small, specific goals. Your mentor can see them.</Paragraph>
      <SectionHeader>In progress</SectionHeader>
      {open.map(row)}
      {done.length > 0 ? <SectionHeader>Done</SectionHeader> : null}
      {done.map(row)}

      {adding ? (
        <ModalBottomSheet onDismissRequest={() => setAdding(false)}>
          <Column modifiers={[fillMaxWidth(), padding(0, 0, 0, 24)]}>
            <Paragraph>New goal</Paragraph>
            <Field label="What do you want to do?" onChange={setDraft} />
            <Field label="By when? (optional)" />
            <Row modifiers={[fillMaxWidth(), padding(16, 8, 16, 0)]} horizontalArrangement={{ spacedBy: 8 }}>
              <Grow />
              <TextButton onClick={() => setAdding(false)}>
                <Text>Cancel</Text>
              </TextButton>
              <Button
                enabled={draft.trim().length > 0}
                onClick={() => {
                  setGoals((l) => [{ id: `g${Date.now()}`, title: draft.trim(), done: false }, ...l]);
                  setDraft('');
                  setAdding(false);
                }}
              >
                <Text>Add</Text>
              </Button>
            </Row>
          </Column>
        </ModalBottomSheet>
      ) : null}
    </Page>
  );
}
