import type { ReactNode } from "react";
import "./web.css";

/**
 * The boundary of the web design system. Everything rendered inside picks up
 * its tokens; nothing outside, including the PWA, is affected. See
 * components/system/web.css.
 */
export function WebSurface({ children }: { children: ReactNode }) {
  return (
    <div data-surface="web" className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
