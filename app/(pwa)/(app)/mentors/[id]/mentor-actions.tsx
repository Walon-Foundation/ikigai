"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestMentor } from "../../mentorship/actions";
import { submitMentorReview } from "../actions";

export function RequestMentorButton({
  mentorId,
  alreadyRequested,
}: {
  mentorId: string;
  alreadyRequested: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRequest() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await requestMentor(mentorId);
        router.push(`/mentorship/${res.mentorshipId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not request mentor");
      }
    });
  }

  if (alreadyRequested) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-muted py-3 font-semibold text-muted-foreground"
      >
        Request sent
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={pending}
        className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
      >
        {pending ? "Requesting…" : "Request mentorship"}
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ReviewForm({
  mentorId,
  initialRating,
  initialComment,
}: {
  mentorId: string;
  initialRating: number;
  initialComment: string;
}) {
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState(initialComment);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit() {
    if (rating < 1) return;
    startTransition(async () => {
      await submitMentorReview({ mentorId, rating, comment });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-2 text-sm font-semibold text-foreground">
        Leave a review
      </p>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={
                n <= rating
                  ? "size-6 fill-accent text-accent"
                  : "size-6 text-muted-foreground"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Share your experience (optional)…"
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending || rating < 1}
        className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        {pending ? "Saving…" : done ? "Saved ✓" : "Submit review"}
      </button>
    </div>
  );
}
