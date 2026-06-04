"use client";

import {
  BookOpen,
  Calendar,
  CreditCard,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Star,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const MENTEE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: TreePine },
  { href: "/mentorship", label: "Match", icon: Users },
  { href: "/journal", label: "Journal", icon: BookOpen },
];

const MENTOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mentor-portal", label: "Mentees", icon: Users },
  { href: "/mentorship", label: "Messages", icon: MessageCircle },
  { href: "/activities", label: "Activities", icon: Calendar },
];

const PARENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/parent-portal", label: "My Child", icon: Heart },
  { href: "/parent-portal/mentors", label: "Mentors", icon: Star },
  { href: "/parent-portal/payments", label: "Payments", icon: CreditCard },
];

function navItemsForRole(role: string | null): NavItem[] {
  if (role === "mentor") return MENTOR_NAV;
  if (role === "parent") return PARENT_NAV;
  return MENTEE_NAV;
}

export function AppNav({ role }: { role: string | null }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);
  const isProfileActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  const roleLabel = role === "mentor" ? "M" : role === "parent" ? "P" : "U";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
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
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon
                className={cn("size-5", isActive && "fill-primary/10")}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
            isProfileActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px] font-bold leading-none",
              isProfileActive
                ? "bg-primary text-primary-foreground"
                : "bg-primary-muted/50 text-primary",
            )}
          >
            {roleLabel}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
