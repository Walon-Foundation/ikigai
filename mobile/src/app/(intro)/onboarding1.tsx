import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';

export default function Onboarding1() {
  return (
    <Screen>
      <Slide />
    </Screen>
  );
}

// Ikigai: where what you love, what you're good at, what the world needs and
// what you can be paid for meet. The four orbits are those four circles.
function Slide() {
  useMaterialColors();
  return (
    <IntroSlide
      step={1}
      eyebrow="Welcome to Ikigai"
      title="Find your reason for being"
      body="Where what you love, what you are good at, and what your community needs all meet."
      next="/onboarding2"
      art={
        <ArtDisc icon="potted_plant">
          <Orbit icon="favorite" x={-104} y={-96} tone="tertiary" />
          <Orbit icon="star" x={104} y={-96} tone="secondary" />
          <Orbit icon="diversity_3" x={-104} y={96} tone="secondary" />
          <Orbit icon="payments" x={104} y={96} tone="tertiary" />
        </ArtDisc>
      }
    />
  );
}
