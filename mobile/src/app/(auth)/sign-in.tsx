import { Button, Column, OutlinedButton, Row, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Field, Page } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';

export default function SignInScreen() {
  return (
    <Screen>
      <SignIn />
    </Screen>
  );
}

// Better Auth: Google or email + password. Demo only — both go straight in.
function SignIn() {
  const c = useMaterialColors();
  return (
    <Page title="" back={false}>
      <Column
        horizontalAlignment="center"
        verticalArrangement={{ spacedBy: 12 }}
        modifiers={[fillMaxWidth(), padding(24, 24, 24, 24)]}
      >
        <Avatar background={c.primaryContainer} color={c.onPrimaryContainer} diameter={72}>
          <Glyph name="potted_plant" color={c.onPrimaryContainer} size={40} />
        </Avatar>
        <Type variant="headlineMedium" color={c.onSurface}>
          Welcome back
        </Type>
        <Type variant="bodyLarge" color={c.onSurfaceVariant}>
          Sign in to keep growing.
        </Type>
      </Column>

      <Column modifiers={[fillMaxWidth(), padding(16, 0, 16, 8)]}>
        <OutlinedButton onClick={() => router.replace('/(tabs)')} modifiers={[fillMaxWidth()]}>
          <Text>Continue with Google</Text>
        </OutlinedButton>
      </Column>

      <Row horizontalArrangement="center" modifiers={[fillMaxWidth(), padding(0, 8, 0, 8)]}>
        <Type variant="labelMedium" color={c.onSurfaceVariant}>
          or with email
        </Type>
      </Row>

      <Field label="Email" keyboard="email" />
      <Field label="Password" password />

      <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth(), padding(16, 12, 16, 0)]}>
        <Button onClick={() => router.replace('/(tabs)')} modifiers={[fillMaxWidth()]}>
          <Text>Sign in</Text>
        </Button>
        <TextButton onClick={() => router.push('/sign-up')} modifiers={[fillMaxWidth()]}>
          <Text>New here? Create an account</Text>
        </TextButton>
      </Column>
    </Page>
  );
}
