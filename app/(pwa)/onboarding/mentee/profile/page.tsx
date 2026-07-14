"use client";

import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { useTransition } from "react";
import { AvatarUpload } from "@/components/avatar-upload";
import { BusyLabel } from "@/components/spinner";
import { completeMenteeOnboarding } from "../../actions";

export default function MenteeProfilePage() {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-6">
        <AvatarUpload
          name={user?.fullName ?? user?.firstName ?? "You"}
          initialUrl={user?.imageUrl}
        />
      </div>
      <h2 className="font-display mb-3 text-4xl font-black text-foreground">
        You&apos;re an Explorer!
      </h2>
      <p className="mb-2 text-lg font-semibold text-primary">Level 1</p>
      <p className="mb-10 max-w-md text-muted-foreground">
        We&apos;ve used your answers to build your Purpose Profile. Your
        personalised dashboard and mentor matches are ready.
      </p>

      <div className="mb-8 w-full rounded-2xl border border-border bg-card p-6 text-left">
        <p className="mb-4 text-sm font-semibold text-foreground">
          Your first milestones
        </p>
        <ul className="space-y-2">
          {[
            { label: "Complete the Purpose Quiz", done: true },
            { label: "Get matched with a mentor", done: false },
            { label: "Write your first journal entry", done: false },
            { label: "Complete the Safety Module", done: false },
          ].map((m) => (
            <li key={m.label} className="flex items-center gap-3 text-sm">
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded-full ${m.done ? "bg-primary" : "border-2 border-dashed border-border"}`}
              >
                {m.done && <Check className="size-3 text-primary-foreground" />}
              </div>
              <span
                className={m.done ? "text-foreground" : "text-muted-foreground"}
              >
                {m.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => completeMenteeOnboarding())}
        disabled={isPending}
        aria-busy={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground disabled:opacity-60"
      >
        <BusyLabel pending={isPending} busy="Finishing…">
          Go to My Dashboard
        </BusyLabel>
      </button>
    </div>
  );
}
