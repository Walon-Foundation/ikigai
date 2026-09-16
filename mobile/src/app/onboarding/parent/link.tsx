import { Button, SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Field, Grow, Page, Paragraph, StepProgress } from '@/components/Kit';
import { Screen } from '@/components/Screen';

export default function ParentLinkScreen() {
  return (
    <Screen>
      <LinkChild />
    </Screen>
  );
}

// Either the child already has an account and shares a code, or the parent
// invites them by email. Both create a guardian_links row.
function LinkChild() {
  const [mode, setMode] = useState<'code' | 'invite'>('code');
  return (
    <Page
      title="Link your child"
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.replace('/parent')}>
            <Text>{mode === 'code' ? 'Link' : 'Send invite'}</Text>
          </Button>
        </>
      }
    >
      <StepProgress step={2} of={2} />
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth(), padding(16, 8, 16, 8)]}>
        <SegmentedButton selected={mode === 'code'} onClick={() => setMode('code')}>
          <SegmentedButton.Label>
            <Text>They have a code</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
        <SegmentedButton selected={mode === 'invite'} onClick={() => setMode('invite')}>
          <SegmentedButton.Label>
            <Text>Invite them</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      </SingleChoiceSegmentedButtonRow>
      {mode === 'code' ? (
        <>
          <Paragraph muted>Your child can find their code in Me → Family.</Paragraph>
          <Field label="Link code" supporting="Looks like IK-4F9K2A" />
        </>
      ) : (
        <>
          <Paragraph muted>We will email them an invitation to join and link to you.</Paragraph>
          <Field label="Child's name" />
          <Field label="Child's email" keyboard="email" />
        </>
      )}
    </Page>
  );
}
