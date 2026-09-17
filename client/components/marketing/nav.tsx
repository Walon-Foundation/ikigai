"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/system/button";
import { clientEnv } from "@/lib/env.client";
import { cn } from "@/lib/utils";

// The primary nav for the public organisation site. The information
// architecture is deliberately shallow: six items a visitor scans in one pass,
// with the three "what we run" pages (Programmes, Gallery, Partners) tucked
// under a What We Do dropdown rather than spending six more slots on the top
// bar. The old "Install the App" CTA is gone from here — the app is one
// programme now, reached from the Mentorship page, not the whole site's point.
//
// No theme toggle: the marketing site is light only (docs/05-design-guide.md).

const PRIMARY = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/stories", label: "Stories" },
];

const WHAT_WE_DO = [
  { href: "/what-we-do", label: "Overview" },
  { href: "/programmes", label: "Programmes" },
  { href: "/gallery", label: "Gallery" },
  { href: "/clubs", label: "Clubs" },
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
  { href: "/clubs", label: "Clubs" },
  { href: "/partners", label: "Partners" },
  { href: "/contact", label: "Contact" },
];

const isCurrent = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function Nav() {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!dropdown) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setDropdown(false);
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdown(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [dropdown]);

  const whatWeDoCurrent = WHAT_WE_DO.some((l) => isCurrent(pathname, l.href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-background/90 backdrop-blur-md transition-colors duration-200",
        scrolled || open ? "border-border" : "border-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[18px] font-bold text-(--w-green-deep)"
          >
            <Image
              src="/marketing/logo-coin.png"
              alt=""
              width={34}
              height={34}
              data-essential
              className="size-[34px]"
            />
            Ikigai
          </Link>

          <nav
            aria-label="Main"
            className="ml-auto hidden items-center gap-1 md:flex"
          >
            {PRIMARY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
                className="relative px-3 py-2 text-[14.5px] font-medium text-foreground transition-colors hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-(--w-green-deep) aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-[13px] aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-primary"
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
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setDropdown(true)}
              onMouseLeave={() => setDropdown(false)}
            >
              <button
                type="button"
                onClick={() => setDropdown((v) => !v)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-[14.5px] font-medium text-foreground transition-colors hover:text-primary",
                  whatWeDoCurrent && "font-semibold text-(--w-green-deep)",
                )}
                aria-expanded={dropdown}
                aria-haspopup="menu"
              >
                What We Do
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    dropdown && "rotate-180",
                  )}
                />
              </button>
              {dropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="min-w-48 rounded-xl border border-border bg-card p-1.5 shadow-(--w-lift)">
                    {WHAT_WE_DO.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        aria-current={
                          isCurrent(pathname, l.href) ? "page" : undefined
                        }
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary aria-[current=page]:bg-(--w-leaf-soft) aria-[current=page]:text-(--w-green-deep)"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-5 md:ml-0">
            {/* A quiet way to the app; the loud CTA stays "Join a programme".
                The site no longer signs people in to the web app: the app is
                downloaded from the store. */}
            <a
              href={clientEnv.appDownloadUrl}
              className="hidden text-[14.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Get the app
            </a>
            <Link
              href="/get-involved"
              className={buttonClass("primary", {
                size: "sm",
                className: "hidden sm:inline-flex",
              })}
            >
              Join a programme
            </Link>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-border md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span
                className={cn(
                  "h-0.5 w-5 bg-foreground transition-transform duration-200",
                  open && "translate-y-2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-5 bg-foreground transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-5 bg-foreground transition-transform duration-200",
                  open && "-translate-y-2 -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="flex flex-col border-t border-border bg-background px-6 pb-6 pt-2 md:hidden">
          {ALL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
              className="border-b border-border py-3.5 text-base font-medium text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/get-involved"
            onClick={() => setOpen(false)}
            className={buttonClass("primary", { className: "mt-5" })}
          >
            Join a programme
          </Link>
          <a
            href={clientEnv.appDownloadUrl}
            className={buttonClass("outline", { className: "mt-3" })}
          >
            Download the app
          </a>
        </div>
      )}
    </header>
  );
}
