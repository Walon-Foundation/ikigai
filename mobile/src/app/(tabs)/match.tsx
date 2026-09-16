import { Column, FilledTonalButton, LazyColumn, ListItem, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { suggestedMentors } from '@/data/demo';

export default function MatchScreen() {
  return (
    <Screen>
      <Match />
    </Screen>
  );
}

// Not yet designed in the guide — a plain Material list until it is.
function Match() {
  const c = useMaterialColors();
  return (
    <LazyColumn modifiers={[fillMaxSize(), background(c.surface)]}>
      <Column modifiers={[padding(16, 24, 16, 8)]}>
        <Type variant="headlineMedium" color={c.onSurface}>
          Match
        </Type>
        <Type variant="bodyMedium" color={c.onSurfaceVariant}>
          You already have a mentor. These are others who share your interests.
        </Type>
      </Column>
      {suggestedMentors.map((m) => (
        <ListItem key={m.id} colors={{ containerColor: c.surface }}>
          <ListItem.LeadingContent>
            <Avatar background={c.secondaryContainer} color={c.onSecondaryContainer} initials={m.initials} />
          </ListItem.LeadingContent>
          <ListItem.HeadlineContent>
            <Type variant="bodyLarge" color={c.onSurface}>
              {m.displayName}
            </Type>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <Type variant="bodyMedium" color={c.onSurfaceVariant}>
              {`${m.focus} · ${m.score}% match`}
            </Type>
          </ListItem.SupportingContent>
          <ListItem.TrailingContent>
            <FilledTonalButton onClick={() => router.push({ pathname: '/mentors/[id]', params: { id: m.id } })}>
              <Text>View</Text>
            </FilledTonalButton>
          </ListItem.TrailingContent>
        </ListItem>
      ))}
    </LazyColumn>
  );
}
