import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/theme/brand';

export default function Onboarding1() {
  return (
    <Screen>
      <IntroSlide
        step={1}
        accent={{ strong: BRAND.green, soft: BRAND.leafSoft }}
        eyebrow="Welcome to Ikigai"
        title="Find your reason for being"
        body="Ikigai helps young people in Sierra Leone discover what they love, what they are good at, and how they can serve their community."
      next="/onboarding2"
        art={
        <ArtDisc accent={{ strong: BRAND.green, soft: BRAND.leafSoft }}>
          <Orbit icon="favorite" x={-112} y={-100} color={BRAND.orange} />
          <Orbit icon="star" x={112} y={-100} color={BRAND.sun} />
          <Orbit icon="diversity_3" x={-112} y={100} color={BRAND.teal} />
          <Orbit icon="payments" x={112} y={100} color={BRAND.leaf} />
        </ArtDisc>
        }
      />
    </Screen>
  );
}
