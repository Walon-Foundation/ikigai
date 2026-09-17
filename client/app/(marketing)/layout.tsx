import type { ReactNode } from "react";
import { WebSurface } from "@/components/system/web-surface";
import { clientEnv } from "@/lib/env.client";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
        The site no longer links into the web app; people download the mobile
        app instead. A DNS hint for the store keeps that tap quick on 3G.
        React hoists it into <head>; a browser that ignores it loses nothing.
      */}
      <link
        rel="dns-prefetch"
        href={new URL(clientEnv.appDownloadUrl).origin}
      />
      <WebSurface>{children}</WebSurface>
    </>
  );
}
