"use client";

import { Check, Loader2, Star, X } from "lucide-react";
import { useState, useTransition } from "react";
import { acceptRequest, declineRequest } from "./actions";

export type RequestItem = {
  id: string;
  menteeName: string;
  interestTags: string[] | null;
  matchScore: number | null;
};

export function PendingRequests({
  requests,
  atCapacity,
}: {
  requests: RequestItem[];
  atCapacity: boolean;
}) {
  if (requests.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pending requests
      </p>
      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} atCapacity={atCapacity} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  atCapacity,
}: {
  request: RequestItem;
  atCapacity: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initials =
    request.menteeName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || "M";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">
              {request.menteeName}
            </p>
            {request.matchScore !== null && (
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                <Star className="size-3 fill-accent text-accent" />
                {request.matchScore}%
              </span>
            )}
          </div>
          {request.interestTags && request.interestTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {request.interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isPending || atCapacity}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await acceptRequest(request.id);
              if (!res.ok) {
                setError(
                  res.reason === "full"
                    ? "You already have the maximum of two active mentees."
                    : "This request is no longer available.",
                );
              }
            });
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Accept
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              await declineRequest(request.id);
            });
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <X className="size-4" /> Decline
        </button>
      </div>
      {atCapacity && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Free up a slot to accept new mentees (max two).
        </p>
      )}
    </div>
  );
}
