import { Box, Text } from '@expo/ui/jetpack-compose';
import { background, clip, Shapes, size } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactNode } from 'react';
import { Type } from './Type';

/** Circular avatar holding initials, or any child such as an icon. */
export function Avatar({
  background: bg,
  color,
  initials,
  diameter = 40,
  children,
}: {
  background: string;
  color: string;
  initials?: string;
  diameter?: number;
  children?: ReactNode;
}) {
  return (
    <Box
      contentAlignment="center"
      modifiers={[size(diameter, diameter), clip(Shapes.Circle), background(bg)]}
    >
      {children ?? (
        <Type variant="titleSmall" color={color} >
          {initials}
        </Type>
      )}
    </Box>
  );
}
