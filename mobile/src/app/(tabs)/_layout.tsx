import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAppPalette } from '@/theme/colors';

/**
 * The real platform tab bar: Material 3 NavigationBar on Android, UITabBar on
 * iOS. Icons are Material Symbols by name — outlined by default, filled when
 * selected — so no icon assets ship with the app.
 *
 * Colored from the same Material palette the screens' Compose Hosts use.
 * Left to its defaults, the bar and each tab's container painted in a different
 * theme and visibly faded over to the screen's colors on every tab switch.
 */
export default function TabsLayout() {
  const c = useAppPalette();
  return (
    <NativeTabs
      backgroundColor={c?.surfaceContainer}
      indicatorColor={c?.secondaryContainer}
      rippleColor={c?.onSurfaceVariant}
      iconColor={{ default: c?.onSurfaceVariant, selected: c?.onSecondaryContainer }}
      labelStyle={{ default: { color: c?.onSurfaceVariant }, selected: { color: c?.onSurface } }}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: c?.surface }}>
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="chat" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="journey" contentStyle={{ backgroundColor: c?.surface }}>
        <NativeTabs.Trigger.Label>Journey</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="leaf" md="potted_plant" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="match" contentStyle={{ backgroundColor: c?.surface }}>
        <NativeTabs.Trigger.Label>Match</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="handshake" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me" contentStyle={{ backgroundColor: c?.surface }}>
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
