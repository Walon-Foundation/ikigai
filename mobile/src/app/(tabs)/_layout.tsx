import { NativeTabs } from 'expo-router/unstable-native-tabs';

/**
 * The real platform tab bar: Material 3 NavigationBar on Android, UITabBar on
 * iOS. Icons are Material Symbols by name — outlined by default, filled when
 * selected — so no icon assets ship with the app.
 */
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="chat" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="journey">
        <NativeTabs.Trigger.Label>Journey</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="leaf" md="potted_plant" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="match">
        <NativeTabs.Trigger.Label>Match</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="handshake" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
