import { Host } from '@expo/ui/jetpack-compose';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_SCHEME, hostSeedColor, useAppPalette } from '@/theme/colors';

/**
 * Root of every screen: a Compose <Host> themed from Ikigai green, in light
 * mode (see theme/colors.ts).
 *
 * The screens are built from Jetpack Compose components, which render on
 * Android only. iOS will get SwiftUI equivalents (and Liquid Glass via
 * expo-glass-effect) in a later pass; until then it shows a clear placeholder
 * rather than crashing.
 */
export function Screen({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'android') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          This build targets Android. The iOS version is coming.
        </Text>
      </View>
    );
  }
  return <AndroidScreen>{children}</AndroidScreen>;
}

function AndroidScreen({ children }: { children: ReactNode }) {
  // Edge-to-edge is on, so content would sit under the status bar. The bottom is
  // left alone: native tabs inset themselves, and pushed screens pad their own
  // bottom bars.
  const insets = useSafeAreaInsets();
  // Outside the Host, so resolve the same palette it will use to paint the strip.
  const surface = useAppPalette()?.surface;
  return (
    <View style={[styles.host, { paddingTop: insets.top, backgroundColor: surface }]}>
      <Host style={styles.host} seedColor={hostSeedColor} colorScheme={APP_SCHEME}>
        {children}
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholderText: { fontSize: 16, textAlign: 'center' },
});
