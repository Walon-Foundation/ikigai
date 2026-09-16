import { Column, FilledTonalButton, LazyColumn, ListItem, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { BrandHero } from '@/components/BrandHero';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { suggestedMentors } from '@/data/demo';
import { accentFor } from '@/theme/brand';

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
      <BrandHero
        eyebrow="Match"
        title="Mentors like you"
        subtitle="You already have Fatmata. These mentors share your interests too."
      />
      {suggestedMentors.map((m) => (
        <ListItem key={m.id} colors={{ containerColor: c.surface }}>
          <ListItem.LeadingContent>
            <Avatar background={accentFor(m.displayName).strong} initials={m.initials} diameter={48} />
          </ListItem.LeadingContent>
          <ListItem.HeadlineContent>
            <Type variant="bodyLarge" color={c.onSurface}>
              {m.displayName}
            </Type>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <Type variant="bodyMedium" color={c.onSurfaceVariant}>
              {m.focus}
            </Type>
            <Type variant="labelLarge" color={accentFor(m.displayName).strong}>
              {`${m.score}% match`}
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
