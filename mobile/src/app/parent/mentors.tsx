import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { NavRow, Page, Paragraph, Pill } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { mentorProfiles } from '@/data/demo';

export default function ParentMentorsScreen() {
  return (
    <Screen>
      <ParentMentors />
    </Screen>
  );
}

function ParentMentors() {
  const c = useMaterialColors();
  return (
    <Page title="Mentors">
      <Paragraph muted>Every mentor on Ikigai has shown ID and agreed to the safeguarding code.</Paragraph>
      {mentorProfiles.map((m) => (
        <NavRow
          key={m.id}
          leading={<Avatar background={c.secondaryContainer} color={c.onSecondaryContainer} initials={m.initials} />}
          title={m.displayName}
          detail={`${m.headline} · ★ ${m.rating.toFixed(1)}`}
          trailing={m.isMine ? <Pill label="Aminata's mentor" tone="primary" /> : undefined}
          onPress={() => router.push({ pathname: '/mentors/[id]', params: { id: m.id } })}
        />
      ))}
    </Page>
  );
}
