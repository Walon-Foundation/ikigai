"use client";

import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";
import { resetTemplate, saveRules, saveTemplate } from "./actions";

// One editable notification. Structurally the same as the app-copy blocks —
// a fixed list of keys the admin edits rather than a list they add to, because
// the keys come from lib/notifications/catalog.ts and a row here that matches
// no key would simply never be read.

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export type TemplateRow = {
  key: string;
  category: string;
  audience: string;
  alwaysOn: boolean;
  /** What ships in code, shown as the placeholder so the default is visible. */
  defaultTitle: string;
  defaultBody: string;
  defaultCooldown: number | null;
  /** What the admin has overridden, if anything. */
  title: string;
  body: string;
  enabled: boolean;
  channels: string[];
  priority: string;
  cooldownHours: string;
  overridden: boolean;
};

const CHANNELS = [
  { id: "inapp", label: "In-app" },
  { id: "push", label: "Push" },
  { id: "email", label: "Email" },
];

export function TemplateEditor({ row }: { row: TemplateRow }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState(row.priority);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    const v: Record<string, string> = {};
    for (const [k, value] of formData.entries()) v[k] = String(value);
    startTransition(async () => {
      try {
        await saveTemplate(row.key, v);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      try {
        await resetTemplate(row.key);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not reset");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          {row.key}
        </h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
          {row.category}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
          to {row.audience}
        </span>
        {row.overridden && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-foreground">
            edited
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor={`${row.key}-title`} className={labelClass}>
            Title
          </label>
          <input
            id={`${row.key}-title`}
            name="title"
            defaultValue={row.title}
            placeholder={row.defaultTitle}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${row.key}-body`} className={labelClass}>
            Message
          </label>
          <textarea
            id={`${row.key}-body`}
            name="body"
            rows={2}
            defaultValue={row.body}
            placeholder={row.defaultBody}
            className={cn(inputClass, "resize-none")}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Leave both empty to use the wording that ships with the app (shown
            greyed out above). Anything in {"{{"}double braces{"}}"} is filled
            in when the notification is sent — keep it exactly as it appears.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Channels</span>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-1.5 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name={`channel_${c.id}`}
                    defaultChecked={row.channels.includes(c.id)}
                    className="size-4 rounded border-border"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {priority === "low" && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Low priority never sends a push, whatever is ticked here.
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${row.key}-priority`} className={labelClass}>
              Priority
            </label>
            <select
              id={`${row.key}-priority`}
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputClass}
            >
              <option value="high">High — interrupt them</option>
              <option value="medium">Medium — push allowed</option>
              <option value="low">Low — in-app only</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${row.key}-cooldown`} className={labelClass}>
              Cooldown (hours)
            </label>
            <input
              id={`${row.key}-cooldown`}
              name="cooldownHours"
              inputMode="numeric"
              defaultValue={row.cooldownHours}
              placeholder={
                row.defaultCooldown === null
                  ? "no limit"
                  : String(row.defaultCooldown)
              }
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              The least time between two of these for one person.
            </p>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={row.enabled}
                disabled={row.alwaysOn}
                className="size-4 rounded border-border"
              />
              {row.alwaysOn ? "Always on (safety and account)" : "Switched on"}
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
          >
            <BusyLabel pending={pending} busy="Saving…">
              {saved ? "Saved ✓" : "Save"}
            </BusyLabel>
          </button>
          {row.overridden && (
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export function RulesEditor({ values }: { values: Record<string, string> }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    const v: Record<string, string> = {};
    for (const [k, value] of formData.entries()) v[k] = String(value);
    startTransition(async () => {
      try {
        await saveRules(v);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  const fields = [
    {
      name: "menteeInactiveDays",
      label: "Nudge a mentee after (days away)",
    },
    {
      name: "menteeInactiveLongDays",
      label: "Softer message after (days away)",
    },
    {
      name: "mentorNudgeDays",
      label: "Prompt a mentor after (days without messaging)",
    },
    {
      name: "mentorInactiveDays",
      label: "Tell the mentor their mentee is away after (days)",
    },
  ];

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 className="font-display text-lg font-bold text-foreground">Timing</h2>
      <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
        When the scheduled reminders fire. They run once a day, and each one is
        still limited by its own cooldown below.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`rule-${f.name}`} className={labelClass}>
              {f.label}
            </label>
            <input
              id={`rule-${f.name}`}
              name={f.name}
              inputMode="numeric"
              defaultValue={values[f.name]}
              className={inputClass}
            />
          </div>
        ))}

        <div>
          <label htmlFor="rule-weeklySummaryWeekday" className={labelClass}>
            Weekly summary day
          </label>
          <select
            id="rule-weeklySummaryWeekday"
            name="weeklySummaryWeekday"
            defaultValue={values.weeklySummaryWeekday}
            className={inputClass}
          >
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day, i) => (
              <option key={day} value={String(i)}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
      >
        <BusyLabel pending={pending} busy="Saving…">
          {saved ? "Saved ✓" : "Save"}
        </BusyLabel>
      </button>
    </form>
  );
}
