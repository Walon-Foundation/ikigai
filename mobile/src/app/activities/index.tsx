import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { NavRow, Page, Paragraph, Pill } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { type EventItem, events, roadmapPercent } from '@/data/demo';

export default function ActivitiesScreen() {
  return (
    <Screen>
      <Activities />
    </Screen>
  );
}

function Activities() {
  useMaterialColors();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const shown = events.filter((e) => (tab === 'past' ? e.status === 'past' : e.status !== 'past'));

  const pill = (e: EventItem) => {
    if (e.rsvp === 'attended') return <Pill label="Attended" tone="primary" />;
    if (e.rsvp === 'registered') return <Pill label="Going" tone="primary" />;
    if (e.status === 'ongoing') return <Pill label="Happening now" tone="tertiary" />;
    if (e.unlockAtPercent && roadmapPercent < e.unlockAtPercent) return <Pill label={`Unlocks at ${e.unlockAtPercent}%`} tone="error" />;
    return null;
  };

  return (
    <Page title="Activities">
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth(), padding(16, 8, 16, 8)]}>
        <SegmentedButton selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          <SegmentedButton.Label>
            <Text>Upcoming</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
        <SegmentedButton selected={tab === 'past'} onClick={() => setTab('past')}>
          <SegmentedButton.Label>
            <Text>Past</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      </SingleChoiceSegmentedButtonRow>
      {tab === 'upcoming' ? <Paragraph muted>{`Your roadmap is ${roadmapPercent}% done. Some events open as you grow.`}</Paragraph> : null}
      {shown.map((e) => (
        <NavRow
          key={e.id}
          icon={e.status === 'past' ? 'event_available' : 'event'}
          title={e.title}
          detail={`${e.when} · ${e.where}`}
          trailing={pill(e)}
          onPress={() => router.push({ pathname: '/activities/[id]', params: { id: e.id } })}
        />
      ))}
    </Page>
  );
}
