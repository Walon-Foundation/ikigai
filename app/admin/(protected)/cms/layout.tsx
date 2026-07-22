import Link from "next/link";
import type { ReactNode } from "react";

// The CMS sub-sections. These edit the public website (findingyourikigai.org);
// nothing here is read by the app.
const SECTIONS = [
  { href: "/admin/cms/programmes", label: "Programmes" },
  { href: "/admin/cms/pillars", label: "Pillars" },
  { href: "/admin/cms/stories", label: "Stories" },
  { href: "/admin/cms/gallery", label: "Gallery" },
  { href: "/admin/cms/events", label: "Events" },
  { href: "/admin/cms/partners", label: "Partners" },
  { href: "/admin/cms/team", label: "Team" },
  { href: "/admin/cms/impact", label: "Impact" },
  { href: "/admin/cms/media", label: "Media" },
  { href: "/admin/cms/copy", label: "Copy" },
];

export default function CmsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-2xl font-black text-foreground">
          Website content
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What you publish here appears on the public website. Drafts stay
          hidden until you publish them.
        </p>
        <nav className="mt-4 flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
