import { Image, OutlinedButton, Row, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, size } from '@expo/ui/jetpack-compose/modifiers';

const G = require('../../assets/images/google-g.png');

/** Google's four-colour "G" beside the label, as their sign-in branding asks. */
export function GoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <OutlinedButton onClick={onClick} modifiers={[fillMaxWidth()]}>
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
        <Image source={G} contentDescription={null} modifiers={[size(18, 18)]} />
        <Text>{label}</Text>
      </Row>
    </OutlinedButton>
  );
}
