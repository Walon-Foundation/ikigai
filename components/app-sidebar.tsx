"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: TreePine },
  { href: "/mentorship", label: "Match", icon: Users },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials = (user?.fullName ?? user?.firstName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-border bg-card sticky top-0">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="font-display text-xl font-black text-primary">
          Ikigai
        </span>
        <span className="text-lg">🌱</span>
      </div>

      {/* User greeting */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{greeting}</p>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {user?.firstName ?? user?.fullName ?? "there"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
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
                <item.icon
                  className={cn("size-4", isActive && "fill-primary/10")}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
