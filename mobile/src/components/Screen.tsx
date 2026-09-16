import { Host } from '@expo/ui/jetpack-compose';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { hostSeedColor } from '@/theme/colors';

/**
 * Root of every screen: a Compose <Host> themed with Material You (or brand
 * green on phones without it — see theme/colors.ts).
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

  return (
    <Host style={styles.host} seedColor={hostSeedColor}>
      {children}
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholderText: { fontSize: 16, textAlign: 'center' },
});
