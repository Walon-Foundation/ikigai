"use client";

import { useClerk } from "@clerk/nextjs";
import {
  Bell,
  ChevronRight,
  Download,
  Lock,
  LogOut,
  Monitor,
  Share,
  Smartphone,
  User,
} from "lucide-react";
import { useState, useTransition } from "react";
import { savePushSubscription } from "@/app/(pwa)/(app)/settings/actions";
import { AvatarUpload } from "@/components/avatar-upload";
import { PageHeader } from "@/components/page-header";
import { BusyLabel, Spinner } from "@/components/spinner";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { usePwaInstall } from "@/lib/use-pwa-install";
import { cn } from "@/lib/utils";

type DbUser = {
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  growthLevel: number | null;
  interestTags: string[] | null;
  pushEnabled?: boolean;
};

const PUSH_ERROR: Record<string, string> = {
  unsupported: "Push isn't supported on this browser.",
  denied: "Notifications are blocked. Enable them in your browser settings.",
  "no-key": "Push isn't configured on the server yet.",
  error: "Couldn't enable push. Please try again.",
};

export function SettingsClient({ user }: { user: DbUser }) {
  const [liteMode, setLiteMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("liteMode") === "true";
  });
  const [pushEnabled, setPushEnabled] = useState(user.pushEnabled ?? false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [isPushPending, startPushTransition] = useTransition();
  const [journalPrivacy, setJournalPrivacy] = useState(true);
  const [isSigningOut, startSignOutTransition] = useTransition();
  const { signOut } = useClerk();
  const { prompt, isIOS, isInstalled, dismissed, install } = usePwaInstall();

  function handlePushToggle(next: boolean) {
    setPushError(null);
    startPushTransition(async () => {
      if (next) {
        const result = await subscribeToPush(savePushSubscription);
        if (result.ok) {
          setPushEnabled(true);
        } else {
          setPushError(PUSH_ERROR[result.reason] ?? PUSH_ERROR.error);
        }
      } else {
        await unsubscribeFromPush();
        await savePushSubscription(null).catch(() => {});
        setPushEnabled(false);
      }
    });
  }

  function handleSignOut() {
    startSignOutTransition(async () => {
      await signOut({ redirectUrl: "/" });
    });
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Profile */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <AvatarUpload
              name={user.displayName ?? "User"}
              initialUrl={user.avatarUrl}
              size={56}
              showCaption={false}
            />
            <div>
              <p className="font-semibold text-foreground">
                {user.displayName ?? "User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user.role === "mentor"
                  ? "Mentor"
                  : user.role === "parent"
                    ? "Parent / Guardian"
                    : `Mentee · Level ${user.growthLevel ?? 1}`}
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
            onChange={handlePushToggle}
            pending={isPushPending}
          />
          {pushError && (
            <p className="mt-2 text-xs text-destructive">{pushError}</p>
          )}
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
            Edit interests
          </button>
        </div>

        {/* Install app — `=== false`, not `!isInstalled`: until the browser has
            been asked this is null, and rendering the card on null would show it
            to installed users for a frame before it disappeared. */}
        {isInstalled === false && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
                <Smartphone className="size-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Install Ikigai
                </p>
                <p className="text-xs text-muted-foreground">
                  Add to your home screen for offline access
                </p>
              </div>
            </div>
            <div className="mt-4">
              {isIOS ? (
                <p className="text-sm text-muted-foreground">
                  Tap{" "}
                  <Share className="mb-0.5 inline size-3.5 text-foreground" />{" "}
                  in your browser, then tap{" "}
                  <strong className="text-foreground">
                    Add to Home Screen
                  </strong>
                  .
                </p>
              ) : prompt ? (
                <button
                  type="button"
                  onClick={install}
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <Download className="size-4" />
                  Install App
                </button>
              ) : dismissed ? (
                <p className="text-sm text-muted-foreground">
                  Install cancelled. Reload this page to try again, or use your
                  browser&apos;s menu.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Open this page in Chrome or Safari to install.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-busy={isSigningOut}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left text-destructive hover:bg-muted disabled:opacity-60"
        >
          <BusyLabel pending={isSigningOut} busy="Signing out…">
            <LogOut className="size-4" />
            <span className="text-sm font-medium">Sign out</span>
          </BusyLabel>
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
  pending,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        {pending && <Spinner className="size-4" />}
        <button
          type="button"
          onClick={() => onChange(!value)}
          disabled={pending}
          aria-busy={pending}
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
    </div>
  );
}
