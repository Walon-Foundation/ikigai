import { Text, type TextProps } from '@expo/ui/jetpack-compose';

type TypographyStyle = NonNullable<NonNullable<TextProps['style']>['typography']>;

/**
 * Text set in a Material 3 type-scale role.
 *
 * Every piece of text in the app goes through a role rather than a raw font
 * size, so it follows the user's system font scaling — which matters for an
 * audience where many people set larger text on small phones.
 */
export function Type({
  variant,
  color,
  maxLines,
  children,
}: {
  variant: TypographyStyle;
  color?: string;
  maxLines?: number;
  children?: React.ReactNode;
}) {
  return (
    <Text
      color={color}
      maxLines={maxLines}
      overflow={maxLines ? 'ellipsis' : undefined}
      style={{ typography: variant }}
    >
      {children}
    </Text>
  );
}
