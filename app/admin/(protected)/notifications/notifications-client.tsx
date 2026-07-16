"use client";

import { Bell, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { sendBroadcast } from "./actions";

const AUDIENCES = [
  { value: "all", label: "All Users" },
  { value: "mentees", label: "Mentees only" },
  { value: "mentors", label: "Mentors only" },
  { value: "club_leads", label: "Club Leads" },
];

type NotifHistory = {
  id: string;
  title: string;
  body: string;
  type: string | null;
  sentAt: Date | null;
};

export function NotificationsClient({ history }: { history: NotifHistory[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setFailed(false);
    setSentCount(null);
    startTransition(async () => {
      try {
        // This used to be `setSent(true)` and nothing else — no request, no
        // write, no delivery. The button said "Sent! ✓" and not one person
        // received anything.
        const { sent } = await sendBroadcast({ title, body, audience });
        setSentCount(sent);
        // Clear only after it actually went, so a failure doesn't destroy a
        // message the admin may have spent a while composing.
        setTitle("");
        setBody("");
        // The history panel below is server-rendered from push_notifications.
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Compose */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Compose Notification
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="notif-title"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Title
            </label>
            <input
              id="notif-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="notif-body"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Message
            </label>
            <textarea
              id="notif-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification body text..."
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="notif-audience"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Audience
            </label>
            <select
              id="notif-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {(title || body) && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </p>
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {title || "Title"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {body || "Message body"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={pending || !title.trim() || !body.trim()}
            aria-busy={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
          >
            <BusyLabel pending={pending} busy="Sending…">
              <Send className="size-4" />
              Send Notification
            </BusyLabel>
          </button>

          {sentCount !== null && (
            <p className="text-center text-sm font-semibold text-primary">
              Sent to {sentCount} {sentCount === 1 ? "person" : "people"} ✓
            </p>
          )}
          {failed && (
            <p className="text-center text-sm font-semibold text-destructive">
              Couldn&apos;t send — your message is still here, try again.
            </p>
          )}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Sent History
        </h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No notifications sent yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((notif) => (
              <div
                key={notif.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {notif.title}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                    {notif.type ?? "broadcast"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {notif.body}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {notif.sentAt && (
                    <span>
                      {new Date(notif.sentAt).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
