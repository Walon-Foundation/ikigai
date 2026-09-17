import { useState } from 'react';
import { Button, Column, Row, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { BrandMark } from '@/components/BrandMark';
import { GoogleButton } from '@/components/GoogleButton';
import { Field, Page } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { signIn } from '@/state/session';
import { Type } from '@/components/Type';

function enter() {
  signIn();
  router.replace('/(tabs)');
}

export default function SignInScreen() {
  return (
    <Screen>
      <SignIn />
    </Screen>
  );
}

// Better Auth: Google, or email here and the password on the next screen.
// Demo only — both go straight in.
function SignIn() {
  const c = useMaterialColors();
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());
  return (
    <Page title="" back={false}>
      <Column
        horizontalAlignment="center"
        verticalArrangement={{ spacedBy: 12 }}
        modifiers={[fillMaxWidth(), padding(24, 24, 24, 24)]}
      >
        <BrandMark size={96} coin />
        <Type variant="headlineMedium" color={c.onSurface}>
          Welcome back
        </Type>
        <Type variant="bodyLarge" color={c.onSurfaceVariant}>
          Sign in to keep growing.
        </Type>
      </Column>

      <Column modifiers={[fillMaxWidth(), padding(16, 0, 16, 8)]}>
        <GoogleButton label="Continue with Google" onClick={() => enter()} />
      </Column>

      <Row horizontalArrangement="center" modifiers={[fillMaxWidth(), padding(0, 8, 0, 8)]}>
        <Type variant="labelMedium" color={c.onSurfaceVariant}>
          or with email
        </Type>
      </Row>

      <Field label="Email" keyboard="email" onChange={setEmail} />

      <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth(), padding(16, 12, 16, 0)]}>
        <Button
          enabled={valid}
          onClick={() => router.push({ pathname: '/password', params: { email: email.trim() } })}
          modifiers={[fillMaxWidth()]}
        >
          <Text>Sign in</Text>
        </Button>
        <TextButton onClick={() => router.replace('/sign-up')} modifiers={[fillMaxWidth()]}>
          <Text>New here? Create an account</Text>
        </TextButton>
      </Column>
    </Page>
  );
}
