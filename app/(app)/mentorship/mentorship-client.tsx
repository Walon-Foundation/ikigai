"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type MentorUser = {
  id: string;
  displayName: string | null;
  bio: string | null;
  interestTags: string[] | null;
  matchScore?: number;
};

type ActiveMentorship = {
  id: string;
  status: string | null;
  matchScore: number | null;
  lastActivityAt: string | null;
  mentor: MentorUser | null;
};

type Props = {
  activeMentorships: ActiveMentorship[];
  suggestedMentors: MentorUser[];
};

export function MentorshipClient({ activeMentorships, suggestedMentors }: Props) {
  const [showMatches, setShowMatches] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">Mentorship</h1>
        <p className="text-sm text-muted-foreground">Your connections and Vibe-Match</p>
      </div>

      {/* Active Mentorships */}
      {activeMentorships.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Mentorship
          </p>
          {activeMentorships.map((m) => (
            <Link
              key={m.id}
              href={`/mentorship/${m.id}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-lg font-bold text-primary">
                {m.mentor?.displayName
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") ?? "M"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">
                    {m.mentor?.displayName ?? "Mentor"}
                  </p>
                  <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {m.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {m.mentor?.bio ?? m.mentor?.interestTags?.join(", ")}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {m.matchScore && (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="size-3 fill-accent text-accent" />
                        <span>{m.matchScore}% match</span>
                      </div>
                      <span>·</span>
                    </>
                  )}
                  {m.lastActivityAt && (
                    <span>Last active {new Date(m.lastActivityAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <MessageCircle className="size-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      {/* Vibe-Match */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Vibe-Match</p>
            <p className="text-sm text-muted-foreground">Find your perfect mentor</p>
          </div>
          <Users className="size-6 text-primary" />
        </div>

        {!showMatches ? (
          <button
            onClick={() => setShowMatches(true)}
            className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
          >
            Find a Mentor
          </button>
        ) : suggestedMentors.length === 0 ? (
          <div className="mt-4 rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            No mentors available yet. Check back soon.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {suggestedMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MentorCard({ mentor }: { mentor: MentorUser }) {
  const [connected, setConnected] = useState(false);

  const initials = mentor.displayName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") ?? "M";

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{mentor.displayName}</p>
            {mentor.matchScore && (
              <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                <Star className="size-3 fill-accent text-accent" />
                {mentor.matchScore}%
              </div>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{mentor.bio}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(mentor.interestTags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setConnected(true)}
        disabled={connected}
        className={cn(
          "mt-3 w-full rounded-full py-2 text-sm font-semibold transition-colors",
          connected
            ? "bg-muted text-muted-foreground cursor-default"
            : "bg-primary text-primary-foreground hover:bg-primary-light"
        )}
      >
        {connected ? "Request Sent ✓" : "Connect"}
      </button>
    </div>
  );
}
