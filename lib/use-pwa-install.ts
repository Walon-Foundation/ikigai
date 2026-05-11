"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent;
  }
}

export function usePwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Pick up the event if it already fired (captured by another component)
    if (window.__pwaPrompt) {
      setPrompt(window.__pwaPrompt);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      window.__pwaPrompt = evt;
      setPrompt(evt);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      window.__pwaPrompt = undefined;
      setPrompt(null);
    }
  }

  return { prompt, isIOS, isInstalled, install };
}
