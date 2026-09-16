/**
 * Demo sign-in state, in memory only.
 *
 * Stands in for the Better Auth session until the app talks to the API: the
 * app opens on the intro, then sign in / sign up, and only a signed-in user
 * reaches the tabs. A reload starts signed out again, which is what a demo
 * wants.
 */
let signedIn = false;

export function isSignedIn(): boolean {
  return signedIn;
}

export function signIn(): void {
  signedIn = true;
}

export function signOut(): void {
  signedIn = false;
}
