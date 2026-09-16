"use client";

import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PwaInstallState = {
  prompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  isInstalled: boolean | null;
  dismissed: boolean;
};

// Install state lives in one module-level store rather than in each caller's
// component state. There is only ever ONE beforeinstallprompt event per page
// load, it is single-use, and it has to survive client navigation to Settings
// (the event fires early, long before the user goes looking for the button) —
// none of which per-component state can do.
let state: PwaInstallState = {
  prompt: null,
  isIOS: false,
  // null = the browser hasn't been asked yet. This must NOT start `false`: the
  // server cannot know how the page is displayed, so an install card rendered
  // on `!isInstalled` would ship inside the HTML, show itself to people who
  // already installed, and only vanish a frame later. Callers test `=== false`.
  isInstalled: null,
  dismissed: false,
};

const listeners = new Set<() => void>();

function set(next: Partial<PwaInstallState>) {
  state = { ...state, ...next };
  for (const notify of listeners) notify();
}

let started = false;

function start() {
  if (started) return;
  started = true;

  const standalone = window.matchMedia("(display-mode: standalone)");
  const readInstalled = () =>
    set({
      isInstalled:
        standalone.matches ||
        // iOS below 16.4 has no display-mode support; this is the only signal a
        // home-screen app gives there.
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    });

  set({ isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) });
  readInstalled();
  standalone.addEventListener("change", readInstalled);

  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppresses Chromium's own mini-infobar so the offer lives where we put it.
    // Fires again on a later load while the app is still installable, which is
    // how a dismissal recovers.
    event.preventDefault();
    set({ prompt: event as BeforeInstallPromptEvent, dismissed: false });
  });

  window.addEventListener("appinstalled", () => {
    // The tab the user installed FROM stays display-mode: browser, so the media
    // query above never fires. Without this the card sits there offering to
    // install an app that is already on their home screen.
    set({ prompt: null, isInstalled: true });
  });
}

function subscribe(notify: () => void) {
  start();
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

const getSnapshot = () => state;

let prompting = false;

// Opens the browser's install dialog. Returns the user's choice, or null when
// there is nothing to prompt with. The dialog itself is the browser's and
// cannot be skipped or styled — prompt() only works inside a real click.
export async function install() {
  const event = state.prompt;
  if (!event || prompting) return null;
  prompting = true;
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    // Spent either way: a beforeinstallprompt event may only be prompt()ed once
    // and Chromium throws InvalidStateError on the second call. Holding on to it
    // after a dismissal left a button that threw instead of reopening.
    set({ prompt: null, dismissed: outcome === "dismissed" });
    return outcome;
  } finally {
    prompting = false;
  }
}

export function usePwaInstall() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snapshot, install };
}
