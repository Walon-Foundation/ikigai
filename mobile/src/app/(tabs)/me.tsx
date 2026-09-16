import { Column, LazyColumn, ListItem, Row, useMaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, padding } from '@expo/ui/jetpack-compose/modifiers';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';
import { me } from '@/data/demo';

export default function MeScreen() {
  return (
    <Screen>
      <Profile />
    </Screen>
  );
}

// Not yet designed in the guide — a plain Material settings list until it is.
function Profile() {
  const c = useMaterialColors();
  const rows: { icon: string; title: string; detail: string }[] = [
    { icon: 'notifications', title: 'Notifications', detail: 'Push, email, and what you hear about' },
    { icon: 'lock', title: 'Journal privacy', detail: 'New entries are private by default' },
    { icon: 'download', title: 'Download your data', detail: 'Everything you have on Ikigai' },
    { icon: 'health_and_safety', title: 'Safety', detail: 'Report a concern or get help' },
  ];
  return (
    <LazyColumn modifiers={[fillMaxSize(), background(c.surface)]}>
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 24, 16, 16)]}>
        <Avatar background={c.tertiaryContainer} color={c.onTertiaryContainer} initials={me.initials} diameter={64} />
        <Column>
          <Type variant="headlineSmall" color={c.onSurface}>
            {me.displayName}
          </Type>
          <Type variant="bodyMedium" color={c.onSurfaceVariant}>
            {`Thrive · week ${me.weekInStage}`}
          </Type>
        </Column>
      </Row>
      {rows.map((r) => (
        <ListItem key={r.title} colors={{ containerColor: c.surface }}>
          <ListItem.LeadingContent>
            <Symbol name={r.icon} color={c.onSurfaceVariant} />
          </ListItem.LeadingContent>
          <ListItem.HeadlineContent>
            <Type variant="bodyLarge" color={c.onSurface}>
              {r.title}
            </Type>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <Type variant="bodyMedium" color={c.onSurfaceVariant}>
              {r.detail}
            </Type>
          </ListItem.SupportingContent>
        </ListItem>
      ))}
    </LazyColumn>
  );
}
