import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';

export default function Onboarding3() {
  return (
    <Screen>
      <Slide />
    </Screen>
  );
}

function Slide() {
  useMaterialColors();
  return (
    <IntroSlide
      step={3}
      eyebrow="Your journey"
      title="Watch yourself grow"
      body="Discover, Thrive, Build, Lead. Every milestone, club and event grows a new branch on your tree."
      next="/onboarding4"
      art={
        <ArtDisc icon="forest" tone="secondary">
          <Orbit icon="flag" x={-112} y={-40} tone="tertiary" />
          <Orbit icon="groups" x={100} y={-100} tone="surface" />
          <Orbit icon="event" x={96} y={100} tone="tertiary" />
        </ArtDisc>
      }
    />
  );
}
