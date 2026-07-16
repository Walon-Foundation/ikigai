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
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  savePushSubscription,
  updateInterests,
  updateJournalDefault,
  updateProfile,
} from "@/app/(pwa)/(app)/settings/actions";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "@/app/(pwa)/(app)/settings/deletion-actions";
import { AvatarUpload } from "@/components/avatar-upload";
import { PageHeader } from "@/components/page-header";
import { BusyLabel, Spinner } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { INTEREST_TAGS } from "@/lib/constants";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { usePwaInstall } from "@/lib/use-pwa-install";
import { cn } from "@/lib/utils";

type DbUser = {
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  growthLevel: number | null;
  interestTags: string[] | null;
  pushEnabled?: boolean;
  journalMentorDefault?: boolean;
  deletionRequestedAt?: string | null;
  deletionGraceDays?: number;
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
  const [journalPrivacy, setJournalPrivacy] = useState(
    user.journalMentorDefault ?? false,
  );
  const [journalError, setJournalError] = useState(false);
  const [isJournalPending, startJournalTransition] = useTransition();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [isSigningOut, startSignOutTransition] = useTransition();
  const { signOut } = useClerk();
  const { prompt, isIOS, isInstalled, dismissed, install } = usePwaInstall();

  // This one is a privacy control, so a failure has to be visible and the
  // switch has to go back where it was. Silently showing "mentor can't see my
  // journal" over a database that says otherwise is the whole bug this fixes.
  function handleJournalToggle(next: boolean) {
    setJournalError(false);
    setJournalPrivacy(next);
    startJournalTransition(async () => {
      try {
        await updateJournalDefault(next);
      } catch {
        setJournalPrivacy(!next);
        setJournalError(true);
      }
    });
  }

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
          {editingProfile ? (
            <ProfileForm
              initialName={user.displayName ?? ""}
              initialBio={user.bio ?? ""}
              onDone={() => setEditingProfile(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <User className="size-4" />
                Edit Profile
              </div>
              <ChevronRight className="size-4" />
            </button>
          )}
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
            desc="New entries start as 'Mentor Only' instead of Private"
            value={journalPrivacy}
            onChange={handleJournalToggle}
            pending={isJournalPending}
          />
          {journalError && (
            <p className="mt-2 text-xs font-semibold text-destructive">
              Couldn&apos;t save that — your journal setting is unchanged.
            </p>
          )}
          <DataPrivacy
            deletionRequestedAt={user.deletionRequestedAt ?? null}
            graceDays={user.deletionGraceDays ?? 30}
          />
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
          {editingInterests ? (
            <InterestsForm
              initialTags={user.interestTags ?? []}
              onDone={() => setEditingInterests(false)}
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {(user.interestTags ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No interests yet — they help us match you with the right
                    mentor.
                  </p>
                ) : (
                  (user.interestTags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-muted/20 px-3 py-1 text-xs font-medium capitalize text-primary"
                    >
                      {tag.replace("_", " ")}
                    </span>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingInterests(true)}
                className="mt-3 text-xs font-medium text-primary"
              >
                Edit interests
              </button>
            </>
          )}
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

// "Download or delete your data" — the row that has always had a chevron and
// no behaviour behind it.
function DataPrivacy({
  deletionRequestedAt,
  graceDays,
}: {
  deletionRequestedAt: string | null;
  graceDays: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function requestDeletion() {
    setFailed(false);
    startTransition(async () => {
      try {
        await requestAccountDeletion();
        setConfirming(false);
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  function cancelDeletion() {
    setFailed(false);
    startTransition(async () => {
      try {
        await cancelAccountDeletion();
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  if (deletionRequestedAt) {
    const deletesOn = new Date(
      new Date(deletionRequestedAt).getTime() + graceDays * 86_400_000,
    );
    return (
      <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm font-semibold text-destructive">
          Your account is scheduled for deletion
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Everything will be erased on{" "}
          {deletesOn.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . You can still change your mind until then.
        </p>
        <button
          type="button"
          onClick={cancelDeletion}
          disabled={pending}
          aria-busy={pending}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          <BusyLabel pending={pending} busy="Cancelling…">
            Keep my account
          </BusyLabel>
        </button>
        {failed && (
          <p className="mt-2 text-xs font-semibold text-destructive">
            Couldn&apos;t do that — try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border p-3">
      <p className="text-sm font-medium text-foreground">Data &amp; Privacy</p>
      <p className="text-xs text-muted-foreground">
        Download or delete your data
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {/* A plain link, not fetch(): lets the browser handle the download and
            keeps the file out of JS memory entirely. */}
        <a
          href="/api/me/export"
          download
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <Download className="size-3.5" />
          Download my data
        </a>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
        >
          Delete my account
        </button>
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-xs text-foreground">
            Your profile, journal and goals will be erased after {graceDays}{" "}
            days. Your messages stay in your mentor&apos;s chat history, shown
            as &ldquo;Deleted user&rdquo;. You can cancel any time before then.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={requestDeletion}
              disabled={pending}
              aria-busy={pending}
              className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              <BusyLabel pending={pending} busy="Scheduling…">
                Yes, delete my account
              </BusyLabel>
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
          {failed && (
            <p className="mt-2 text-xs font-semibold text-destructive">
              Couldn&apos;t do that — try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileForm({
  initialName,
  initialBio,
  onDone,
}: {
  initialName: string;
  initialBio: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) return;
    setFailed(false);
    startTransition(async () => {
      try {
        await updateProfile({ displayName: name, bio });
        // The form closes on success, taking any inline confirmation with it.
        toast({ title: "Profile saved" });
        router.refresh();
        onDone();
      } catch {
        // Stay open and keep what they typed.
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <div>
        <label
          htmlFor="profile-name"
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Display name
        </label>
        <input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label
          htmlFor="profile-bio"
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          About you
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A sentence or two about yourself."
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending || !name.trim()}
          aria-busy={pending}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          <BusyLabel pending={pending} busy="Saving…">
            Save
          </BusyLabel>
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
      {failed && (
        <p className="text-xs font-semibold text-destructive">
          Couldn&apos;t save — your changes are still here, try again.
        </p>
      )}
    </div>
  );
}

function InterestsForm({
  initialTags,
  onDone,
}: {
  initialTags: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  }

  function save() {
    setFailed(false);
    startTransition(async () => {
      try {
        await updateInterests(tags);
        toast({
          title: "Interests saved",
          description: "We'll use these to suggest mentors.",
        });
        router.refresh();
        onDone();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            aria-pressed={tags.includes(tag)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              tags.includes(tag)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        These decide which mentors we suggest for you.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          aria-busy={pending}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          <BusyLabel pending={pending} busy="Saving…">
            Save
          </BusyLabel>
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
      {failed && (
        <p className="text-xs font-semibold text-destructive">
          Couldn&apos;t save — your choices are still here, try again.
        </p>
      )}
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
