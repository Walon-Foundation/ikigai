import { Button, LinearProgressIndicator, OutlinedButton, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { InfoCard, NavRow, Page, Paragraph, Pill, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { mentorCapacity, mentorMentees, mentorRequests } from '@/data/demo';

export default function MentorPortalScreen() {
  return (
    <Screen>
      <MentorPortal />
    </Screen>
  );
}

function MentorPortal() {
  const c = useMaterialColors();
  const [requests, setRequests] = useState(mentorRequests);
  const [mentees, setMentees] = useState(mentorMentees);
  const full = mentees.length >= mentorCapacity;

  const accept = (id: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r || full) return;
    setRequests((l) => l.filter((x) => x.id !== id));
    setMentees((l) => [
      ...l,
      { id: r.id, name: r.menteeName, initials: r.initials, stage: 'discover', percent: 0, lastActive: 'Just now', needsReview: 0 },
    ]);
  };

  return (
    <Page title="Mentor portal" subtitle="Fatmata Sesay">
      <InfoCard tone="primary">
        <Type variant="titleMedium" color={c.onPrimaryContainer}>
          {`${mentees.length} of ${mentorCapacity} mentees`}
        </Type>
        <LinearProgressIndicator progress={mentees.length / mentorCapacity} color={c.primary} modifiers={[fillMaxWidth()]} />
        <Type variant="bodyMedium" color={c.onPrimaryContainer}>
          {full ? 'You are full. Raise your capacity to accept more.' : 'You have room for another mentee.'}
        </Type>
      </InfoCard>

      <SectionHeader>{`Requests (${requests.length})`}</SectionHeader>
      {requests.length === 0 ? <Paragraph muted>No new requests.</Paragraph> : null}
      {requests.map((r) => (
        <InfoCard key={r.id}>
          <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
            <Avatar background={c.secondaryContainer} color={c.onSecondaryContainer} initials={r.initials} />
            <Type variant="titleMedium" color={c.onSurface}>
              {r.menteeName}
            </Type>
            <Pill label={`${r.score}% match`} tone="primary" />
          </Row>
          <Type variant="bodyMedium" color={c.onSurfaceVariant}>
            {`${r.interests.join(', ')} · ${r.note}`}
          </Type>
          <Row horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(0, 4, 0, 0)]}>
            <Button enabled={!full} onClick={() => accept(r.id)}>
              <Text>Accept</Text>
            </Button>
            <OutlinedButton onClick={() => setRequests((l) => l.filter((x) => x.id !== r.id))}>
              <Text>Decline</Text>
            </OutlinedButton>
          </Row>
        </InfoCard>
      ))}

      <SectionHeader>Your mentees</SectionHeader>
      {mentees.map((m) => (
        <NavRow
          key={m.id}
          leading={<Avatar background={c.tertiaryContainer} color={c.onTertiaryContainer} initials={m.initials} />}
          title={m.name}
          detail={`${m.stage[0].toUpperCase()}${m.stage.slice(1)} · ${m.percent}% · active ${m.lastActive}`}
          trailing={m.needsReview ? <Pill label={`${m.needsReview} to review`} tone="tertiary" /> : undefined}
          onPress={() => router.push({ pathname: '/mentor/[menteeId]', params: { menteeId: m.id } })}
        />
      ))}

      <SectionHeader>You</SectionHeader>
      <NavRow icon="badge" title="Your public profile" onPress={() => router.push({ pathname: '/mentors/[id]', params: { id: 'demo-mentor' } })} />
      <NavRow icon="verified_user" title="Verification" detail="Approved" />
      <NavRow icon="health_and_safety" title="Safeguarding" detail="Report a concern" onPress={() => router.push('/safety')} />
    </Page>
  );
}
