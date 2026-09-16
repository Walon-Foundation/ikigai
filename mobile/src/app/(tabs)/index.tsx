import {
  Box,
  Card,
  Column,
  ExtendedFloatingActionButton,
  LazyColumn,
  ListItem,
  Row,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  align,
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  size,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Symbol } from '@/components/Symbol';
import { Type } from '@/components/Type';
import { type ChatSummary, chats, me } from '@/data/demo';

export default function ChatsScreen() {
  return (
    <Screen>
      <Chats />
    </Screen>
  );
}

function Chats() {
  const c = useMaterialColors();

  return (
    <Box modifiers={[fillMaxSize(), background(c.surface)]}>
      <LazyColumn modifiers={[fillMaxSize()]}>
        {/* search */}
        <Row
          verticalAlignment="center"
          horizontalArrangement={{ spacedBy: 16 }}
          modifiers={[
            padding(16, 16, 16, 4),
            fillMaxWidth(),
            height(56),
            clip(Shapes.RoundedCorner(28)),
            background(c.surfaceContainerHigh),
            padding(16, 0, 8, 0),
          ]}
        >
          <Symbol name="search" color={c.onSurfaceVariant} />
          <Box modifiers={[weight(1)]}>
            <Type variant="bodyLarge" color={c.onSurfaceVariant}>
              Search chats
            </Type>
          </Box>
          <Avatar
            background={c.tertiaryContainer}
            color={c.onTertiaryContainer}
            initials={me.initials}
            diameter={32}
          />
        </Row>

        <Box modifiers={[padding(16, 12, 16, 8)]}>
          <Type variant="headlineMedium" color={c.onSurface}>
            Chats
          </Type>
        </Box>

        {/* the growth tree, pinned */}
        <Box modifiers={[padding(16, 0, 16, 8)]}>
          <Card
            colors={{ containerColor: c.primaryContainer }}
            modifiers={[fillMaxWidth(), clickable(() => router.push('/thread/tree'))]}
          >
            <Row
              verticalAlignment="center"
              horizontalArrangement={{ spacedBy: 16 }}
              modifiers={[paddingAll(16)]}
            >
              <Avatar background={c.primary} color={c.onPrimary} diameter={48}>
                <Symbol name="forest" color={c.onPrimary} size={28} />
              </Avatar>
              <Column modifiers={[weight(1)]}>
                <Type variant="titleMedium" color={c.onPrimaryContainer}>
                  Your tree
                </Type>
                <Type variant="bodyMedium" color={c.onPrimaryContainer}>
                  One more milestone and you grow a new branch.
                </Type>
              </Column>
            </Row>
          </Card>
        </Box>

        {chats.map((chat) => (
          <ChatRow key={chat.id} chat={chat} />
        ))}

        {/* room for the floating button to never cover the last row */}
        <Box modifiers={[height(96)]} />
      </LazyColumn>

      <ExtendedFloatingActionButton
        onClick={() => router.push('/thread/journal')}
        modifiers={[align('bottomEnd'), padding(0, 0, 16, 16)]}
      >
        <ExtendedFloatingActionButton.Icon>
          <Symbol name="edit" color={c.onPrimaryContainer} />
        </ExtendedFloatingActionButton.Icon>
        <ExtendedFloatingActionButton.Text>
          <Text>New entry</Text>
        </ExtendedFloatingActionButton.Text>
      </ExtendedFloatingActionButton>
    </Box>
  );
}

function ChatRow({ chat }: { chat: ChatSummary }) {
  const c = useMaterialColors();
  const open = chat.href ? () => router.push(chat.href!) : undefined;

  const leading =
    chat.kind === 'mentor' ? (
      <Avatar background={c.tertiaryContainer} color={c.onTertiaryContainer} initials={chat.initials} />
    ) : chat.kind === 'club' ? (
      <Avatar background={c.secondaryContainer} color={c.onSecondaryContainer} initials={chat.initials} />
    ) : (
      <Avatar background={c.surfaceContainerHighest} color={c.onSurfaceVariant}>
        <Symbol name={chat.icon ?? 'chat'} color={c.onSurfaceVariant} />
      </Avatar>
    );

  return (
    <ListItem
      colors={{ containerColor: c.surface }}
      modifiers={open ? [clickable(open)] : []}
    >
      <ListItem.LeadingContent>{leading}</ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Type variant="bodyLarge" color={c.onSurface} maxLines={1}>
          {chat.title}
        </Type>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Type variant="bodyMedium" color={c.onSurfaceVariant} maxLines={1}>
          {chat.preview}
        </Type>
      </ListItem.SupportingContent>
      <ListItem.TrailingContent>
        <Column horizontalAlignment="end" verticalArrangement={{ spacedBy: 6 }}>
          <Type
            variant="labelSmall"
            color={chat.unread ? c.primary : c.onSurfaceVariant}
          >
            {chat.time}
          </Type>
          {chat.unread ? (
            <Box
              contentAlignment="center"
              modifiers={[size(20, 20), clip(Shapes.Circle), background(c.primary)]}
            >
              <Type variant="labelSmall" color={c.onPrimary}>
                {String(chat.unread)}
              </Type>
            </Box>
          ) : null}
        </Column>
      </ListItem.TrailingContent>
    </ListItem>
  );
}
