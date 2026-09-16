import { Column, LazyColumn, Row, useMaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, padding } from '@expo/ui/jetpack-compose/modifiers';
import { type Href, router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { NavRow, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { me, notifications } from '@/data/demo';

export default function MeScreen() {
  return (
    <Screen>
      <Profile />
    </Screen>
  );
}

type Link = { icon: string; title: string; detail?: string; href: Href };

const unread = notifications.filter((n) => !n.read).length;

const sections: { title: string; links: Link[] }[] = [
  {
    title: 'Your growth',
    links: [
      { icon: 'auto_stories', title: 'Purpose book', detail: 'Who you are and where you are going', href: '/purpose-book' },
      { icon: 'flag', title: 'Goals', detail: 'Small steps you set yourself', href: '/goals' },
      { icon: 'map', title: 'Our plan', detail: 'Curriculum and meetings with your mentor', href: '/mentorship/plan' },
      { icon: 'groups', title: 'Clubs', href: '/groups' },
      { icon: 'event', title: 'Activities', href: '/activities' },
    ],
  },
  {
    title: 'Support',
    links: [
      { icon: 'volunteer_activism', title: 'Pad Her Power', detail: 'Free pads and clinics near you', href: '/pad-her-power' },
      { icon: 'health_and_safety', title: 'Safety', detail: 'Report a concern or get help', href: '/safety' },
      { icon: 'family_restroom', title: 'Family', detail: 'Link a parent or guardian', href: '/family' },
    ],
  },
  {
    title: 'Account',
    links: [
      { icon: 'notifications', title: 'Notifications', detail: unread ? `${unread} unread` : undefined, href: '/notifications' },
      { icon: 'settings', title: 'Settings', detail: 'Notifications, privacy, your data', href: '/settings' },
    ],
  },
  {
    // Demo only: jump into the flows and portals a mentee would never see.
    title: 'Demo: other views',
    links: [
      { icon: 'waving_hand', title: 'Profile setup', detail: 'Role, ikigai questions, verification', href: '/onboarding' },
      { icon: 'school', title: 'Mentor portal', href: '/mentor' },
      { icon: 'family_restroom', title: 'Parent portal', href: '/parent' },
    ],
  },
];

function Profile() {
  const c = useMaterialColors();
  return (
    <LazyColumn modifiers={[fillMaxSize(), background(c.surface)]}>
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 24, 16, 8)]}>
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
      {sections.map((section) => (
        <Column key={section.title}>
          <SectionHeader>{section.title}</SectionHeader>
          {section.links.map((l) => (
            <NavRow key={l.title} icon={l.icon} title={l.title} detail={l.detail} onPress={() => router.push(l.href)} />
          ))}
        </Column>
      ))}
    </LazyColumn>
  );
}
