import { Stack } from 'expo-router';
import { useAppPalette } from '@/theme/colors';

// Tabs sit at the root; threads push on top of them, so a thread has no tab bar
// and the system back gesture returns to the list it came from.
export default function RootLayout() {
  const c = useAppPalette();
  // The container behind each screen, painted in the screens' own surface color
  // so a push or a tab switch never flashes a different theme first.
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c?.surface } }} />;
}
