"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function ResolveActions({
  reportId,
  initialResolved,
  resolvedAt,
}: {
  reportId: string;
  initialResolved: boolean;
  resolvedAt: string | null;
}) {
  const [resolved, setResolved] = useState(initialResolved);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  async function handleResolve() {
    setLoading(true);
    await fetch("/admin/api/resolve-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    setResolved(true);
    setLoading(false);
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Notes
        </p>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          placeholder="Add notes about the action taken..."
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
        />
      </div>

      {!resolved ? (
        <button
          onClick={handleResolve}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          <Check className="size-5" />
          {loading ? "Resolving…" : "Mark as Resolved"}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-full border border-primary py-4 text-sm font-semibold text-primary">
          <Check className="size-5" />
          Resolved
          {resolvedAt
            ? ` on ${new Date(resolvedAt).toLocaleDateString("en-GB")}`
            : ""}
        </div>
      )}
    </>
  );
}
