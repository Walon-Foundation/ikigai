import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';

export default function Onboarding4() {
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
      step={4}
      eyebrow="Safe and yours"
      title="Built to keep you safe"
      body="Every mentor is verified. Your journal is private unless you share it. Help is one tap away."
      art={
        <ArtDisc icon="verified_user">
          <Orbit icon="lock" x={-108} y={80} tone="secondary" />
          <Orbit icon="family_restroom" x={108} y={-80} tone="tertiary" />
        </ArtDisc>
      }
    />
  );
}
