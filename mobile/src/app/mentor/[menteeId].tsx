import {
  AlertDialog,
  Button,
  Column,
  IconButton,
  LinearProgressIndicator,
  ModalBottomSheet,
  OutlinedButton,
  Row,
  Switch,
  Text,
  TextButton,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Field, Grow, InfoCard, NavRow, Page, Paragraph, Pill, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { curriculum, mentorMentees, pendingReviews, stages, thriveMilestones } from '@/data/demo';

export default function MenteeDetailScreen() {
  return (
    <Screen>
      <MenteeDetail />
    </Screen>
  );
}

function MenteeDetail() {
  const c = useMaterialColors();
  const { menteeId } = useLocalSearchParams<{ menteeId: string }>();
  const mentee = mentorMentees.find((m) => m.id === menteeId) ?? mentorMentees[0];
  const [reviews, setReviews] = useState(pendingReviews.filter((r) => r.menteeId === mentee.id));
  const [assigning, setAssigning] = useState(false);
  const [needsPhoto, setNeedsPhoto] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [stage, setStage] = useState(mentee.stage);

  const stageIndex = stages.findIndex((s) => s.id === stage);
  const nextStage = stages[stageIndex + 1];
  const stageLabel = stages[stageIndex].label;

  return (
    <Page
      title={mentee.name}
      subtitle={`${stageLabel} · active ${mentee.lastActive}`}
      action={
        <IconButton onClick={() => router.push('/thread/mentor')}>
          <Glyph name="chat" color={c.onSurfaceVariant} />
        </IconButton>
      }
      bottom={
        <>
          <OutlinedButton enabled={!!nextStage} onClick={() => setPromoting(true)}>
            <Text>{nextStage ? `Move to ${nextStage.label}` : 'Final stage'}</Text>
          </OutlinedButton>
          <Grow />
          <Button onClick={() => setAssigning(true)}>
            <Text>Assign task</Text>
          </Button>
        </>
      }
    >
      <InfoCard>
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
          <Avatar background={c.tertiaryContainer} color={c.onTertiaryContainer} initials={mentee.initials} />
          <Type variant="titleMedium" color={c.onSurface}>
            {`${mentee.percent}% of the roadmap`}
          </Type>
        </Row>
        <LinearProgressIndicator progress={mentee.percent / 100} color={c.primary} modifiers={[fillMaxWidth()]} />
      </InfoCard>

      <SectionHeader>{`To review (${reviews.length})`}</SectionHeader>
      {reviews.length === 0 ? <Paragraph muted>Nothing waiting.</Paragraph> : null}
      {reviews.map((r) => (
        <InfoCard key={r.id} tone="tertiary">
          <Type variant="titleMedium" color={c.onTertiaryContainer}>
            {r.milestone}
          </Type>
          <Type variant="bodyMedium" color={c.onTertiaryContainer}>
            {`${r.evidence} · ${r.submitted}`}
          </Type>
          <Row horizontalArrangement={{ spacedBy: 8 }}>
            <Button onClick={() => setReviews((l) => l.filter((x) => x.id !== r.id))}>
              <Text>Approve</Text>
            </Button>
            <OutlinedButton onClick={() => setReviews((l) => l.filter((x) => x.id !== r.id))}>
              <Text>Ask to redo</Text>
            </OutlinedButton>
          </Row>
        </InfoCard>
      ))}

      <SectionHeader>{`${stageLabel} milestones`}</SectionHeader>
      {thriveMilestones.map((m) => (
        <NavRow
          key={m.id}
          icon={m.done ? 'check_circle' : 'radio_button_unchecked'}
          title={m.label}
          trailing={m.due ? <Pill label={`due ${m.due}`} /> : undefined}
        />
      ))}

      <SectionHeader>Curriculum</SectionHeader>
      {curriculum.map((item) => (
        <NavRow
          key={item.id}
          icon={item.status === 'done' ? 'check_circle' : item.status === 'in_progress' ? 'pending' : 'radio_button_unchecked'}
          title={item.title}
          detail={item.target ? `target ${item.target}` : undefined}
        />
      ))}

      {assigning ? (
        <ModalBottomSheet onDismissRequest={() => setAssigning(false)}>
          <Column modifiers={[fillMaxWidth(), padding(0, 0, 0, 24)]}>
            <Paragraph>{`New task for ${mentee.name.split(' ')[0]}`}</Paragraph>
            <Field label="Title" />
            <Field label="What should they do?" multiline />
            <Field label="Due" supporting="e.g. Friday" />
            <NavRow title="Needs photo evidence" trailing={<Switch value={needsPhoto} onCheckedChange={setNeedsPhoto} />} />
            <Row modifiers={[fillMaxWidth(), padding(16, 8, 16, 0)]} horizontalArrangement={{ spacedBy: 8 }}>
              <Grow />
              <TextButton onClick={() => setAssigning(false)}>
                <Text>Cancel</Text>
              </TextButton>
              <Button onClick={() => setAssigning(false)}>
                <Text>Send to chat</Text>
              </Button>
            </Row>
          </Column>
        </ModalBottomSheet>
      ) : null}

      {promoting && nextStage ? (
        <AlertDialog onDismissRequest={() => setPromoting(false)}>
          <AlertDialog.Title>
            <Text>{`Move ${mentee.name.split(' ')[0]} to ${nextStage.label}?`}</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>They will be told, and their guardian can see the change. You cannot move them back.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              onClick={() => {
                setStage(nextStage.id);
                setPromoting(false);
              }}
            >
              <Text>Move on</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setPromoting(false)}>
              <Text>Not yet</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </Page>
  );
}
