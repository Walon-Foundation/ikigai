import { Badge, TextButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { NavRow, Page, Paragraph } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { notifications as demo } from '@/data/demo';

export default function NotificationsScreen() {
  return (
    <Screen>
      <Notifications />
    </Screen>
  );
}

// Live over the socket's `notification` event; this is the feed behind it.
function Notifications() {
  const c = useMaterialColors();
  const [items, setItems] = useState(demo);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Page
      title="Notifications"
      subtitle={unread ? `${unread} unread` : 'All caught up'}
      action={
        unread ? (
          <TextButton onClick={() => setItems((l) => l.map((n) => ({ ...n, read: true })))}>
            <Text>Mark all read</Text>
          </TextButton>
        ) : undefined
      }
    >
      {items.length === 0 ? <Paragraph muted>Nothing yet.</Paragraph> : null}
      {items.map((n) => (
        <NavRow
          key={n.id}
          leading={
            <Avatar
              background={n.read ? c.surfaceContainerHighest : c.primaryContainer}
              color={n.read ? c.onSurfaceVariant : c.onPrimaryContainer}
            >
              <Glyph name={n.icon} color={n.read ? c.onSurfaceVariant : c.onPrimaryContainer} />
            </Avatar>
          }
          title={n.title}
          detail={n.body}
          onPress={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
          trailing={
            n.read ? (
              <Type variant="labelSmall" color={c.onSurfaceVariant}>
                {n.time}
              </Type>
            ) : (
              <Badge />
            )
          }
        />
      ))}
    </Page>
  );
}
