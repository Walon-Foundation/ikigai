"use client";

import { useState } from "react";
import { Send, Bell } from "lucide-react";
import { MOCK_SENT_NOTIFICATIONS } from "@/lib/mock-data";

const AUDIENCES = [
  { value: "all", label: "All Users" },
  { value: "mentees", label: "Mentees only" },
  { value: "mentors", label: "Mentors only" },
  { value: "club_leads", label: "Club Leads" },
];

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSent(true);
    setTitle("");
    setBody("");
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Push Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compose and send notifications to users
        </p>
      </div>

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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification body text..."
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Audience
              </label>
              <select
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

            {/* Preview */}
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
              onClick={handleSend}
              disabled={!title.trim() || !body.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-40 transition-colors"
            >
              <Send className="size-4" />
              {sent ? "Sent! ✓" : "Send Notification"}
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            Sent History
          </h2>
          <div className="space-y-3">
            {MOCK_SENT_NOTIFICATIONS.map((notif) => (
              <div
                key={notif.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {notif.title}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {notif.sent} sent
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {notif.body}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="capitalize rounded-full bg-muted px-2 py-0.5">
                    {notif.audience}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(notif.sentAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
