import { Button, Column, Row, Slider, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Grow, Page, Paragraph, StepProgress } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { personalityScales } from '@/data/demo';

export default function PersonalityScreen() {
  return (
    <Screen>
      <Personality />
    </Screen>
  );
}

// Each scale is 1–5, matching onboarding_data.personality.
function Personality() {
  const c = useMaterialColors();
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(personalityScales.map((s) => [s.key, 3])),
  );
  return (
    <Page
      title="How you work"
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.push('/onboarding/mentee/profile')}>
            <Text>Next</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={3} of={4} />
      <Paragraph muted>Slide towards whichever sounds more like you.</Paragraph>
      {personalityScales.map((s) => (
        <Column key={s.key} modifiers={[fillMaxWidth(), padding(16, 12, 16, 4)]}>
          <Row horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
            <Type variant="labelLarge" color={c.onSurface}>
              {s.left}
            </Type>
            <Type variant="labelLarge" color={c.onSurface}>
              {s.right}
            </Type>
          </Row>
          <Slider
            value={scores[s.key]}
            min={1}
            max={5}
            steps={3}
            onValueChange={(v) => setScores((prev) => ({ ...prev, [s.key]: Math.round(v) }))}
            modifiers={[fillMaxWidth()]}
          />
        </Column>
      ))}
    </Page>
  );
}
