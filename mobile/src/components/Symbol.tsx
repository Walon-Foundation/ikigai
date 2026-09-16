import { Icon, Spacer } from '@expo/ui/jetpack-compose';
import { size as sizeModifier } from '@expo/ui/jetpack-compose/modifiers';
import { type AndroidSymbol, unstable_getMaterialSymbolSourceAsync } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

/**
 * A Material Symbol by name, rendered as a Compose Icon.
 *
 * Uses the same loader expo-router's native tabs use, so icons need no asset
 * files and match the navigation bar exactly. The source resolves
 * asynchronously; a same-sized spacer holds the layout meanwhile so rows do not
 * jump when the glyph arrives.
 */
export function Symbol({
  name,
  color,
  size = 24,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const [source, setSource] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    let alive = true;
    unstable_getMaterialSymbolSourceAsync(name as AndroidSymbol, size, color).then((s) => {
      if (alive) setSource(s);
    });
    return () => {
      alive = false;
    };
  }, [name, size, color]);

  if (!source) return <Spacer modifiers={[sizeModifier(size, size)]} />;
  return <Icon source={source} tint={color} modifiers={[sizeModifier(size, size)]} />;
}
