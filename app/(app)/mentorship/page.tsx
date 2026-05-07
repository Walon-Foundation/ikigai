"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, ChevronRight, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_MENTORSHIPS, MOCK_MENTORS } from "@/lib/mock-data";

export default function MentorshipPage() {
  const [showMatches, setShowMatches] = useState(false);

  const activeMentorship = MOCK_MENTORSHIPS[0];
  const suggestedMentors = MOCK_MENTORS.filter(
    (m) => m.id !== activeMentorship.mentorId
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">
          Mentorship
        </h1>
        <p className="text-sm text-muted-foreground">
          Your connections and Vibe-Match
        </p>
      </div>

      {/* Active Mentorship */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Active Mentorship
        </p>
        <Link
          href={`/mentorship/${activeMentorship.id}`}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-lg font-bold text-primary">
            DS
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">
                {activeMentorship.mentor.displayName}
              </p>
              <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {activeMentorship.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {activeMentorship.mentor.bio}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="size-3 fill-accent text-accent" />
                <span>{activeMentorship.matchScore}% match</span>
              </div>
              <span>·</span>
              <span>
                Last active{" "}
                {new Date(activeMentorship.lastActivityAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <MessageCircle className="size-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Vibe-Match */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Vibe-Match</p>
            <p className="text-sm text-muted-foreground">
              Find your perfect mentor
            </p>
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
        ) : (
          <div className="mt-4 space-y-3">
            {MOCK_MENTORS.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MentorCard({
  mentor,
}: {
  mentor: (typeof MOCK_MENTORS)[number];
}) {
  const [connected, setConnected] = useState(
    mentor.status === "active" || mentor.status === "icebreaker"
  );

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
          {mentor.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{mentor.displayName}</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Star className="size-3 fill-accent text-accent" />
              {mentor.matchScore}%
            </div>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{mentor.bio}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {mentor.interestTags.map((tag) => (
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
        {connected ? "Connected ✓" : "Connect"}
      </button>
    </div>
  );
}
