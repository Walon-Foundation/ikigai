import { Button, Text } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { useState } from 'react';
import { ChipGroup, Field, Grow, Page, SectionHeader, StepProgress, toggled } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { expertiseOptions } from '@/data/demo';

const LANGUAGES = ['Krio', 'English', 'Temne', 'Mende', 'Limba', 'French'];

export default function MentorProfileScreen() {
  return (
    <Screen>
      <MentorProfile />
    </Screen>
  );
}

function MentorProfile() {
  const [expertise, setExpertise] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['Krio', 'English']);
  return (
    <Page
      title="Your mentor profile"
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.push('/onboarding/mentor/verification')} enabled={expertise.length > 0}>
            <Text>Next</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={1} of={2} />
      <Field label="Full name" />
      <Field label="Headline" supporting="e.g. Civil engineer · Freetown" />
      <Field label="Why do you want to mentor?" multiline />
      <SectionHeader>Your expertise</SectionHeader>
      <ChipGroup options={expertiseOptions} selected={expertise} onToggle={(o) => setExpertise((l) => toggled(l, o))} />
      <SectionHeader>Languages you speak</SectionHeader>
      <ChipGroup options={LANGUAGES} selected={languages} onToggle={(o) => setLanguages((l) => toggled(l, o))} />
      <Field label="How many mentees can you take?" keyboard="number" defaultValue="2" />
    </Page>
  );
}
