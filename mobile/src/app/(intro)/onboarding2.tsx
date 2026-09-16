import { ArtDisc, IntroSlide, Orbit } from '@/components/IntroSlide';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/theme/brand';

export default function Onboarding2() {
  return (
    <Screen>
      <IntroSlide
        step={2}
        accent={{ strong: BRAND.orange, soft: BRAND.orangeSoft }}
        eyebrow="Mentorship"
        title="A mentor who has walked the road"
        body="Get matched with a verified mentor from Sierra Leone who shares your interests. Chat, take on missions together, and meet in person."
      next="/onboarding3"
        art={
        <ArtDisc accent={{ strong: BRAND.orange, soft: BRAND.orangeSoft }} icon="handshake">
          <Orbit icon="chat" x={-116} y={-80} color={BRAND.teal} />
          <Orbit icon="assignment" x={116} y={60} color={BRAND.green} />
        </ArtDisc>
        }
      />
    </Screen>
  );
}
