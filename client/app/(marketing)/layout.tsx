import type { ReactNode } from "react";
import { clientEnv } from "@/lib/env.client";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
        Every meaningful call to action on this site — the hero button, the nav
        button, the CTA at the foot of every page — points at the app subdomain,
        which is a different origin. Without this, tapping one starts a cold DNS
        lookup, TCP connection and TLS handshake before the first byte of the
        app's HTML moves: most of a second on a 3G connection, spent on the one
        action this entire site exists to produce.

        React hoists these into <head>. They're hints, so a browser that ignores
        them simply behaves as it does today.
      */}
      <link rel="preconnect" href={clientEnv.appUrl} />
      <link rel="dns-prefetch" href={clientEnv.appUrl} />
      {children}
    </>
  );
}
