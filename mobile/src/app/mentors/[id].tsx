import { AssistChip, Button, Column, FlowRow, OutlinedButton, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Grow, InfoCard, Page, Paragraph, Pill, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { mentorProfiles } from '@/data/demo';

export default function MentorProfileScreen() {
  return (
    <Screen>
      <MentorProfile />
    </Screen>
  );
}

function MentorProfile() {
  const c = useMaterialColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = mentorProfiles.find((p) => p.id === id) ?? mentorProfiles[0];
  const [requested, setRequested] = useState(false);

  return (
    <Page
      title={m.displayName}
      bottom={
        m.isMine ? (
          <>
            <Grow />
            <Button onClick={() => router.push('/thread/mentor')}>
              <Text>Message</Text>
            </Button>
          </>
        ) : (
          <>
            <Grow />
            {requested ? (
              <OutlinedButton onClick={() => setRequested(false)}>
                <Text>Cancel request</Text>
              </OutlinedButton>
            ) : (
              <Button onClick={() => setRequested(true)}>
                <Text>Request as mentor</Text>
              </Button>
            )}
          </>
        )
      }
    >
      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(16, 8, 16, 8)]}>
        <Avatar background={c.tertiaryContainer} color={c.onTertiaryContainer} initials={m.initials} diameter={88} />
        <Type variant="headlineSmall" color={c.onSurface}>
          {m.displayName}
        </Type>
        <Type variant="bodyMedium" color={c.onSurfaceVariant}>
          {m.headline}
        </Type>
        <Row horizontalArrangement={{ spacedBy: 8 }}>
          <Pill label={`★ ${m.rating.toFixed(1)}`} />
          {m.score ? <Pill label={`${m.score}% match`} tone="primary" /> : null}
          {m.isMine ? <Pill label="Your mentor" tone="primary" /> : null}
          <Pill label="Verified" tone="tertiary" />
        </Row>
      </Column>

      {requested ? (
        <InfoCard tone="tertiary">
          <Type variant="bodyMedium" color={c.onTertiaryContainer}>
            {`Request sent. ${m.displayName.split(' ')[0]} usually replies within two days.`}
          </Type>
        </InfoCard>
      ) : null}

      <SectionHeader>About</SectionHeader>
      <Paragraph>{m.bio}</Paragraph>

      <SectionHeader>Expertise</SectionHeader>
      <FlowRow horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(16, 0, 16, 0)]}>
        {m.expertise.map((e) => (
          <AssistChip key={e}>
            <AssistChip.Label>
              <Text>{e}</Text>
            </AssistChip.Label>
          </AssistChip>
        ))}
      </FlowRow>

      <SectionHeader>Languages</SectionHeader>
      <Paragraph>{m.languages.join(', ')}</Paragraph>

      <SectionHeader>{`Reviews (${m.reviews.length})`}</SectionHeader>
      {m.reviews.length === 0 ? <Paragraph muted>No reviews yet.</Paragraph> : null}
      {m.reviews.map((r, i) => (
        <InfoCard key={i}>
          <Type variant="bodyLarge" color={c.onSurface}>
            {`“${r.text}”`}
          </Type>
          <Type variant="labelMedium" color={c.onSurfaceVariant}>
            {`${'★'.repeat(r.stars)} · ${r.author}`}
          </Type>
        </InfoCard>
      ))}
    </Page>
  );
}
