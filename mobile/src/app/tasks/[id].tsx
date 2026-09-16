import {
  Button,
  Column,
  OutlinedButton,
  RadioButton,
  Row,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Field, Grow, InfoCard, NavRow, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { taskDetail as task } from '@/data/demo';

export default function TaskScreen() {
  return (
    <Screen>
      <Task />
    </Screen>
  );
}

// A mentor-assigned task: short test, reflection, and photo evidence.
function Task() {
  const c = useMaterialColors();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [photo, setPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const answeredAll = task.questions.every((q) => answers[q.id] !== undefined);
  const ready = answeredAll && (!task.requiresEvidence || photo);

  if (submitted) {
    return (
      <Page
        title="Submitted"
        bottom={
          <>
            <Grow />
            <Button onClick={() => router.back()}>
              <Text>Back to chat</Text>
            </Button>
          </>
        }
      >
        <InfoCard tone="primary">
          <Glyph name="task_alt" color={c.onPrimaryContainer} />
          <Type variant="titleLarge" color={c.onPrimaryContainer}>
            Sent to Fatmata
          </Type>
          <Type variant="bodyLarge" color={c.onPrimaryContainer}>
            She will review it and tick the milestone off. You will get a notification.
          </Type>
        </InfoCard>
      </Page>
    );
  }

  return (
    <Page
      title="Mission"
      subtitle={`From ${task.from} · due ${task.due}`}
      bottom={
        <>
          <Grow />
          <Button enabled={ready} onClick={() => setSubmitted(true)}>
            <Text>Submit</Text>
          </Button>
        </>
      }
    >
      <InfoCard>
        <Type variant="titleLarge" color={c.onSurface}>
          {task.title}
        </Type>
        <Type variant="bodyLarge" color={c.onSurfaceVariant}>
          {task.description}
        </Type>
      </InfoCard>

      <SectionHeader>Quick check</SectionHeader>
      {task.questions.map((q) => (
        <Column key={q.id} modifiers={[fillMaxWidth(), padding(0, 4, 0, 8)]}>
          <Paragraph>{q.prompt}</Paragraph>
          {q.options.map((option, i) => (
            <Row
              key={option}
              verticalAlignment="center"
              modifiers={[fillMaxWidth(), clickable(() => setAnswers((a) => ({ ...a, [q.id]: i }))), padding(8, 0, 16, 0)]}
            >
              <RadioButton selected={answers[q.id] === i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))} />
              <Row modifiers={[weight(1)]}>
                <Type variant="bodyLarge" color={c.onSurface}>
                  {option}
                </Type>
              </Row>
            </Row>
          ))}
        </Column>
      ))}

      <SectionHeader>What did you learn?</SectionHeader>
      <Field label="Your reflection" multiline />

      <SectionHeader>Evidence</SectionHeader>
      <NavRow
        icon={photo ? 'check_circle' : 'photo_camera'}
        title={photo ? 'Photo attached' : 'Photo of your notes'}
        detail="Only you and your mentor can see it"
        trailing={
          <OutlinedButton onClick={() => setPhoto(!photo)}>
            <Text>{photo ? 'Retake' : 'Take photo'}</Text>
          </OutlinedButton>
        }
      />
    </Page>
  );
}
