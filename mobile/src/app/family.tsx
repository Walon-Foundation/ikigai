import { OutlinedButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { InfoCard, NavRow, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { parentView } from '@/data/demo';

export default function FamilyScreen() {
  return (
    <Screen>
      <Family />
    </Screen>
  );
}

// The mentee's side of guardian linking: share a code, see who is linked.
function Family() {
  const c = useMaterialColors();
  const [linked, setLinked] = useState(true);
  return (
    <Page title="Family">
      <Paragraph muted>A guardian can see your stage, your mentor and verified meetings. Never your journal or messages.</Paragraph>
      <SectionHeader>Linked guardians</SectionHeader>
      {linked ? (
        <NavRow
          icon="family_restroom"
          title={parentView.parentName}
          detail="Linked · can approve your mentor"
          trailing={
            <OutlinedButton onClick={() => setLinked(false)}>
              <Text>Remove</Text>
            </OutlinedButton>
          }
        />
      ) : (
        <Paragraph muted>No one linked yet.</Paragraph>
      )}
      <SectionHeader>Your link code</SectionHeader>
      <InfoCard tone="primary">
        <Type variant="headlineMedium" color={c.onPrimaryContainer}>
          {parentView.pendingInvite.code}
        </Type>
        <Type variant="bodyMedium" color={c.onPrimaryContainer}>
          Give this to your parent or guardian. It works once and expires in 7 days.
        </Type>
      </InfoCard>
    </Page>
  );
}
