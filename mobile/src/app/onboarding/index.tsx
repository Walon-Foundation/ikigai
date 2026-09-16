import { Button, Card, Column, RadioButton, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding, paddingAll, weight } from '@expo/ui/jetpack-compose/modifiers';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Grow, Page, Paragraph } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';

type Role = 'mentee' | 'mentor' | 'parent';

const roles: { id: Role; icon: string; title: string; detail: string; next: Href }[] = [
  {
    id: 'mentee',
    icon: 'potted_plant',
    title: 'I want to find my purpose',
    detail: 'Get a mentor, join clubs, grow your tree.',
    next: '/onboarding/mentee/assessment',
  },
  {
    id: 'mentor',
    icon: 'handshake',
    title: 'I want to mentor',
    detail: 'Guide a young person. We verify every mentor.',
    next: '/onboarding/mentor/profile',
  },
  {
    id: 'parent',
    icon: 'family_restroom',
    title: "I'm a parent or guardian",
    detail: "Follow your child's progress and approve their mentor.",
    next: '/onboarding/parent/profile',
  },
];

export default function RoleScreen() {
  return (
    <Screen>
      <ChooseRole />
    </Screen>
  );
}

function ChooseRole() {
  const c = useMaterialColors();
  const [role, setRole] = useState<Role>('mentee');
  const chosen = roles.find((r) => r.id === role)!;

  return (
    <Page
      title="Welcome to Ikigai"
      back={false}
      bottom={
        <>
          <Grow />
          <Button onClick={() => router.push(chosen.next)}>
            <Text>Continue</Text>
          </Button>
        </>
      }
    >
      <Paragraph muted>How will you use Ikigai?</Paragraph>
      {roles.map((r) => {
        const selected = r.id === role;
        return (
          <Column key={r.id} modifiers={[padding(16, 4, 16, 4)]}>
            <Card
              colors={{ containerColor: selected ? c.secondaryContainer : c.surfaceContainerLow }}
              border={{ width: selected ? 2 : 1, color: selected ? c.primary : c.outlineVariant }}
              modifiers={[fillMaxWidth(), clickable(() => setRole(r.id))]}
            >
              <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }} modifiers={[paddingAll(16)]}>
                <Avatar background={c.primaryContainer} color={c.onPrimaryContainer}>
                  <Glyph name={r.icon} color={c.onPrimaryContainer} />
                </Avatar>
                <Column modifiers={[weight(1)]}>
                  <Type variant="titleMedium" color={c.onSurface}>
                    {r.title}
                  </Type>
                  <Type variant="bodyMedium" color={c.onSurfaceVariant}>
                    {r.detail}
                  </Type>
                </Column>
                <RadioButton selected={selected} onClick={() => setRole(r.id)} />
              </Row>
            </Card>
          </Column>
        );
      })}
    </Page>
  );
}
