"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// The primary nav for the public organisation site. The information
// architecture is deliberately shallow: six items a visitor scans in one pass,
// with the three "what we run" pages (Programmes, Gallery, Partners) tucked
// under a What We Do dropdown rather than spending six more slots on the top
// bar. The old "Install the App" CTA is gone from here — the app is one
// programme now, reached from the Mentorship page, not the whole site's point.

const PRIMARY = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/stories", label: "Stories" },
];

const WHAT_WE_DO = [
  { href: "/what-we-do", label: "Overview" },
  { href: "/programmes", label: "Programmes" },
  { href: "/gallery", label: "Gallery" },
  { href: "/partners", label: "Partners" },
];

// The flat list the mobile drawer shows — every destination, no nesting.
const ALL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/programmes", label: "Programmes" },
  { href: "/events", label: "Events" },
  { href: "/stories", label: "Stories" },
  { href: "/gallery", label: "Gallery" },
  { href: "/partners", label: "Partners" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);

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
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl font-black tracking-tight text-foreground">
              Ikigai
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {PRIMARY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}

            {/* What We Do — hover/focus dropdown. The hover is a pointer-only
                enhancement; the button below toggles the same state on click and
                is fully keyboard-operable, so this wrapper carries no
                accessibility weight of its own. */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer-only hover convenience over a keyboard-operable button. */}
            <div
              className="relative"
              onMouseEnter={() => setDropdown(true)}
              onMouseLeave={() => setDropdown(false)}
            >
              <button
                type="button"
                onClick={() => setDropdown((v) => !v)}
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                aria-expanded={dropdown}
                aria-haspopup="menu"
              >
                What We Do
                <ChevronDown className="size-3.5" />
              </button>
              {dropdown && (
                <div className="absolute left-0 top-full min-w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  {WHAT_WE_DO.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/get-involved"
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98] sm:inline-flex"
            >
              Join A Programme
            </Link>
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

      {open && (
        <div className="flex flex-col gap-1 border-t border-border bg-background px-6 pb-6 pt-2 md:hidden">
          {ALL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-border py-3 text-base font-medium text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/get-involved"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Join A Programme
          </Link>
        </div>
      )}
    </header>
  );
}
