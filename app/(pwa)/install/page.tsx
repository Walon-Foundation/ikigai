"use client";

import { Download, Share } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa-install";

export default function InstallPage() {
  const { prompt, isIOS, install } = usePwaInstall();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/30">
        <Download className="size-10 text-primary-foreground" />
      </div>

      <h1 className="font-display mb-3 text-4xl font-black text-foreground">
        Install Ikigai
      </h1>
      <p className="mb-10 max-w-xs text-muted-foreground">
        Ikigai is a PWA — install it to your home screen to get the full
        experience, offline support, and fast loading.
      </p>

      {isIOS ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-left text-sm text-muted-foreground">
          <p className="mb-3 font-semibold text-foreground">Install on iOS:</p>
          <ol className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              Tap the <Share className="inline size-4 text-primary" /> Share
              button in Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              Scroll down and tap{" "}
              <strong className="text-foreground">Add to Home Screen</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              Tap <strong className="text-foreground">Add</strong>
            </li>
          </ol>
        </div>
      ) : prompt ? (
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-light hover:-translate-y-0.5"
        >
          <Download className="size-5" />
          Install App
        </button>
      ) : (
        <p className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
          Open this page in Chrome or Edge on Android, or Safari on iOS to
          install.
        </p>
      )}
    </div>
  );
}
