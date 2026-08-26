"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { promoteMentee } from "../actions";

const STAGE_LABELS: Record<string, string> = {
  discover: "Discover",
  thrive: "Thrive",
  build: "Build",
  lead: "Lead",
};

type Readiness = {
  stage: string;
  nextStage: string | null;
  daysInStage: number;
  completedTasks: number;
  ready: boolean;
  blockedReason: string | null;
};

// The stage promotion control. Mentor-only — there is no mentee equivalent of
// this anywhere in the app.
//
// When the pacing floor is not met the button is disabled AND the reason is
// spelled out. A disabled control with no explanation is the worst of both: the
// mentor cannot act and cannot find out why, so they assume the app is broken.
export function StagePromotion({
  mentorshipId,
  menteeName,
  readiness,
}: {
  mentorshipId: string;
  menteeName: string;
  readiness: Readiness;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const current = STAGE_LABELS[readiness.stage] ?? readiness.stage;
  const next = readiness.nextStage
    ? (STAGE_LABELS[readiness.nextStage] ?? readiness.nextStage)
    : null;

  function promote() {
    startTransition(async () => {
      try {
        const result = await promoteMentee(mentorshipId);
        if (!result.ok) {
          toast({
            variant: "error",
            title: "Not yet",
            description: result.reason ?? "Couldn't promote right now.",
          });
          return;
        }
        toast({
          title: `${menteeName} is now at ${STAGE_LABELS[result.to ?? ""] ?? result.to}`,
          description: "They've been notified, and new milestones are open.",
        });
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Couldn't save that",
          description: "Check you're online and try again.",
        });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Programme stage
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
          {current}
        </span>
        {next && (
          <>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="rounded-full border border-dashed border-border px-3 py-1 text-sm font-semibold text-muted-foreground">
              {next}
            </span>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {readiness.completedTasks} completed task
        {readiness.completedTasks === 1 ? "" : "s"} in this stage ·{" "}
        {readiness.daysInStage} day
        {readiness.daysInStage === 1 ? "" : "s"} at {current}
      </p>

      {next ? (
        <>
          <button
            type="button"
            onClick={promote}
            disabled={pending || !readiness.ready}
            aria-busy={pending}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            <BusyLabel pending={pending} busy="Promoting…">
              {!readiness.ready && <Lock className="size-3.5" />}
              Move {menteeName} to {next}
            </BusyLabel>
          </button>
          {!readiness.ready && readiness.blockedReason && (
            <p className="mt-2 text-xs text-muted-foreground">
              {readiness.blockedReason}
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {menteeName} has reached the final stage.
        </p>
      )}
    </div>
  );
}
