"use client";

import { useClerk } from "@clerk/nextjs";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  FilePlus,
  Globe,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  MessageSquareText,
  School,
  ShieldAlert,
  Sprout,
  UserCheck,
  UserPlus,
  Users,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAndClearOfflineJournal } from "@/lib/offline-journal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/mentors", label: "Mentors", icon: UserCheck },
  { href: "/admin/mentees", label: "Mentees", icon: UserPlus },
  { href: "/admin/guardians", label: "Guardians", icon: Users2 },
  { href: "/admin/safeguarding", label: "Safeguarding", icon: ShieldAlert },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/schools", label: "Schools", icon: School },
  { href: "/admin/skills", label: "Skills", icon: Sprout },
  { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/cms", label: "Website", icon: Globe },
  { href: "/admin/pages", label: "Custom Pages", icon: FilePlus },
  { href: "/admin/page-builder", label: "Page Builder", icon: LayoutTemplate },
  { href: "/admin/app-copy", label: "App Copy", icon: MessageSquareText },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
];

export function AdminSidebar({
  displayName,
  email,
}: {
  displayName?: string | null;
  email?: string | null;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg font-black text-primary">
          Ikigai
        </span>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName ?? "Admin"}
          </p>
          {email && (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          )}
        </div>
        {/* Sign-out clears the offline journal queue before Clerk drops the
            session — these devices are shared, and a queued entry left behind
            is both readable by the next person and syncable into their
            account. See lib/offline-journal.ts. */}
        <button
          type="button"
          onClick={() =>
            signOutAndClearOfflineJournal(signOut, { redirectUrl: "/sign-in" })
          }
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
