"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, X } from "lucide-react";
import { MOCK_PENDING_SCHOOLS } from "@/lib/mock-data";

export default function VetSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const school =
    MOCK_PENDING_SCHOOLS.find((s) => s.id === id) ?? MOCK_PENDING_SCHOOLS[0];
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  if (decision) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-20 text-center">
        <div
          className={`mb-4 flex size-16 items-center justify-center rounded-full text-3xl`}
        >
          {decision === "approved" ? "🏫" : "❌"}
        </div>
        <h2 className="font-display text-2xl font-black text-foreground">
          {decision === "approved"
            ? `${school.name} approved`
            : `${school.name} rejected`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {decision === "approved"
            ? "The school clubhouse is now active."
            : "The club lead has been notified."}
        </p>
        <Link
          href="/admin/schools"
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Schools
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/schools"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Schools
      </Link>

      <h1 className="font-display mb-6 text-3xl font-black text-foreground">
        Vet School Registration
      </h1>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="text-4xl">🏫</div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {school.name}
            </h2>
            <p className="text-sm capitalize text-muted-foreground">
              {school.region.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted by</span>
            <span className="font-medium text-foreground">
              {school.submittedBy}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date submitted</span>
            <span className="font-medium text-foreground">
              {new Date(school.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Region</span>
            <span className="font-medium capitalize text-foreground">
              {school.region.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Approving this school will create an active Clubhouse for all students
          at {school.name}. The club lead will receive a notification and can
          start inviting members immediately.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setDecision("approved")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary-light transition-colors"
        >
          <Check className="size-5" />
          Approve School
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
