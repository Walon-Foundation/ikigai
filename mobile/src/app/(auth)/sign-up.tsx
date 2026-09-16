import { Button, Column, OutlinedButton, Row, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Field, Page, Paragraph } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { signIn } from '@/state/session';
import { Type } from '@/components/Type';

function enter() {
  signIn();
  router.replace('/(tabs)');
}

export default function SignUpScreen() {
  return (
    <Screen>
      <SignUp />
    </Screen>
  );
}

function SignUp() {
  const c = useMaterialColors();
  return (
    <Page title="Create your account">
      <Paragraph muted>Ikigai pairs young people in Sierra Leone with mentors who help them find their purpose.</Paragraph>

      <Column modifiers={[fillMaxWidth(), padding(16, 12, 16, 8)]}>
        <OutlinedButton onClick={() => enter()} modifiers={[fillMaxWidth()]}>
          <Text>Sign up with Google</Text>
        </OutlinedButton>
      </Column>

      <Row horizontalArrangement="center" modifiers={[fillMaxWidth(), padding(0, 8, 0, 8)]}>
        <Type variant="labelMedium" color={c.onSurfaceVariant}>
          or with email
        </Type>
      </Row>

      <Field label="Your name" />
      <Field label="Email" keyboard="email" />
      <Field label="Password" password supporting="At least 8 characters" />

      <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth(), padding(16, 12, 16, 0)]}>
        <Button onClick={() => enter()} modifiers={[fillMaxWidth()]}>
          <Text>Create account</Text>
        </Button>
        <TextButton onClick={() => router.replace('/sign-in')} modifiers={[fillMaxWidth()]}>
          <Text>I already have an account</Text>
        </TextButton>
      </Column>
    </Page>
  );
}
