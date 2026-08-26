"use client";

import { Check, ChevronDown, Lock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitMilestone } from "@/app/(pwa)/(app)/journey/skill-actions";
import { BusyLabel } from "@/components/spinner";
import { SKILL_STAGE_LABELS, SKILL_STAGES } from "@/lib/skill-stages";
import type { SkillTrackView } from "@/lib/skill-tracks";
import { cn } from "@/lib/utils";

export function SkillTracks({ tracks }: { tracks: SkillTrackView[] }) {
  const [openId, setOpenId] = useState<string | null>(
    tracks.length === 1 ? (tracks[0]?.id ?? null) : null,
  );

  if (tracks.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your skills
      </p>
      <div className="space-y-2">
        {tracks.map((track) => (
          <SkillTrackCard
            key={track.id}
            track={track}
            open={openId === track.id}
            onToggle={() =>
              setOpenId((id) => (id === track.id ? null : track.id))
            }
          />
        ))}
      </div>
    </div>
  );
}

function SkillTrackCard({
  track,
  open,
  onToggle,
}: {
  track: SkillTrackView;
  open: boolean;
  onToggle: () => void;
}) {
  const percent =
    track.totalCount > 0
      ? Math.round((track.completedCount / track.totalCount) * 100)
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {track.interestTag}
            </span>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {SKILL_STAGE_LABELS[track.currentStage]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {track.categoryName} · {track.completedCount}/{track.totalCount}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-4 pt-3">
          {track.totalCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Milestones for this skill are coming soon.
            </p>
          ) : (
            SKILL_STAGES.map((stage) => {
              const items = track.milestones.filter((m) => m.stage === stage);
              if (items.length === 0) return null;
              return (
                <div key={stage}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {SKILL_STAGE_LABELS[stage]}
                  </p>
                  <div className="space-y-2">
                    {items.map((milestone) => (
                      <MilestoneRow key={milestone.id} milestone={milestone} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function MilestoneRow({
  milestone,
}: {
  milestone: SkillTrackView["milestones"][number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function run(fn: () => Promise<unknown>) {
    setBusy(true);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } finally {
        setBusy(false);
      }
    });
  }

  const done = milestone.status === "done";
  const locked = milestone.status === "locked";
  const submitted = milestone.status === "submitted";

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-primary"
            : locked
              ? "border-2 border-dashed border-border"
              : "border-2 border-primary/40",
        )}
      >
        {done ? (
          <Check className="size-3.5 text-primary-foreground" />
        ) : locked ? (
          <Lock className="size-3 text-muted-foreground" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            done
              ? "text-muted-foreground line-through"
              : locked
                ? "text-muted-foreground"
                : "text-foreground",
          )}
        >
          {milestone.label}
        </p>
        {submitted && (
          <p className="mt-0.5 text-xs text-accent">Waiting on your mentor</p>
        )}
        {milestone.mentorFeedback && (
          <p className="mt-1 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs text-foreground">
            {milestone.mentorFeedback}
          </p>
        )}
        {milestone.status === "available" && (
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy}
            onClick={() => run(() => submitMilestone(milestone.id))}
            className="mt-1.5 flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary disabled:opacity-50"
          >
            {/* One button, always "submit". A "Mark done" branch used to sit
                opposite this for milestones whose template did not require
                review; a mentee marking their own milestone done is the thing
                the programme rule forbids. */}
            <BusyLabel pending={busy} busy="Saving…">
              <Send className="size-3" /> Submit to mentor
            </BusyLabel>
          </button>
        )}
      </div>
    </div>
  );
}
