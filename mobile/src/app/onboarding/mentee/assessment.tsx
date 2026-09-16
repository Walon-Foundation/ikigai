import { Button, Text } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { useState } from 'react';
import { ChipGroup, Field, Grow, Page, Paragraph, SectionHeader, StepProgress, toggled } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { assessmentQuestions, interestOptions } from '@/data/demo';

export default function AssessmentScreen() {
  return (
    <Screen>
      <Assessment />
    </Screen>
  );
}

// The four ikigai circles, then interests. Maps to onboarding_data.assessment.
function Assessment() {
  const [interests, setInterests] = useState<string[]>(['Technology', 'Engineering']);
  return (
    <Page
      title="Your ikigai"
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.push('/onboarding/mentee/values')} enabled={interests.length > 0}>
            <Text>Next</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={1} of={4} />
      <Paragraph muted>There are no wrong answers. A few words each is enough.</Paragraph>
      {assessmentQuestions.map((q) => (
        <Field key={q.key} label={q.title} supporting={q.hint} multiline />
      ))}
      <SectionHeader>What are you interested in?</SectionHeader>
      <ChipGroup options={interestOptions} selected={interests} onToggle={(o) => setInterests((l) => toggled(l, o))} />
    </Page>
  );
}
