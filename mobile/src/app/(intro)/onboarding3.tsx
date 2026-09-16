import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/theme/brand';

export default function Onboarding3() {
  return (
    <Screen>
      <IntroSlide
        step={3}
        accent={{ strong: BRAND.teal, soft: BRAND.tealSoft }}
        eyebrow="Your journey"
        title="Grow one step at a time"
        body="Move through four stages — Discover, Thrive, Build and Lead. Join clubs and events, set goals, and watch your tree grow."
      next="/onboarding4"
        art={
        <ArtDisc accent={{ strong: BRAND.teal, soft: BRAND.tealSoft }} icon="forest">
          <Orbit icon="flag" x={-120} y={-40} color={BRAND.orange} />
          <Orbit icon="groups" x={104} y={-104} color={BRAND.leaf} />
          <Orbit icon="event" x={100} y={104} color={BRAND.sun} />
        </ArtDisc>
        }
      />
    </Screen>
  );
}
