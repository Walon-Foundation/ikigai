"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, CreditCard, Check, X } from "lucide-react";
import { MOCK_PENDING_MENTORS } from "@/lib/mock-data";

export default function VerifyMentorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const mentor =
    MOCK_PENDING_MENTORS.find((m) => m.id === id) ?? MOCK_PENDING_MENTORS[0];
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null
  );

  if (decision) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-20 text-center">
        <div
          className={`mb-4 flex size-16 items-center justify-center rounded-full ${
            decision === "approved" ? "bg-primary/10" : "bg-destructive/10"
          }`}
        >
          {decision === "approved" ? (
            <Check className="size-8 text-primary" />
          ) : (
            <X className="size-8 text-destructive" />
          )}
        </div>
        <h2 className="font-display text-2xl font-black text-foreground">
          {decision === "approved"
            ? `${mentor.displayName} approved`
            : `${mentor.displayName} rejected`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {decision === "approved"
            ? "They can now be matched with mentees."
            : "They have been notified by email."}
        </p>
        <Link
          href="/admin/mentors"
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/mentors"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Mentors
      </Link>

      <h1 className="font-display mb-6 text-3xl font-black text-foreground">
        Verify Mentor
      </h1>

      {/* Mentor Details */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
            {mentor.displayName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {mentor.displayName}
            </h2>
            <p className="text-sm text-muted-foreground">{mentor.email}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bio
          </p>
          <p className="text-sm text-foreground">{mentor.bio}</p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Interest Areas
          </p>
          <div className="flex flex-wrap gap-2">
            {mentor.interestTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary"
              >
                {tag.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Submitted
          </p>
          <p className="text-sm text-foreground">
            {new Date(mentor.submittedAt).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Submitted Documents */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Submitted Documents
        </p>
        <div className="space-y-3">
          {[
            { icon: CreditCard, label: "Government ID", status: "Uploaded" },
            { icon: FileText, label: "CV / Resume", status: "Uploaded" },
          ].map((doc) => (
            <div
              key={doc.label}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <doc.icon className="size-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">
                {doc.label}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                <Check className="size-3" />
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setDecision("approved")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary-light transition-colors"
        >
          <Check className="size-5" />
          Approve Mentor
        </button>
        <button
          onClick={() => setDecision("rejected")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive py-4 font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="size-5" />
          Reject
        </button>
      </div>
    </div>
  );
}
