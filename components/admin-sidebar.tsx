"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  School,
  AlertTriangle,
  Bell,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_ADMIN_STATS } from "@/lib/mock-data";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { href: "/admin/users", label: "Users", icon: Users, badge: MOCK_ADMIN_STATS.totalUsers },
  { href: "/admin/mentors", label: "Mentors", icon: UserCheck, badge: MOCK_ADMIN_STATS.pendingMentors },
  { href: "/admin/schools", label: "Schools", icon: School, badge: MOCK_ADMIN_STATS.pendingSchools },
  { href: "/admin/reports", label: "Reports", icon: AlertTriangle, badge: MOCK_ADMIN_STATS.openReports },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, badge: null },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, badge: null },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg font-black text-primary">Ikigai</span>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isBadgeAlert =
              item.href.includes("reports") || item.href.includes("mentors") || item.href.includes("schools");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="size-4" />
                  {item.label}
                </div>
                {item.badge !== null && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isBadgeAlert && (item.badge as number) > 0
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Admin Panel · Ikigai Digital</p>
      </div>
    </aside>
  );
}
