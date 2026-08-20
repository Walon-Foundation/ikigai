"use client";

import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { approveMilestone, requestRevision } from "./skill-review-actions";

export type PendingReviewItem = {
  milestoneId: string;
  label: string;
  interestTag: string;
};

export function SkillReview({
  menteeId,
  items,
}: {
  menteeId: string;
  items: PendingReviewItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Milestones awaiting your review
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <ReviewRow key={item.milestoneId} menteeId={menteeId} item={item} />
        ))}
      </div>
    </div>
  );
}

function ReviewRow({
  menteeId,
  item,
}: {
  menteeId: string;
  item: PendingReviewItem;
}) {
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"approve" | "revise" | null>(null);
  const [revising, setRevising] = useState(false);
  const [feedback, setFeedback] = useState("");

  function run(kind: "approve" | "revise", fn: () => Promise<unknown>) {
    setBusy(kind);
    startTransition(async () => {
      try {
        await fn();
        setRevising(false);
        setFeedback("");
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-sm font-semibold text-foreground">{item.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{item.interestTag}</p>

      {revising ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="What should they change?"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                run("revise", () =>
                  requestRevision(item.milestoneId, menteeId, feedback),
                )
              }
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-50"
            >
              <BusyLabel pending={busy === "revise"} busy="Sending…">
                Send back
              </BusyLabel>
            </button>
            <button
              type="button"
              onClick={() => setRevising(false)}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run("approve", () => approveMilestone(item.milestoneId, menteeId))
            }
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <BusyLabel pending={busy === "approve"} busy="Approving…">
              <Check className="size-3.5" /> Approve
            </BusyLabel>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setRevising(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground"
          >
            <X className="size-3.5" /> Request changes
          </button>
        </div>
      )}
    </div>
  );
}
