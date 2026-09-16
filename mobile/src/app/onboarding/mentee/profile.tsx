import { Button, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { useState } from 'react';
import { Field, Grow, InfoCard, Page, Paragraph, StepProgress } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { purposeBook } from '@/data/demo';

export default function MenteeProfileScreen() {
  return (
    <Screen>
      <MenteeProfile />
    </Screen>
  );
}

function MenteeProfile() {
  const c = useMaterialColors();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Page
        title="Your purpose"
        back={false}
        bottom={
          <>
            <Grow />
            <Button onClick={() => router.replace('/(tabs)')}>
              <Text>Find my mentor</Text>
            </Button>
          </>
        }
      >
        <InfoCard tone="primary">
          <Glyph name="auto_awesome" color={c.onPrimaryContainer} />
          <Type variant="titleLarge" color={c.onPrimaryContainer}>
            This is you
          </Type>
          <Type variant="bodyLarge" color={c.onPrimaryContainer}>
            {purposeBook.statement}
          </Type>
        </InfoCard>
        <Paragraph muted>It goes in your purpose book. You can change it any time.</Paragraph>
      </Page>
    );
  }

  return (
    <Page
      title="About you"
      bottom={
        <>
          <Grow />
          <Button onClick={() => setDone(true)}>
            <Text>Finish</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={4} of={4} />
      <Field label="What should we call you?" defaultValue="Aminata" />
      <Field label="Age" keyboard="number" />
      <Field label="Where do you live?" supporting="Town or neighbourhood — never your full address" />
      <Field label="Your school (optional)" />
      <Field label="In ten years I want to…" multiline />
    </Page>
  );
}
