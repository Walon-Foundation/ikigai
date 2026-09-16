import { Button, Text } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { useState } from 'react';
import { ChipGroup, Grow, Page, Paragraph, StepProgress, toggled } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { valueOptions } from '@/data/demo';

const MAX = 3;

export default function ValuesScreen() {
  return (
    <Screen>
      <Values />
    </Screen>
  );
}

function Values() {
  const [values, setValues] = useState<string[]>(['Learning', 'Family']);
  return (
    <Page
      title="What matters to you"
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.push('/onboarding/mentee/personality')} enabled={values.length > 0}>
            <Text>Next</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={2} of={4} />
      <Paragraph muted>{`Pick up to ${MAX}. These help us find a mentor who shares them.`}</Paragraph>
      <ChipGroup options={valueOptions} selected={values} onToggle={(o) => setValues((l) => toggled(l, o, MAX))} />
      <Paragraph muted>{`${values.length} of ${MAX} chosen`}</Paragraph>
    </Page>
  );
}
