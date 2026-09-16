import { Check, MapPin } from "lucide-react";
import Link from "next/link";
import { MEETINGS, meetingName } from "@/lib/verification";

// The shared mentee↔mentor journey track. Session 1 is the Finding Yourself
// Picnic. Both parties see the same track; it reads verified in-person meetings
// to show progress. Presentational — pass the set of verified meeting numbers.
export function SharedMilestones({
  mentorshipId,
  verifiedNumbers,
}: {
  mentorshipId: string;
  verifiedNumbers: number[];
}) {
  const verified = new Set(verifiedNumbers);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-1 font-display text-base font-bold text-foreground">
        Your journey together
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        It starts with a Finding Yourself Picnic 🧺 — a relaxed first meeting to
        get to know each other.
      </p>
      <ol className="space-y-3">
        {MEETINGS.map((m) => {
          const done = verified.has(m.number);
          const isNext =
            !done && (m.number === 1 || verified.has(m.number - 1));
          return (
            <li key={m.number} className="flex items-start gap-3">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : isNext
                      ? "border-2 border-primary text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-4" /> : m.number}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {m.number === 1 && (
                    <MapPin className="mr-1 inline size-3.5 text-primary" />
                  )}
                  {meetingName(m.number)}
                </p>
                <p className="text-xs text-muted-foreground">{m.blurb}</p>
                {isNext && (
                  <Link
                    href={`/mentorship/${mentorshipId}/verify`}
                    className="mt-1 inline-block text-xs font-semibold text-primary"
                  >
                    Plan & verify this session →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
