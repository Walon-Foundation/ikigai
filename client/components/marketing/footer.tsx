import Image from "next/image";
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

const linkClass =
  "text-[14.5px] text-(--w-on-deep) transition-colors hover:text-white";

export function Footer() {
  return (
    <footer className="mt-24 bg-(--w-green-deep) text-(--w-on-deep)">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-xs md:col-span-1">
            <span className="flex items-center gap-2.5 text-[18px] font-bold text-white">
              <Image
                src="/icon-192x192.png"
                alt=""
                width={34}
                height={34}
                data-essential
                className="size-[34px]"
              />
              Ikigai
            </span>
            <p className="mt-4 text-[14.5px] leading-relaxed">
              A youth-led organization helping young people across Sierra Leone
              discover purpose, build skills, and lead change.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="mb-4 text-sm font-semibold text-white">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {"external" in l && l.external ? (
                      <a href={l.href} className={linkClass}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} Ikigai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
