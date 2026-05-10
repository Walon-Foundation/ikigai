"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  TreePine,
  Users,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: TreePine },
  { href: "/mentorship", label: "Match", icon: Users },
  { href: "/journal", label: "Journal", icon: BookOpen },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const initials = (user?.fullName ?? user?.firstName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isProfileActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("size-5", isActive && "fill-primary/10")}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile tab — shows user avatar */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
            isProfileActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px] font-bold leading-none",
              isProfileActive
                ? "bg-primary text-primary-foreground"
                : "bg-primary-muted/50 text-primary"
            )}
          >
            {initials}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
