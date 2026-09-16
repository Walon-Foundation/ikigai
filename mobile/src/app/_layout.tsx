import { Stack } from 'expo-router';

// Tabs sit at the root; threads push on top of them, so a thread has no tab bar
// and the system back gesture returns to the list it came from.
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
