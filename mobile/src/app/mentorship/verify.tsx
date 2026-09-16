import { Button, RadioButton, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Grow, InfoCard, NavRow, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';
import { meetings, mentor } from '@/data/demo';

const METHODS = [
  { id: 'location', label: 'Share location', detail: 'Both phones confirm you are together' },
  { id: 'photo', label: 'Take a photo together', detail: 'Stored privately' },
  { id: 'code', label: 'Enter your mentor’s code', detail: 'Six digits on their screen' },
] as const;

export default function VerifyScreen() {
  return (
    <Screen>
      <Verify />
    </Screen>
  );
}

// POST /mentorship/:id/verify-meeting — meetings are verified in order.
function Verify() {
  const c = useMaterialColors();
  const next = meetings.find((m) => !m.verified);
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('location');
  const [verified, setVerified] = useState(false);

  if (!next || verified) {
    return (
      <Page
        title="Meeting verified"
        bottom={
          <>
            <Grow />
            <Button onClick={() => router.back()}>
              <Text>Done</Text>
            </Button>
          </>
        }
      >
        <InfoCard tone="primary">
          <Symbol name="verified" color={c.onPrimaryContainer} />
          <Type variant="titleLarge" color={c.onPrimaryContainer}>
            {next ? `${next.label} confirmed` : 'All meetings verified'}
          </Type>
          <Type variant="bodyLarge" color={c.onPrimaryContainer}>
            Your guardian can see that this meeting happened.
          </Type>
        </InfoCard>
      </Page>
    );
  }

  return (
    <Page
      title="Verify a meeting"
      subtitle={`With ${mentor.displayName}`}
      bottom={
        <>
          <Grow />
          <Button onClick={() => setVerified(true)}>
            <Text>Verify</Text>
          </Button>
        </>
      }
    >
      <Paragraph muted>Meet somewhere public. Either of you can verify.</Paragraph>
      <SectionHeader>Meetings</SectionHeader>
      {meetings.map((m) => (
        <NavRow
          key={m.number}
          icon={m.verified ? 'check_circle' : m === next ? 'radio_button_checked' : 'radio_button_unchecked'}
          title={`${m.number}. ${m.label}`}
          detail={m.verified ? m.when : m === next ? 'Next' : 'Later'}
        />
      ))}
      <SectionHeader>How</SectionHeader>
      {METHODS.map((m) => (
        <Row
          key={m.id}
          verticalAlignment="center"
          modifiers={[fillMaxWidth(), clickable(() => setMethod(m.id)), padding(8, 4, 16, 4)]}
        >
          <RadioButton selected={method === m.id} onClick={() => setMethod(m.id)} />
          <Row modifiers={[weight(1)]}>
            <Type variant="bodyLarge" color={c.onSurface}>
              {`${m.label} — ${m.detail}`}
            </Type>
          </Row>
        </Row>
      ))}
    </Page>
  );
}
