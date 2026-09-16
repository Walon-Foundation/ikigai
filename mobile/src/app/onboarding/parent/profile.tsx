import { Button, Text } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { Field, Grow, Page, Paragraph, StepProgress } from '@/components/Kit';
import { Screen } from '@/components/Screen';

export default function ParentProfileScreen() {
  return (
    <Screen>
      <ParentProfile />
    </Screen>
  );
}

function ParentProfile() {
  return (
    <Page
      title="About you"
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.push('/onboarding/parent/link')}>
            <Text>Next</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={1} of={2} />
      <Paragraph muted>Guardians can see progress and meetings — never private journal entries or messages.</Paragraph>
      <Field label="Your name" />
      <Field label="Phone" keyboard="phone" />
      <Field label="Relationship to the child" supporting="Mother, father, aunt, guardian…" />
    </Page>
  );
}
