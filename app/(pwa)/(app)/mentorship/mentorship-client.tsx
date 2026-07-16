"use client";

import { Clock, MessageCircle, Star, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { BusyLabel } from "@/components/spinner";
import { requestMentor } from "./actions";

type MentorUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  interestTags: string[] | null;
  matchScore?: number;
};

type MyMentorship = {
  id: string;
  status: string | null;
  matchScore: number | null;
  lastActivityAt: string | null;
  mentor: MentorUser | null;
};

type Props = {
  myMentorships: MyMentorship[];
  suggestedMentors: MentorUser[];
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Pending",
  active: "Active",
  declined: "Declined",
  closed: "Closed",
};

export function MentorshipClient({ myMentorships, suggestedMentors }: Props) {
  const [showMatches, setShowMatches] = useState(false);
  const requestedIds = new Set(myMentorships.map((m) => m.mentor?.id));

  return (
    <>
      <PageHeader title="Match" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {myMentorships.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your mentorships
            </p>
            <div className="space-y-3">
              {myMentorships.map((m) => (
                <MentorshipRow key={m.id} mentorship={m} />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Find a mentor</p>
              <p className="text-sm text-muted-foreground">
                Matched on shared interests
              </p>
            </div>
            <Users className="size-6 text-primary" />
          </div>

          {!showMatches ? (
            <button
              type="button"
              onClick={() => setShowMatches(true)}
              className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
            >
              Browse mentors
            </button>
          ) : suggestedMentors.length === 0 ? (
            <div className="mt-4 rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
              No mentors available yet. Check back soon.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {suggestedMentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  alreadyRequested={requestedIds.has(mentor.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MentorshipRow({ mentorship: m }: { mentorship: MyMentorship }) {
  const isActive = m.status === "active";

  const inner = (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <Avatar
        name={m.mentor?.displayName ?? "Mentor"}
        src={m.mentor?.avatarUrl}
        size={56}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">
            {m.mentor?.displayName ?? "Mentor"}
          </p>
          <span className="rounded-full bg-primary-muted/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
            {STATUS_LABEL[m.status ?? ""] ?? m.status}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {m.mentor?.bio ?? m.mentor?.interestTags?.join(", ")}
        </p>
        {m.matchScore !== null && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-accent text-accent" />
            <span>{m.matchScore}% match</span>
          </div>
        )}
      </div>
      {isActive ? (
        <MessageCircle className="size-5 text-muted-foreground" />
      ) : (
        <Clock className="size-5 text-muted-foreground" />
      )}
    </div>
  );

  // Only an accepted mentorship opens a chat; pending/declined are not clickable.
  return isActive ? (
    <Link href={`/mentorship/${m.id}`} className="block hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function MentorCard({
  mentor,
  alreadyRequested,
}: {
  mentor: MentorUser;
  alreadyRequested: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requested, setRequested] = useState(alreadyRequested);

  function handleRequest() {
    startTransition(async () => {
      await requestMentor(mentor.id);
      setRequested(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <Avatar
          name={mentor.displayName ?? "Mentor"}
          src={mentor.avatarUrl}
          size={44}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">
              {mentor.displayName}
            </p>
            {mentor.matchScore !== undefined && (
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
        type="button"
        onClick={handleRequest}
        disabled={requested || isPending}
        aria-busy={isPending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:bg-muted disabled:text-muted-foreground"
      >
        <BusyLabel pending={isPending} busy="Requesting…">
          {requested ? "Request sent" : "Request mentor"}
        </BusyLabel>
      </button>
    </div>
  );
}
