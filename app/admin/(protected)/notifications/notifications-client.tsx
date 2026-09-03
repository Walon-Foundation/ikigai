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
  { value: "parents", label: "Parents only" },
  { value: "club_leads", label: "Club Leads" },
];

type SendResult = { persisted: number; pushed: number; skipped: number };

type NotifHistory = {
  id: string;
  title: string;
  body: string;
  sentAt: string | null;
  recipients: number;
  /** Phones that actually lit up. */
  pushed: number;
  /** People who have opened it since. */
  opened: number;
};

type FieldErrors = Partial<Record<"title" | "body" | "url", string>>;

function validateUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.length > 300) return "Link is too long (max 300 characters)";
  let norm = raw;
  if (/^https?:\/\//i.test(norm)) {
    try {
      const parsed = new URL(norm);
      norm = parsed.pathname + parsed.search + parsed.hash || "/";
    } catch {
      return `Not a valid URL — use an in-app path like /dashboard`;
    }
  }
  if (!norm.startsWith("/")) return `Must start with / — e.g. /dashboard (you entered "${raw}")`;
  if (norm.startsWith("//") || norm.includes(":")) return `Must be an in-app path like /dashboard`;
  return null;
}

export function NotificationsClient({ history }: { history: NotifHistory[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!title.trim()) e.title = "Title is required";
    else if (title.trim().length > 200) e.title = "Title is too long (max 200)";
    if (!body.trim()) e.body = "Message is required";
    else if (body.trim().length > 1000) e.body = "Message is too long (max 1000)";
    const urlErr = validateUrl(url);
    if (urlErr) e.url = urlErr;
    return e;
  }

  function handleSend() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = errs.title || errs.body || errs.url;
      setError(first ?? null);
      return;
    }
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        // This used to be `setSent(true)` and nothing else — no request, no
        // write, no delivery. The button said "Sent! ✓" and not one person
        // received anything.
        setResult(await sendBroadcast({ title, body, audience, url }));
        // Clear only after it actually went, so a failure doesn't destroy a
        // message the admin may have spent a while composing.
        setTitle("");
        setBody("");
        setUrl("");
        setFieldErrors({});
        // The history panel below is server-rendered from push_notifications.
        router.refresh();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Couldn't send — your message is still here, try again.";
        // Map server field errors inline so the admin sees *where* to fix
        const next: FieldErrors = {};
        let generic: string | null = msg;
        if (/title/i.test(msg)) {
          next.title = msg;
          generic = null;
        } else if (/message|body/i.test(msg)) {
          next.body = msg;
          generic = null;
        } else if (/link|path|url/i.test(msg)) {
          next.url = msg;
          generic = null;
        }
        setFieldErrors((prev) => ({ ...prev, ...next }));
        setError(generic);
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
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="notif-title"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Title <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">{title.trim().length}/200</span>
            </div>
            <input
              id="notif-title"
              value={title}
              maxLength={200}
              aria-invalid={!!fieldErrors.title}
              aria-describedby={fieldErrors.title ? "notif-title-error" : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined }));
                if (error) setError(null);
              }}
              onBlur={() => {
                const errs = validate();
                if (errs.title) setFieldErrors((p) => ({ ...p, title: errs.title }));
              }}
              placeholder="Notification title"
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground ${
                fieldErrors.title
                  ? "border-destructive focus:border-destructive"
                  : "border-border focus:border-primary"
              }`}
            />
            {fieldErrors.title && (
              <p id="notif-title-error" className="mt-1.5 text-xs font-medium text-destructive" role="alert">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="notif-body"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Message <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">{body.trim().length}/1000</span>
            </div>
            <textarea
              id="notif-body"
              value={body}
              maxLength={1000}
              aria-invalid={!!fieldErrors.body}
              aria-describedby={fieldErrors.body ? "notif-body-error" : undefined}
              onChange={(e) => {
                setBody(e.target.value);
                if (fieldErrors.body) setFieldErrors((p) => ({ ...p, body: undefined }));
                if (error) setError(null);
              }}
              onBlur={() => {
                const errs = validate();
                if (errs.body) setFieldErrors((p) => ({ ...p, body: errs.body }));
              }}
              placeholder="Notification body text..."
              rows={4}
              className={`w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground ${
                fieldErrors.body
                  ? "border-destructive focus:border-destructive"
                  : "border-border focus:border-primary"
              }`}
            />
            {fieldErrors.body && (
              <p id="notif-body-error" className="mt-1.5 text-xs font-medium text-destructive" role="alert">
                {fieldErrors.body}
              </p>
            )}
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

          <div>
            <label
              htmlFor="notif-url"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Opens (optional)
            </label>
            <input
              id="notif-url"
              value={url}
              maxLength={300}
              aria-invalid={!!fieldErrors.url}
              aria-describedby={fieldErrors.url ? "notif-url-error" : "notif-url-help"}
              onChange={(e) => {
                setUrl(e.target.value);
                if (fieldErrors.url) setFieldErrors((p) => ({ ...p, url: undefined }));
                if (error) setError(null);
              }}
              onBlur={() => {
                const err = validateUrl(url);
                if (err) setFieldErrors((p) => ({ ...p, url: err }));
              }}
              placeholder="/dashboard"
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground ${
                fieldErrors.url
                  ? "border-destructive focus:border-destructive"
                  : "border-border focus:border-primary"
              }`}
            />
            {fieldErrors.url ? (
              <p id="notif-url-error" className="mt-1.5 text-xs font-medium text-destructive" role="alert">
                {fieldErrors.url}
              </p>
            ) : (
              <p id="notif-url-help" className="mt-1.5 text-xs text-muted-foreground">
                Where tapping the notification takes people. An in-app path such
                as <code>/activities</code>. Defaults to the dashboard. You can also paste a full URL — we&apos;ll use its path.
              </p>
            )}
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
            disabled={pending}
            aria-busy={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
          >
            <BusyLabel pending={pending} busy="Sending…">
              <Send className="size-4" />
              Send Notification
            </BusyLabel>
          </button>
          <p className="text-center text-[10px] text-muted-foreground">
            {pending ? "Sending to selected audience…" : "Title and message are required"}
          </p>

          {result && (
            <div className="space-y-1 text-center text-sm">
              <p className="font-semibold text-primary">
                Delivered to {result.persisted}{" "}
                {result.persisted === 1 ? "person" : "people"} ✓
              </p>
              {/* Two different numbers, deliberately both shown. The feed
                  count is everyone who will see this next time they open the
                  app; the push count is whose phone lit up now. Reporting only
                  the first as "sent" is how the old screen overstated reach. */}
              <p className="text-xs text-muted-foreground">
                {result.pushed} received a push notification
                {result.skipped > 0
                  ? ` · ${result.skipped} skipped (opted out or already sent)`
                  : ""}
              </p>
            </div>
          )}
          {error && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              role="alert"
            >
              {error}
            </div>
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
            No broadcasts sent yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((notif) => (
              <div
                key={notif.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {notif.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {notif.recipients}{" "}
                    {notif.recipients === 1 ? "person" : "people"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {notif.body}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  {notif.sentAt && (
                    <span>
                      {new Date(notif.sentAt).toLocaleDateString("en-GB")}
                    </span>
                  )}
                  <span>· {notif.pushed} pushed</span>
                  <span>· {notif.opened} opened</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
