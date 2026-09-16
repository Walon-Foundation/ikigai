import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { NavRow, Page, Paragraph, Pill, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { curriculum, meetings, mentor } from '@/data/demo';

export default function PlanScreen() {
  return (
    <Screen>
      <Plan />
    </Screen>
  );
}

function Plan() {
  useMaterialColors();
  const done = meetings.filter((m) => m.verified).length;
  return (
    <Page title="Our plan" subtitle={`With ${mentor.displayName}`}>
      <Paragraph muted>What you and your mentor are working through, one topic at a time.</Paragraph>
      <SectionHeader>Curriculum</SectionHeader>
      {curriculum.map((item) => (
        <NavRow
          key={item.id}
          icon={item.status === 'done' ? 'check_circle' : item.status === 'in_progress' ? 'pending' : 'radio_button_unchecked'}
          title={item.title}
          detail={[item.description, item.target && `target ${item.target}`].filter(Boolean).join(' · ') || undefined}
          trailing={item.status === 'in_progress' ? <Pill label="Now" tone="tertiary" /> : undefined}
        />
      ))}
      <SectionHeader>{`Meetings · ${done} of ${meetings.length} verified`}</SectionHeader>
      {meetings.map((m) => (
        <NavRow
          key={m.number}
          icon={m.verified ? 'verified' : 'event_upcoming'}
          title={m.label}
          detail={m.verified ? `${m.when} · ${m.method}` : 'Not yet verified'}
          onPress={m.verified ? undefined : () => router.push('/mentorship/verify')}
        />
      ))}
    </Page>
  );
}
