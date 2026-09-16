import { IconButton, LazyColumn, useMaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { Column } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Bubble, Composer, DayDivider, MissionCard, ThreadAppBar } from '@/components/Thread';
import { type Message, mentor, mentorThread } from '@/data/demo';

export default function MentorThreadScreen() {
  return (
    <Screen>
      <MentorThread />
    </Screen>
  );
}

function MentorThread() {
  const c = useMaterialColors();
  // Local for the demo. On the API this becomes GET /messages/:id plus the
  // realtime socket's `message` event appending to the same list.
  const [messages, setMessages] = useState<Message[]>(mentorThread);

  const send = (text: string) =>
    setMessages((prev) => [
      ...prev,
      { id: `local-${prev.length}`, kind: 'text', fromMe: true, text, timestamp: 'now' },
    ]);

  return (
    <Column modifiers={[fillMaxSize(), background(c.surface)]}>
      <ThreadAppBar
        avatar={
          <Avatar
            background={c.tertiaryContainer}
            color={c.onTertiaryContainer}
            initials={mentor.initials}
          />
        }
        title={mentor.displayName}
        subtitle="Your mentor"
        action={
          // Verify an in-person meeting (location-based).
          <IconButton onClick={() => {}}>
            <Symbol name="location_on" color={c.onSurfaceVariant} />
          </IconButton>
        }
      />

      <LazyColumn
        verticalArrangement={{ spacedBy: 8 }}
        contentPadding={{ start: 16, end: 16, top: 12, bottom: 12 }}
        modifiers={[fillMaxWidth(), weight(1)]}
      >
        {messages.map((m) => {
          if (m.kind === 'day') return <DayDivider key={m.id} label={m.label} />;
          if (m.kind === 'mission')
            return <MissionCard key={m.id} title={m.title} detail={m.detail} due={m.due} />;
          return (
            <Bubble key={m.id} fromMe={m.fromMe}>
              {m.text}
            </Bubble>
          );
        })}
      </LazyColumn>

      <Composer placeholder="Message" onSend={send} />
    </Column>
  );
}
