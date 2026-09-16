import {
  Card,
  Column,
  LazyColumn,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Bubble, Composer, DayDivider, ThreadAppBar } from '@/components/Thread';
import { Type } from '@/components/Type';
import { type JournalEntry, type JournalVisibility, journal, journalPrompt } from '@/data/demo';

export default function JournalScreen() {
  return (
    <Screen>
      <Journal />
    </Screen>
  );
}

function Journal() {
  const c = useMaterialColors();
  const [entries, setEntries] = useState<JournalEntry[]>(journal);
  // Private is the default, and visibility is chosen BEFORE writing, not after.
  // A mentee who assumes their mentor can't see something must be right.
  const [visibility, setVisibility] = useState<JournalVisibility>('private');

  const save = (content: string) =>
    setEntries((prev) => [
      ...prev,
      { id: `local-${prev.length}`, day: 'Today', content, visibility },
    ]);

  let lastDay = '';

  return (
    <Column modifiers={[fillMaxSize(), background(c.surface)]}>
      <ThreadAppBar
        avatar={
          <Avatar background={c.surfaceContainerHighest} color={c.onSurfaceVariant}>
            <Symbol name="menu_book" color={c.onSurfaceVariant} />
          </Avatar>
        }
        title="My journal"
        subtitle="Private unless you share"
      />

      <LazyColumn
        verticalArrangement={{ spacedBy: 8 }}
        contentPadding={{ start: 16, end: 16, top: 12, bottom: 12 }}
        modifiers={[fillMaxWidth(), weight(1)]}
      >
        <Card colors={{ containerColor: c.tertiaryContainer }} modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[paddingAll(16)]}>
            <Type variant="labelLarge" color={c.onTertiaryContainer}>
              Today's prompt
            </Type>
            <Type variant="bodyMedium" color={c.onTertiaryContainer}>
              {journalPrompt}
            </Type>
          </Column>
        </Card>

        {entries.map((e) => {
          const showDay = e.day !== lastDay;
          lastDay = e.day;
          const shared = e.visibility === 'mentor_only';
          return (
            <Column key={e.id} verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
              {showDay ? <DayDivider label={e.day} /> : null}
              <Bubble fromMe>{e.content}</Bubble>
              <Row
                horizontalArrangement="end"
                verticalAlignment="center"
                modifiers={[fillMaxWidth(), padding(0, 0, 4, 0)]}
              >
                <Symbol
                  name={shared ? 'group' : 'lock'}
                  color={shared ? c.primary : c.onSurfaceVariant}
                  size={14}
                />
                <Type variant="labelMedium" color={shared ? c.primary : c.onSurfaceVariant}>
                  {shared ? ' Shared with Fatmata' : ' Only you'}
                </Type>
              </Row>
              {e.mentorReply ? <Bubble fromMe={false}>{e.mentorReply}</Bubble> : null}
            </Column>
          );
        })}
      </LazyColumn>

      <Composer
        placeholder="Write to yourself"
        onSend={save}
        header={
          <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
            <SegmentedButton selected={visibility === 'private'} onClick={() => setVisibility('private')}>
              <SegmentedButton.Label>
                <Text>Only you</Text>
              </SegmentedButton.Label>
            </SegmentedButton>
            <SegmentedButton
              selected={visibility === 'mentor_only'}
              onClick={() => setVisibility('mentor_only')}
            >
              <SegmentedButton.Label>
                <Text>Share with mentor</Text>
              </SegmentedButton.Label>
            </SegmentedButton>
          </SingleChoiceSegmentedButtonRow>
        }
      />
    </Column>
  );
}
