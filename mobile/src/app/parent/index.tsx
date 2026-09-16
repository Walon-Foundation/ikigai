import { LinearProgressIndicator, Row, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { InfoCard, NavRow, Page, Pill, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { meetings, parentView } from '@/data/demo';

export default function ParentPortalScreen() {
  return (
    <Screen>
      <ParentPortal />
    </Screen>
  );
}

// What a guardian may see: stage, mentor, meetings, milestones. No journal, no messages.
function ParentPortal() {
  const c = useMaterialColors();
  const { child } = parentView;
  return (
    <Page title="Family" subtitle={parentView.parentName}>
      <InfoCard tone="primary">
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
          <Avatar background={c.primary} color={c.onPrimary} initials={child.initials} />
          <Type variant="titleLarge" color={c.onPrimaryContainer}>
            {child.name}
          </Type>
          <Pill label={child.stage} tone="tertiary" />
        </Row>
        <LinearProgressIndicator progress={child.percent / 100} color={c.primary} modifiers={[fillMaxWidth()]} />
        <Type variant="bodyMedium" color={c.onPrimaryContainer}>
          {`${child.percent}% of the roadmap · active ${child.lastActive}`}
        </Type>
      </InfoCard>

      <SectionHeader>Mentor</SectionHeader>
      <NavRow
        icon="verified_user"
        title={child.mentor}
        detail="Verified mentor"
        onPress={() => router.push({ pathname: '/mentors/[id]', params: { id: 'demo-mentor' } })}
      />

      <SectionHeader>Meetings</SectionHeader>
      {meetings.map((m) => (
        <NavRow
          key={m.number}
          icon={m.verified ? 'check_circle' : 'schedule'}
          title={m.label}
          detail={m.verified ? `Verified ${m.when}` : 'Not yet'}
        />
      ))}

      <SectionHeader>Recently</SectionHeader>
      {child.recent.map((r) => (
        <NavRow key={r} icon="park" title={r} />
      ))}

      <SectionHeader>More</SectionHeader>
      <NavRow icon="group_add" title="Link another child" onPress={() => router.push('/onboarding/parent/link')} />
      <NavRow icon="handshake" title="Mentors" detail="Browse verified mentors" onPress={() => router.push('/parent/mentors')} />
      <NavRow icon="health_and_safety" title="Safety" detail="Report a concern" onPress={() => router.push('/safety')} />
    </Page>
  );
}
