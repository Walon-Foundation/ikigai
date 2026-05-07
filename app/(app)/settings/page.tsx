"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Lock,
  Monitor,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_USER } from "@/lib/mock-data";

export default function SettingsPage() {
  const [liteMode, setLiteMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [journalPrivacy, setJournalPrivacy] = useState(true);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">
          Settings
        </h1>
      </div>

      {/* Profile */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
            AK
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {MOCK_USER.displayName}
            </p>
            <p className="text-sm capitalize text-muted-foreground">
              {MOCK_USER.role.replace("_", " ")} · Level {MOCK_USER.growthLevel}
            </p>
          </div>
        </div>
        <button className="mt-4 flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
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
            <p className="text-sm font-medium text-foreground">Data & Privacy</p>
            <p className="text-xs text-muted-foreground">Download or delete your data</p>
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
          onChange={setLiteMode}
        />
      </SettingsSection>

      {/* Interests */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Interests
        </p>
        <div className="flex flex-wrap gap-2">
          {MOCK_USER.interestTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary-muted/20 px-3 py-1 text-xs font-medium capitalize text-primary"
            >
              {tag.replace("_", " ")}
            </span>
          ))}
        </div>
        <button className="mt-3 text-xs font-medium text-primary">
          Edit interests →
        </button>
      </div>

      {/* Sign out */}
      <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left text-destructive hover:bg-muted">
        <LogOut className="size-4" />
        <span className="text-sm font-medium">Sign out</span>
      </button>
    </div>
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
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
