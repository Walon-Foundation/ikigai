"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Already dismissed
    if (localStorage.getItem("pwa-prompt-dismissed")) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-prompt-dismissed", "1");
    setShowBanner(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwa-prompt-dismissed", "1");
    }
    setShowBanner(false);
  }

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-primary-muted/30 bg-card shadow-lg">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Download className="size-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Install Ikigai
          </p>
          {isIOS ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tap <Share className="mb-0.5 inline size-3" /> then{" "}
              <strong>Add to Home Screen</strong> to install
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add to your home screen for the full app experience
            </p>
          )}
          {!isIOS && (
            <button
              onClick={install}
              className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Install App
            </button>
          )}
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
