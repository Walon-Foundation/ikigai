"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export function VerifyActions({
  mentorId,
  mentorName,
}: {
  mentorId: string;
  mentorName: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDecision(action: "approved" | "rejected") {
    setLoading(true);
    await fetch("/admin/api/verify-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, action }),
    });
    setDecision(action);
    setLoading(false);
  }

  if (decision) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
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
            ? `${mentorName} approved`
            : `${mentorName} rejected`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {decision === "approved"
            ? "They can now be matched with mentees."
            : "They have been notified by email."}
        </p>
        <button
          onClick={() => router.push("/admin/mentors")}
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleDecision("approved")}
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        <Check className="size-5" />
        Approve Mentor
      </button>
      <button
        onClick={() => handleDecision("rejected")}
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive py-4 font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
      >
        <X className="size-5" />
        Reject
      </button>
    </div>
  );
}
