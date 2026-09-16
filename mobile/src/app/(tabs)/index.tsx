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
import { BrandHero, ON_BRAND_FAINT, ON_BRAND_MUTED } from '@/components/BrandHero';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { type ChatSummary, chats, me } from '@/data/demo';
import { BRAND } from '@/theme/brand';

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
        <BrandHero
          eyebrow="Ikigai"
          title={`Kushe, ${me.displayName}`}
          subtitle={`Thrive · week ${me.weekInStage} · 4-day journal streak`}
          trailing={
            <Box
              contentAlignment="center"
              modifiers={[size(40, 40), clip(Shapes.Circle), background(ON_BRAND_FAINT), clickable(() => router.push('/notifications'))]}
            >
              <Glyph name="notifications" color={BRAND.onBrand} size={22} />
            </Box>
          }
        >
          <Row
            verticalAlignment="center"
            horizontalArrangement={{ spacedBy: 12 }}
            modifiers={[fillMaxWidth(), height(48), clip(Shapes.RoundedCorner(24)), background(ON_BRAND_FAINT), padding(16, 0, 16, 0)]}
          >
            <Glyph name="search" color={ON_BRAND_MUTED} size={22} />
            <Type variant="bodyLarge" color={ON_BRAND_MUTED}>
              Search chats
            </Type>
          </Row>
        </BrandHero>

        {/* the growth tree, pinned */}
        <Box modifiers={[padding(12, 4, 12, 8)]}>
          <Card
            colors={{ containerColor: BRAND.sunSoft }}
            modifiers={[fillMaxWidth(), clickable(() => router.push('/thread/tree'))]}
          >
            <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }} modifiers={[paddingAll(16)]}>
              <Avatar background={BRAND.sun} color={BRAND.greenDeep} diameter={48}>
                <Glyph name="forest" color={BRAND.greenDeep} size={28} />
              </Avatar>
              <Column modifiers={[weight(1)]}>
                <Type variant="titleMedium" color={BRAND.greenDeep}>
                  Your tree
                </Type>
                <Type variant="bodyMedium" color={BRAND.greenDeep}>
                  One more milestone and you grow a new branch.
                </Type>
              </Column>
              <Glyph name="chevron_right" color={BRAND.greenDeep} />
            </Row>
          </Card>
        </Box>

        <Box modifiers={[padding(20, 8, 16, 4)]}>
          <Type variant="titleMedium" color={c.onSurface}>
            Conversations
          </Type>
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
          <Glyph name="edit" color={c.onPrimaryContainer} />
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
      <Avatar background={BRAND.orange} color={BRAND.onBrand} initials={chat.initials} />
    ) : chat.kind === 'club' ? (
      <Avatar background={BRAND.teal} color={BRAND.onBrand} initials={chat.initials} />
    ) : (
      <Avatar background={chat.kind === 'journal' ? BRAND.leafSoft : BRAND.orangeSoft}>
        <Glyph name={chat.icon ?? 'chat'} color={chat.kind === 'journal' ? BRAND.leaf : BRAND.orange} />
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
