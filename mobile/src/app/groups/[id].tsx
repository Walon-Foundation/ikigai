import { Button, Column, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, fillMaxWidth, imePadding, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { LazyColumn } from '@expo/ui/jetpack-compose';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Grow, InfoCard, Page, Paragraph, Pill } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Bubble, Composer, ThreadAppBar } from '@/components/Thread';
import { Type } from '@/components/Type';
import { clubs } from '@/data/demo';

export default function ClubScreen() {
  return (
    <Screen>
      <Club />
    </Screen>
  );
}

function Club() {
  const c = useMaterialColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = clubs.find((cl) => cl.id === id) ?? clubs[0];
  const [joined, setJoined] = useState(club.joined);
  const [messages, setMessages] = useState(club.messages);

  if (!joined) {
    return (
      <Page
        title={club.name}
        subtitle={`${club.members} members`}
        bottom={
          <>
            <Grow />
            <Button onClick={() => setJoined(true)}>
              <Text>Join club</Text>
            </Button>
          </>
        }
      >
        <InfoCard>
          <Type variant="bodyLarge" color={c.onSurface}>
            {club.description}
          </Type>
          <Pill label={club.tags.join(' · ')} />
        </InfoCard>
        <Paragraph muted>Joining adds a leaf to your tree and counts towards your Thrive milestones.</Paragraph>
      </Page>
    );
  }

  return (
    <Column modifiers={[fillMaxSize(), background(c.surface), imePadding()]}>
      <ThreadAppBar
        avatar={<Avatar background={c.secondaryContainer} color={c.onSecondaryContainer} initials="SG" diameter={40} />}
        title={club.name}
        subtitle={`${club.members} members`}
      />
      <LazyColumn verticalArrangement={{ spacedBy: 8 }} modifiers={[weight(1), fillMaxWidth(), padding(16, 8, 16, 8)]}>
        <Paragraph muted>{club.description}</Paragraph>
        {messages.length === 0 ? <Paragraph muted>Say hello to the club.</Paragraph> : null}
        {messages.map((m) => (
          <Column key={m.id} modifiers={[fillMaxWidth()]}>
            {!m.mine ? (
              <Type variant="labelMedium" color={c.onSurfaceVariant}>
                {m.from}
              </Type>
            ) : null}
            <Bubble fromMe={!!m.mine}>{m.text}</Bubble>
          </Column>
        ))}
      </LazyColumn>
      <Composer
        placeholder="Message the club"
        onSend={(text) => setMessages((l) => [...l, { id: `x${Date.now()}`, from: 'You', text, mine: true }])}
      />
    </Column>
  );
}
