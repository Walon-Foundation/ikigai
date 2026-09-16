import { FilledTonalButton, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { Linking } from 'react-native';
import { NavRow, Page, Paragraph } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { helpLines } from '@/data/demo';

export default function HelpScreen() {
  return (
    <Screen>
      <Help />
    </Screen>
  );
}

function Help() {
  useMaterialColors();
  return (
    <Page title="Help lines">
      <Paragraph muted>These calls are free. You do not have to give your name.</Paragraph>
      {helpLines.map((h) => (
        <NavRow
          key={h.id}
          icon="call"
          title={h.name}
          detail={`${h.number} · ${h.note}`}
          trailing={
            <FilledTonalButton onClick={() => Linking.openURL(`tel:${h.number.replace(/\s/g, '')}`)}>
              <Text>Call</Text>
            </FilledTonalButton>
          }
        />
      ))}
    </Page>
  );
}
