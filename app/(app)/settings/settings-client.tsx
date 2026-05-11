"use client";

import { useClerk } from "@clerk/nextjs";
import { Bell, ChevronRight, Lock, LogOut, Monitor, User } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type DbUser = {
  displayName: string | null;
  role: string;
  growthLevel: number | null;
  interestTags: string[] | null;
};

export function SettingsClient({ user }: { user: DbUser }) {
  const [liteMode, setLiteMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("liteMode") === "true";
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [journalPrivacy, setJournalPrivacy] = useState(true);
  const { signOut } = useClerk();

  const initials = (user.displayName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      <PageHeader title="Settings" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Profile */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {user.displayName ?? "User"}
              </p>
              <p className="text-sm capitalize text-muted-foreground">
                {user.role.replace("_", " ")} · Level {user.growthLevel ?? 1}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <User className="size-4" />
              Edit Profile
            </div>
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={Bell}>
          <ToggleRow
            label="Push Notifications"
            desc="Mentor matches, milestones, nudges"
            value={pushEnabled}
            onChange={setPushEnabled}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy" icon={Lock}>
          <ToggleRow
            label="Journal visible to mentor by default"
            desc="Mentors can see 'Mentor Only' entries"
            value={journalPrivacy}
            onChange={setJournalPrivacy}
          />
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Data &amp; Privacy
              </p>
              <p className="text-xs text-muted-foreground">
                Download or delete your data
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </SettingsSection>

        {/* Accessibility */}
        <SettingsSection title="Accessibility" icon={Monitor}>
          <ToggleRow
            label="Lite Mode"
            desc="Text only — no images. Saves data."
            value={liteMode}
            onChange={(v) => {
              setLiteMode(v);
              localStorage.setItem("liteMode", String(v));
              document.documentElement.setAttribute("data-lite", String(v));
            }}
          />
        </SettingsSection>

        {/* Interests */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Interests
          </p>
          <div className="flex flex-wrap gap-2">
            {(user.interestTags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-muted/20 px-3 py-1 text-xs font-medium capitalize text-primary"
              >
                {tag.replace("_", " ")}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-primary"
          >
            Edit interests →
          </button>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left text-destructive hover:bg-muted"
        >
          <LogOut className="size-4" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </>
  );
}

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
          value ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
