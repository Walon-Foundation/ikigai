import Link from "next/link";
import { clientEnv } from "@/lib/env.client";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/about", label: "About" },
      { href: "/what-we-do", label: "What We Do" },
      { href: "/programmes", label: "Programmes" },
      { href: "/events", label: "Events" },
    ],
  },
  {
    heading: "Get involved",
    links: [
      { href: "/get-involved", label: "Join a programme" },
      { href: "/get-involved#volunteer", label: "Volunteer" },
      { href: "/get-involved#partner", label: "Partner with us" },
      { href: "/contact", label: "Contact" },
      // The app lives on another subdomain, so this is a plain external link.
      { href: clientEnv.appUrl, label: "Sign in to the app", external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 max-w-xs sm:col-span-1">
            <span className="font-display text-2xl font-black tracking-tight text-foreground">
              Ikigai
            </span>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A youth-led organization helping young people across Sierra Leone
              discover purpose, build skills, and lead change.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.heading}
              </p>
              <div className="flex flex-col gap-3">
                {col.links.map((l) =>
                  "external" in l && l.external ? (
                    <a
                      key={l.href}
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ikigai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
