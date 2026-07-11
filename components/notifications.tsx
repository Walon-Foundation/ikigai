"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string | null;
  url: string | null;
  read: boolean;
  timestamp: string;
};

type NotificationsState = {
  items: NotificationItem[];
  unread: number;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    // Safe fallback so a bell rendered outside the provider doesn't crash.
    return {
      items: [],
      unread: 0,
      refresh: async () => {},
      markAllRead: async () => {},
    };
  }
  return ctx;
}

const POLL_MS = 15_000;

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  // Ids we've already surfaced as a toast — seeded on first load so the
  // existing backlog doesn't all pop at once.
  const seen = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: { unread: number; items: NotificationItem[] } =
        await res.json();
      setItems(data.items);
      setUnread(data.unread);

      if (seen.current === null) {
        seen.current = new Set(data.items.map((i) => i.id));
      } else {
        const fresh = data.items.filter(
          (i) => !i.read && !seen.current?.has(i.id),
        );
        for (const f of fresh) seen.current?.add(f.id);
        if (fresh.length > 0) {
          setToasts((prev) => [...fresh.reverse(), ...prev].slice(0, 4));
        }
      }
    } catch {
      // ignore network errors — will retry on next poll
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      // best effort
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Auto-dismiss toasts after a few seconds.
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <NotificationsContext.Provider
      value={{ items, unread, refresh, markAllRead }}
    >
      {children}
      {/* Toast stack */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <Link
            key={t.id}
            href={t.url ?? "/notifications"}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {t.title}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {t.body}
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(e) => {
                e.preventDefault();
                dismiss(t.id);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </Link>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

// Header bell with an unread badge. Links to the full feed.
export function NotificationBell() {
  const { unread } = useNotifications();
  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      className="relative flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary-muted/30 hover:text-primary"
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
