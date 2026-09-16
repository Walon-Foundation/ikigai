import { FilledTonalButton, OutlinedButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { NavRow, Page, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { clubs } from '@/data/demo';

export default function ClubsScreen() {
  return (
    <Screen>
      <Clubs />
    </Screen>
  );
}

function Clubs() {
  const c = useMaterialColors();
  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('');
  const row = (club: (typeof clubs)[number]) => (
    <NavRow
      key={club.id}
      leading={<Avatar background={c.secondaryContainer} color={c.onSecondaryContainer} initials={initials(club.name)} />}
      title={club.name}
      detail={`${club.members} members · ${club.tags.join(', ')}`}
      onPress={() => router.push({ pathname: '/groups/[id]', params: { id: club.id } })}
      trailing={
        club.joined ? (
          <FilledTonalButton onClick={() => router.push({ pathname: '/groups/[id]', params: { id: club.id } })}>
            <Text>Open</Text>
          </FilledTonalButton>
        ) : (
          <OutlinedButton onClick={() => router.push({ pathname: '/groups/[id]', params: { id: club.id } })}>
            <Text>View</Text>
          </OutlinedButton>
        )
      }
    />
  );
  return (
    <Page title="Clubs">
      <SectionHeader>Your clubs</SectionHeader>
      {clubs.filter((cl) => cl.joined).map(row)}
      <SectionHeader>Discover</SectionHeader>
      {clubs.filter((cl) => !cl.joined).map(row)}
    </Page>
  );
}
