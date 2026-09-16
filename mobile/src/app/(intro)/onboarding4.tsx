import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/theme/brand';

export default function Onboarding4() {
  return (
    <Screen>
      <IntroSlide
        step={4}
        accent={{ strong: BRAND.leaf, soft: BRAND.leafSoft }}
        eyebrow="Safe and yours"
        title="Built to keep you safe"
        body="Every mentor is verified. Your journal stays private unless you share it, your family can follow your progress, and help is one tap away."
        art={
        <ArtDisc accent={{ strong: BRAND.leaf, soft: BRAND.leafSoft }} icon="verified_user">
          <Orbit icon="lock" x={-116} y={84} color={BRAND.teal} />
          <Orbit icon="family_restroom" x={116} y={-84} color={BRAND.orange} />
        </ArtDisc>
        }
      />
    </Screen>
  );
}
