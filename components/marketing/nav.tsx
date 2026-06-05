"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const appHost = process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.localhost:3000";
  const appUrl = `${appHost.includes("localhost") ? "http" : "https"}://${appHost}`;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-sm"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl font-black tracking-tight text-foreground">
              Ikigai
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>

          {/* Right: Install CTA + mobile hamburger */}
          <div className="flex items-center gap-3">
            <a
              href={appUrl}
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98] sm:inline-flex"
            >
              Install the App
            </a>
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex flex-col gap-1.5 p-2 md:hidden"
              aria-label="Toggle menu"
            >
              <span
                className={cn(
                  "h-0.5 w-6 bg-foreground transition-transform duration-200",
                  open && "translate-y-2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-6 bg-foreground transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-6 bg-foreground transition-transform duration-200",
                  open && "-translate-y-2 -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="flex flex-col gap-4 border-t border-border bg-background px-6 pb-6 pt-4 md:hidden">
          <Link
            href="/how-it-works"
            onClick={() => setOpen(false)}
            className="border-b border-border py-2 text-base font-medium text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="border-b border-border py-2 text-base font-medium text-foreground"
          >
            About
          </Link>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="border-b border-border py-2 text-base font-medium text-foreground"
          >
            Contact
          </Link>
          <a
            href={appUrl}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Install the App
          </a>
        </div>
      )}
    </header>
  );
}
