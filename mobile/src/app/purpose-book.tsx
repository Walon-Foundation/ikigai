import { AssistChip, FlowRow, IconButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { InfoCard, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';
import { purposeBook } from '@/data/demo';

export default function PurposeBookScreen() {
  return (
    <Screen>
      <PurposeBook />
    </Screen>
  );
}

function PurposeBook() {
  const c = useMaterialColors();
  const chips = (items: string[]) => (
    <FlowRow horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(16, 0, 16, 0)]}>
      {items.map((i) => (
        <AssistChip key={i}>
          <AssistChip.Label>
            <Text>{i}</Text>
          </AssistChip.Label>
        </AssistChip>
      ))}
    </FlowRow>
  );

  return (
    <Page
      title="Purpose book"
      action={
        <IconButton onClick={() => {}}>
          <Symbol name="share" color={c.onSurfaceVariant} />
        </IconButton>
      }
    >
      <InfoCard tone="primary">
        <Type variant="labelLarge" color={c.onPrimaryContainer}>
          My purpose statement
        </Type>
        <Type variant="bodyLarge" color={c.onPrimaryContainer}>
          {purposeBook.statement}
        </Type>
      </InfoCard>

      <SectionHeader>My life vision</SectionHeader>
      <Paragraph>{purposeBook.lifeVision}</Paragraph>

      <SectionHeader>What I love</SectionHeader>
      {chips(purposeBook.interests)}

      <SectionHeader>What matters to me</SectionHeader>
      {chips(purposeBook.values)}

      <SectionHeader>How I work</SectionHeader>
      <Paragraph>{purposeBook.personalityLabel}</Paragraph>
    </Page>
  );
}
