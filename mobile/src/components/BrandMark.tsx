import { Image } from '@expo/ui/jetpack-compose';
import { size as sizeModifier } from '@expo/ui/jetpack-compose/modifiers';

const COIN = require('../../assets/brand/mark-coin.png');
const MARK = require('../../assets/brand/mark.png');

/**
 * The Ikigai mark — swirl and sun — as a Compose image. `coin` puts it on a
 * white disc, which keeps the green segment readable on green backgrounds.
 */
export function BrandMark({ size = 40, coin = false }: { size?: number; coin?: boolean }) {
  return (
    <Image
      source={coin ? COIN : MARK}
      contentDescription="Ikigai"
      contentScale="fit"
      modifiers={[sizeModifier(size, size)]}
    />
  );
}
