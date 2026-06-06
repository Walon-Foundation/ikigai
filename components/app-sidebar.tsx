"use client";

import { useClerk } from "@clerk/nextjs";
import {
  BookOpen,
  Calendar,
  CreditCard,
  Heart,
  LayoutDashboard,
  Leaf,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Search,
  Shield,
  Star,
  Target,
  TreePine,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const MENTEE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: TreePine },
  { href: "/mentors", label: "Find a Mentor", icon: Search },
  { href: "/mentorship", label: "Match", icon: Users },
  { href: "/groups", label: "Groups", icon: MessageCircle },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Star },
];

const MENTEE_MODULES: NavItem[] = [
  { href: "/purpose-book", label: "Purpose Book", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/pad-her-power", label: "Pad Her Power", icon: Zap },
  { href: "/safety", label: "Safety", icon: Shield },
];

const MENTOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mentor-portal", label: "My Mentees", icon: Users },
  { href: "/mentorship", label: "Messages", icon: MessageCircle },
  { href: "/groups", label: "Groups", icon: MessagesSquare },
  { href: "/activities", label: "Activities", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Star },
];

const PARENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/parent-portal", label: "My Child", icon: Heart },
  { href: "/parent-portal/mentors", label: "Mentors", icon: Star },
  { href: "/parent-portal/payments", label: "Payments", icon: CreditCard },
  { href: "/activities", label: "Activities", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Star },
];

function navForRole(role: string | null): {
  main: NavItem[];
  modules?: NavItem[];
} {
  if (role === "mentor") return { main: MENTOR_NAV };
  if (role === "parent") return { main: PARENT_NAV };
  return { main: MENTEE_NAV, modules: MENTEE_MODULES };
}

export function AppSidebar({
  role,
  displayName,
}: {
  role: string | null;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { main, modules } = navForRole(role);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const initials = (displayName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel =
    role === "mentor" ? "Mentor" : role === "parent" ? "Parent" : "Mentee";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Leaf className="size-5 text-primary" />
        <span className="font-display text-xl font-black text-primary">
          Ikigai
        </span>
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{greeting}</p>
            <p className="text-sm font-semibold leading-tight text-foreground">
              {displayName ?? roleLabel}
            </p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {main.map((item) => {
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

        {modules && modules.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Modules
            </p>
            <div className="space-y-0.5">
              {modules.map((item) => {
                const isActive = pathname.startsWith(item.href);
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
          </div>
        )}
      </nav>

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
