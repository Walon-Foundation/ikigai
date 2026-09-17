import { Button, Column, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { router, useLocalSearchParams } from 'expo-router';
import { BrandMark } from '@/components/BrandMark';
import { Field, Page } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { signIn } from '@/state/session';
import { Type } from '@/components/Type';

export default function PasswordScreen() {
  return (
    <Screen>
      <Password />
    </Screen>
  );
}

// Second step of email sign-in; the email comes from the sign-in screen.
function Password() {
  const c = useMaterialColors();
  const { email } = useLocalSearchParams<{ email: string }>();
  return (
    <Page title="">
      <Column
        horizontalAlignment="center"
        verticalArrangement={{ spacedBy: 12 }}
        modifiers={[fillMaxWidth(), padding(24, 8, 24, 24)]}
      >
        <BrandMark size={72} coin />
        <Type variant="headlineMedium" color={c.onSurface}>
          Enter your password
        </Type>
        <Type variant="bodyLarge" color={c.onSurfaceVariant}>
          {email ?? ''}
        </Type>
      </Column>

      <Field label="Password" password />

      <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth(), padding(16, 12, 16, 0)]}>
        <Button
          onClick={() => {
            signIn();
            router.replace('/(tabs)');
          }}
          modifiers={[fillMaxWidth()]}
        >
          <Text>Sign in</Text>
        </Button>
        <TextButton onClick={() => router.back()} modifiers={[fillMaxWidth()]}>
          <Text>Use a different email</Text>
        </TextButton>
      </Column>
    </Page>
  );
}
