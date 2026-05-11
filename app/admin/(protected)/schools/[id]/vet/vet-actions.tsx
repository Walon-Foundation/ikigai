"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VetActions({
  schoolId,
  schoolName,
}: {
  schoolId: string;
  schoolName: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function handleDecision(action: "approved" | "rejected") {
    setLoading(true);
    await fetch("/admin/api/verify-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId, action }),
    });
    setDecision(action);
    setLoading(false);
  }

  if (decision) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-5xl">
          {decision === "approved" ? "🏫" : "❌"}
        </div>
        <h2 className="font-display text-2xl font-black text-foreground">
          {decision === "approved"
            ? `${schoolName} approved`
            : `${schoolName} rejected`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {decision === "approved"
            ? "The school clubhouse is now active."
            : "The club lead has been notified."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/schools")}
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Schools
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => handleDecision("approved")}
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        <Check className="size-5" />
        Approve School
      </button>
      <button
        type="button"
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
