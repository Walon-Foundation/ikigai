import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';

export default function Onboarding2() {
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
      step={2}
      eyebrow="Mentorship"
      title="A mentor who has been there"
      body="Get matched with someone from Sierra Leone who shares your interests. Chat, take on missions, and meet in person."
      next="/onboarding3"
      art={
        <ArtDisc icon="handshake" tone="tertiary">
          <Orbit icon="chat" x={-108} y={-84} tone="surface" />
          <Orbit icon="assignment" x={112} y={40} tone="secondary" />
        </ArtDisc>
      }
    />
  );
}
