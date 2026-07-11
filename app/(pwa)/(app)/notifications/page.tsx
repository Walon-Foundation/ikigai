"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useNotifications } from "@/components/notifications";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { items, markAllRead } = useNotifications();

  // Opening the feed clears the unread badge.
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <>
      <PageHeader title="Notifications" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Bell className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You're all caught up. Notifications about matches, messages and
              milestones will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const className = cn(
                "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                n.read
                  ? "border-border bg-card"
                  : "border-primary/30 bg-primary/5",
              );
              const inner = (
                <>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(n.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {n.body}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </>
              );
              return n.url ? (
                <Link key={n.id} href={n.url} className={className}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
