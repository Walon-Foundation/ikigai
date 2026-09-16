import { Button, Checkbox, OutlinedButton, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Field, Grow, InfoCard, NavRow, Page, Paragraph, SectionHeader, StepProgress } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';

export default function MentorVerificationScreen() {
  return (
    <Screen>
      <Verification />
    </Screen>
  );
}

// Uploads go to R2 through the API (request → PUT → confirm). Demo only here.
function Verification() {
  const c = useMaterialColors();
  const [id, setId] = useState(false);
  const [police, setPolice] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Page
        title="Thank you"
        back={false}
        bottom={
          <>
            <Grow />
            <Button onClick={() => router.replace('/mentor')}>
              <Text>Go to mentor portal</Text>
            </Button>
          </>
        }
      >
        <InfoCard tone="tertiary">
          <Symbol name="hourglass_top" color={c.onTertiaryContainer} />
          <Type variant="titleLarge" color={c.onTertiaryContainer}>
            We are checking your documents
          </Type>
          <Type variant="bodyLarge" color={c.onTertiaryContainer}>
            This usually takes two to three days. You will be matched with mentees once you are approved.
          </Type>
        </InfoCard>
      </Page>
    );
  }

  const upload = (label: string, done: boolean, set: (v: boolean) => void) => (
    <NavRow
      icon={done ? 'check_circle' : 'upload_file'}
      title={label}
      detail={done ? 'Uploaded · private to reviewers' : 'Photo or PDF, up to 10 MB'}
      trailing={
        <OutlinedButton onClick={() => set(!done)}>
          <Text>{done ? 'Replace' : 'Upload'}</Text>
        </OutlinedButton>
      }
    />
  );

  return (
    <Page
      title="Verification"
      bottom={
        <>
          <Grow />
          <Button onClick={() => setSubmitted(true)} enabled={id && agreed}>
            <Text>Submit</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={2} of={2} />
      <Paragraph muted>You will be spending time with young people. Every mentor is checked before they are matched.</Paragraph>
      <SectionHeader>Documents</SectionHeader>
      {upload('National ID or passport', id, setId)}
      {upload('Police clearance (optional)', police, setPolice)}
      <SectionHeader>A reference</SectionHeader>
      <Field label="Referee name" />
      <Field label="Referee phone" keyboard="phone" />
      <Row verticalAlignment="center" modifiers={[fillMaxWidth(), padding(8, 12, 16, 0)]}>
        <Checkbox value={agreed} onCheckedChange={setAgreed} />
        <Row modifiers={[weight(1)]}>
          <Type variant="bodyMedium" color={c.onSurface}>
            I agree to the safeguarding code: meet in public, never alone, and report any concern.
          </Type>
        </Row>
      </Row>
    </Page>
  );
}
