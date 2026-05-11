"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePwaInstall } from "@/lib/use-pwa-install";

export function PwaInstallPrompt() {
  const { prompt, isIOS, isInstalled, install } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-prompt-dismissed")) return;
    if (isInstalled) return;
    if (prompt || isIOS) setShowBanner(true);
  }, [prompt, isIOS, isInstalled]);

  function dismiss() {
    localStorage.setItem("pwa-prompt-dismissed", "1");
    setDismissed(true);
    setShowBanner(false);
  }

  async function handleInstall() {
    await install();
    setShowBanner(false);
  }

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-primary-muted/30 bg-card shadow-lg lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Download className="size-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Install Ikigai</p>
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
              type="button"
              onClick={handleInstall}
              className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Install App
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
