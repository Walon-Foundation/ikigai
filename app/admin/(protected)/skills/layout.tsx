import Link from "next/link";
import type { ReactNode } from "react";

// The skill milestone system's sub-sections. Unlike /admin/cms, this content
// IS read by the PWA: it's the automatic-milestone-generation content library
// behind each mentee's per-skill DISCOVER→THRIVE→BUILD→LEAD track. See
// lib/skill-tracks.ts.
const SECTIONS = [
  { href: "/admin/skills/categories", label: "Categories" },
  { href: "/admin/skills/milestones", label: "Milestones" },
];

export default function SkillsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-2xl font-black text-foreground">
          Skill milestones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categories classify a mentee's interest tags; each category's
          milestones auto-generate that mentee's DISCOVER → THRIVE → BUILD →
          LEAD track.
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
