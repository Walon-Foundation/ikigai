import { AlertDialog, Switch, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import { router } from 'expo-router';
import { useState } from 'react';
import { NavRow, Page, SectionHeader } from '@/components/Kit';
import { Screen } from '@/components/Screen';
import { signOut } from '@/state/session';

export default function SettingsScreen() {
  return (
    <Screen>
      <Settings />
    </Screen>
  );
}

function Settings() {
  const c = useMaterialColors();
  const [prefs, setPrefs] = useState({ push: true, email: false, mentorship: true, clubs: true, events: true, tips: false });
  const [privateByDefault, setPrivateByDefault] = useState(true);
  const [exportSent, setExportSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const toggle = (key: keyof typeof prefs, title: string, detail?: string) => (
    <NavRow
      title={title}
      detail={detail}
      trailing={<Switch value={prefs[key]} onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />}
    />
  );

  return (
    <Page title="Settings">
      <SectionHeader>How we reach you</SectionHeader>
      {toggle('push', 'Push notifications')}
      {toggle('email', 'Email', 'For things you might miss')}

      <SectionHeader>What you hear about</SectionHeader>
      {toggle('mentorship', 'Your mentor', 'Messages, missions, reviews')}
      {toggle('clubs', 'Clubs')}
      {toggle('events', 'Events')}
      {toggle('tips', 'Tips and nudges')}

      <SectionHeader>Privacy</SectionHeader>
      <NavRow
        title="New journal entries are private"
        detail="You can still share one with your mentor"
        trailing={<Switch value={privateByDefault} onCheckedChange={setPrivateByDefault} />}
      />

      <SectionHeader>Your account</SectionHeader>
      <NavRow
        icon="download"
        title="Download your data"
        detail={exportSent ? 'We will email you a link within an hour' : 'Everything you have on Ikigai'}
        onPress={() => setExportSent(true)}
      />
      <NavRow
        icon="delete"
        title={deletionRequested ? 'Deletion scheduled' : 'Delete account'}
        detail={deletionRequested ? 'In 30 days. Tap to cancel.' : 'You have 30 days to change your mind'}
        onPress={() => (deletionRequested ? setDeletionRequested(false) : setConfirmDelete(true))}
      />
      <NavRow
        icon="logout"
        title="Sign out"
        onPress={() => {
          signOut();
          router.replace('/onboarding1');
        }}
      />

      {confirmDelete ? (
        <AlertDialog onDismissRequest={() => setConfirmDelete(false)}>
          <AlertDialog.Title>
            <Text>Delete your account?</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>Your journal, goals and tree will be removed after 30 days. Messages stay with the people you sent them to.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              onClick={() => {
                setDeletionRequested(true);
                setConfirmDelete(false);
              }}
            >
              <Text color={c.error}>Delete</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setConfirmDelete(false)}>
              <Text>Keep account</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </Page>
  );
}
