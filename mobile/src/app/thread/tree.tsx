import {
  Box,
  Card,
  Column,
  LazyColumn,
  LinearProgressIndicator,
  Row,
  SuggestionChip,
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
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Bubble, ThreadAppBar } from '@/components/Thread';
import { Type } from '@/components/Type';
import { me, thriveMilestones, treeThread } from '@/data/demo';

export default function TreeThreadScreen() {
  return (
    <Screen>
      <TreeThread />
    </Screen>
  );
}

function TreeThread() {
  const c = useMaterialColors();
  const done = thriveMilestones.filter((m) => m.done).length;
  const total = thriveMilestones.length;
  const [first, ...rest] = treeThread;

  return (
    <Column modifiers={[fillMaxSize(), background(c.surface)]}>
      <ThreadAppBar
        avatar={
          <Avatar background={c.primary} color={c.onPrimary}>
            <Symbol name="forest" color={c.onPrimary} />
          </Avatar>
        }
        title="Your tree"
        subtitle={`Thrive · week ${me.weekInStage}`}
      />

      <LazyColumn
        verticalArrangement={{ spacedBy: 8 }}
        contentPadding={{ start: 16, end: 16, top: 12, bottom: 12 }}
        modifiers={[fillMaxWidth(), weight(1)]}
      >
        {first && first.kind === 'text' ? <Bubble fromMe={false}>{first.text}</Bubble> : null}

        {/* progress, inside the conversation */}
        <Row modifiers={[fillMaxWidth(), padding(0, 0, 40, 0)]}>
          <Card colors={{ containerColor: c.primaryContainer }} modifiers={[fillMaxWidth()]}>
            <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[paddingAll(16)]}>
              <Row verticalAlignment="center" horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
                <Type variant="titleMedium" color={c.onPrimaryContainer}>
                  Thrive
                </Type>
                <Type variant="bodyMedium" color={c.onPrimaryContainer}>
                  {`${done} of ${total} milestones`}
                </Type>
              </Row>
              <LinearProgressIndicator progress={done / total} color={c.primary} modifiers={[fillMaxWidth()]} />
            </Column>
          </Card>
        </Row>

        {/* a milestone reached */}
        <Row modifiers={[fillMaxWidth(), padding(0, 0, 56, 0)]}>
          <Row
            verticalAlignment="center"
            horizontalArrangement={{ spacedBy: 12 }}
            modifiers={[background(c.surfaceContainerHigh), padding(14, 12, 14, 12)]}
          >
            <Symbol name="check_circle" color={c.primary} size={28} />
            <Column>
              <Type variant="titleSmall" color={c.onSurface}>
                You joined a club
              </Type>
              <Type variant="bodyMedium" color={c.onSurfaceVariant}>
                STEM Girls Freetown
              </Type>
            </Column>
          </Row>
        </Row>

        {rest.map((m) =>
          m.kind === 'text' ? (
            <Bubble key={m.id} fromMe={m.fromMe}>
              {m.text}
            </Bubble>
          ) : null,
        )}
      </LazyColumn>

      {/* The tree is guided, so it answers with suggestions, never a free-text box. */}
      <Row
        horizontalArrangement={{ spacedBy: 8 }}
        modifiers={[fillMaxWidth(), background(c.surfaceContainer), padding(16, 12, 16, 20)]}
      >
        <SuggestionChip onClick={() => router.push('/(tabs)/journey')}>
          <SuggestionChip.Label>
            <Text>Show my milestones</Text>
          </SuggestionChip.Label>
        </SuggestionChip>
        <SuggestionChip onClick={() => router.push('/thread/mentor')}>
          <SuggestionChip.Label>
            <Text>Open the mission</Text>
          </SuggestionChip.Label>
        </SuggestionChip>
      </Row>
      <Box />
    </Column>
  );
}
