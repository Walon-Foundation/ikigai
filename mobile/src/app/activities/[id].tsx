import { Button, LinearProgressIndicator, OutlinedButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Grow, InfoCard, NavRow, Page, Paragraph, Pill } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { events, roadmapPercent } from '@/data/demo';

export default function EventScreen() {
  return (
    <Screen>
      <EventDetail />
    </Screen>
  );
}

function EventDetail() {
  const c = useMaterialColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = events.find((e) => e.id === id) ?? events[0];
  const [rsvp, setRsvp] = useState(event.rsvp);

  const locked = !!event.unlockAtPercent && roadmapPercent < event.unlockAtPercent;
  const full = !!event.capacity && event.registered >= event.capacity && rsvp !== 'registered';

  let bottom = null;
  if (event.status !== 'past') {
    bottom =
      rsvp === 'registered' ? (
        <>
          <Grow />
          <OutlinedButton onClick={() => setRsvp('none')}>
            <Text>Cancel my place</Text>
          </OutlinedButton>
        </>
      ) : (
        <>
          <Grow />
          <Button enabled={!locked && !full} onClick={() => setRsvp('registered')}>
            <Text>{locked ? 'Locked' : full ? 'Full' : "I'm going"}</Text>
          </Button>
        </>
      );
  }

  return (
    <Page title={event.title} bottom={bottom}>
      <NavRow icon="schedule" title={event.when} />
      <NavRow icon="place" title={event.where} />
      {event.capacity ? (
        <NavRow icon="group" title={`${event.registered} of ${event.capacity} places taken`} />
      ) : (
        <NavRow icon="group" title={`${event.registered} going`} />
      )}
      <Paragraph>{event.description}</Paragraph>

      {locked ? (
        <InfoCard tone="tertiary">
          <Type variant="titleMedium" color={c.onTertiaryContainer}>
            {`Unlocks at ${event.unlockAtPercent}%`}
          </Type>
          <LinearProgressIndicator
            progress={roadmapPercent / 100}
            color={c.tertiary}
            modifiers={[fillMaxWidth()]}
          />
          <Type variant="bodyMedium" color={c.onTertiaryContainer}>
            {`You're at ${roadmapPercent}%. Finish a few more milestones to join.`}
          </Type>
        </InfoCard>
      ) : null}
      {rsvp === 'registered' ? (
        <InfoCard tone="primary">
          <Pill label="You're going" tone="primary" />
          <Type variant="bodyMedium" color={c.onPrimaryContainer}>
            Check in at the door on the day to grow a leaf on your tree.
          </Type>
        </InfoCard>
      ) : null}
      {rsvp === 'attended' ? <Paragraph muted>You attended this event.</Paragraph> : null}
    </Page>
  );
}
