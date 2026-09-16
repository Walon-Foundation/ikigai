import { Button, RadioButton, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Field, Grow, InfoCard, NavRow, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';

const REASONS = [
  'Someone made me feel unsafe',
  'Inappropriate messages',
  'Asked to meet somewhere private',
  'Asked for money or gifts',
  'Something else',
];

export default function SafetyScreen() {
  return (
    <Screen>
      <Safety />
    </Screen>
  );
}

// POST /safety/reports — goes straight to the safeguarding team.
function Safety() {
  const c = useMaterialColors();
  const [reason, setReason] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <Page title="Report sent">
        <InfoCard tone="primary">
          <Symbol name="shield" color={c.onPrimaryContainer} />
          <Type variant="titleLarge" color={c.onPrimaryContainer}>
            Thank you for telling us
          </Type>
          <Type variant="bodyLarge" color={c.onPrimaryContainer}>
            A safeguarding officer will contact you within 24 hours. The person you reported will not be told it was you.
          </Type>
        </InfoCard>
        <NavRow icon="call" title="Need help right now?" detail="Emergency numbers" onPress={() => router.push('/safety/help')} />
      </Page>
    );
  }

  return (
    <Page
      title="Safety"
      bottom={
        <>
          <Grow />
          <Button enabled={!!reason} onClick={() => setSent(true)}>
            <Text>Send report</Text>
          </Button>
        </>
      }
    >
      <InfoCard tone="error">
        <Type variant="titleMedium" color={c.onErrorContainer}>
          In danger now?
        </Type>
        <Type variant="bodyMedium" color={c.onErrorContainer}>
          Call 999 or the free child protection line, 116.
        </Type>
      </InfoCard>
      <NavRow icon="call" title="Help lines" detail="Free, confidential numbers" onPress={() => router.push('/safety/help')} />

      <SectionHeader>Report a concern</SectionHeader>
      <Paragraph muted>Only the safeguarding team sees this.</Paragraph>
      {REASONS.map((r) => (
        <Row key={r} verticalAlignment="center" modifiers={[fillMaxWidth(), clickable(() => setReason(r)), padding(8, 0, 16, 0)]}>
          <RadioButton selected={reason === r} onClick={() => setReason(r)} />
          <Row modifiers={[weight(1)]}>
            <Type variant="bodyLarge" color={c.onSurface}>
              {r}
            </Type>
          </Row>
        </Row>
      ))}
      <Field label="Who is it about? (optional)" />
      <Field label="What happened?" multiline />
    </Page>
  );
}
