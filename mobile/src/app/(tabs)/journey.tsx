import {
  Box,
  Card,
  Checkbox,
  Column,
  LazyColumn,
  LinearProgressIndicator,
  ListItem,
  Row,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { NavRow, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';
import { me, stages, thriveMilestones } from '@/data/demo';

export default function JourneyScreen() {
  return (
    <Screen>
      <Journey />
    </Screen>
  );
}

function Journey() {
  const c = useMaterialColors();
  const done = thriveMilestones.filter((m) => m.done).length;
  const order = stages.map((s) => s.id);
  const currentIndex = order.indexOf(me.currentStage);

  return (
    <LazyColumn modifiers={[fillMaxSize(), background(c.surface)]}>
      <Column modifiers={[padding(16, 24, 16, 8)]}>
        <Type variant="headlineMedium" color={c.onSurface}>
          Journey
        </Type>
        <Type variant="bodyMedium" color={c.onSurfaceVariant}>
          Four stages. Your mentor moves you on.
        </Type>
      </Column>

      {stages.map((stage, i) => {
        if (i === currentIndex) {
          return (
            <Box key={stage.id} modifiers={[padding(16, 4, 16, 4)]}>
              <Card
                colors={{ containerColor: c.surfaceContainerLow }}
                border={{ width: 1, color: c.outlineVariant }}
                modifiers={[fillMaxWidth()]}
              >
                <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[paddingAll(16)]}>
                  <Row verticalAlignment="center" horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
                    <Type variant="titleLarge" color={c.onSurface}>
                      {stage.label}
                    </Type>
                    <Box modifiers={[clip(Shapes.RoundedCorner(12)), background(c.tertiaryContainer), padding(10, 4, 10, 4)]}>
                      <Type variant="labelMedium" color={c.onTertiaryContainer}>
                        Current stage
                      </Type>
                    </Box>
                  </Row>
                  <LinearProgressIndicator
                    progress={done / thriveMilestones.length}
                    color={c.primary}
                    modifiers={[fillMaxWidth()]}
                  />
                  <Column>
                    {thriveMilestones.map((m) => (
                      <Row key={m.id} verticalAlignment="center" modifiers={[fillMaxWidth()]}>
                        {/*
                          Read-only on purpose: only a mentor marks a milestone
                          complete. A mentee submits evidence from the mission.
                        */}
                        <Checkbox value={m.done} enabled={false} />
                        <Box modifiers={[weight(1)]}>
                          <Type variant="bodyLarge" color={m.done ? c.onSurfaceVariant : c.onSurface}>
                            {m.label}
                          </Type>
                        </Box>
                        {m.due ? (
                          <Type variant="labelLarge" color={c.tertiary}>
                            {m.due}
                          </Type>
                        ) : null}
                      </Row>
                    ))}
                  </Column>
                </Column>
              </Card>
            </Box>
          );
        }

        const finished = i < currentIndex;
        return (
          <ListItem key={stage.id} colors={{ containerColor: c.surface }}>
            <ListItem.LeadingContent>
              <Symbol
                name={finished ? 'check_circle' : 'lock'}
                color={finished ? c.primary : c.onSurfaceVariant}
                size={28}
              />
            </ListItem.LeadingContent>
            <ListItem.HeadlineContent>
              <Type variant="bodyLarge" color={finished ? c.onSurface : c.onSurfaceVariant}>
                {stage.label}
              </Type>
            </ListItem.HeadlineContent>
            <ListItem.SupportingContent>
              <Type variant="bodyMedium" color={c.onSurfaceVariant}>
                {stage.note}
              </Type>
            </ListItem.SupportingContent>
          </ListItem>
        );
      })}

      <SectionHeader>Keep growing</SectionHeader>
      <NavRow icon="map" title="Our plan" detail="What you and your mentor are working on" onPress={() => router.push('/mentorship/plan')} />
      <NavRow icon="flag" title="Goals" onPress={() => router.push('/goals')} />
      <NavRow icon="event" title="Activities" detail="Some unlock as you grow" onPress={() => router.push('/activities')} />
    </LazyColumn>
  );
}
