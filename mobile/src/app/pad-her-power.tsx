import { FilledTonalButton, IconButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { Linking } from 'react-native';
import { InfoCard, NavRow, Page, Paragraph, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { resources } from '@/data/demo';

export default function PadHerPowerScreen() {
  return (
    <Screen>
      <PadHerPower />
    </Screen>
  );
}

// The PWA shows a map; here each place opens in the phone's own maps app,
// which is lighter and works offline with downloaded areas.
function PadHerPower() {
  const c = useMaterialColors();
  const openMap = (r: (typeof resources)[number]) =>
    Linking.openURL(`geo:${r.lat},${r.lng}?q=${r.lat},${r.lng}(${encodeURIComponent(r.name)})`);

  return (
    <Page title="Pad Her Power">
      <InfoCard tone="primary">
        <Type variant="titleMedium" color={c.onPrimaryContainer}>
          Free pads, health advice and safe spaces near you
        </Type>
        <Type variant="bodyMedium" color={c.onPrimaryContainer}>
          Nobody will ask why you came.
        </Type>
      </InfoCard>
      <SectionHeader>Nearby</SectionHeader>
      {resources.map((r) => (
        <NavRow
          key={r.id}
          icon="place"
          title={r.name}
          detail={`${r.kind} · ${r.area} · ${r.distance}`}
          onPress={() => openMap(r)}
          trailing={
            r.phone ? (
              <IconButton onClick={() => Linking.openURL(`tel:${r.phone}`)}>
                <Glyph name="call" color={c.primary} />
              </IconButton>
            ) : undefined
          }
        />
      ))}
      <Paragraph muted>Know a place that should be here?</Paragraph>
      <FilledTonalButton onClick={() => {}}>
        <Text>Suggest a place</Text>
      </FilledTonalButton>
    </Page>
  );
}
