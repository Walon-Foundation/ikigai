"use client";

import { useEffect } from "react";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production the Server Components error is hidden and only the digest is shown.
    // Log the full error + digest so it appears in the browser console and Vercel logs.
    console.error("admin/notifications Server Component error:", error);
    if (error?.digest) console.error("digest:", error.digest);
  }, [error]);

  return (
    <div className="rounded-xl border border-destructive/50 bg-card p-6">
      <h2 className="font-display text-lg font-bold text-destructive">
        Couldn&apos;t load notifications
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">digest: {error.digest}</p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
        <a href="/admin" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Back to admin
        </a>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        If this persists, copy the digest above and check server logs (Vercel → Runtime Logs) for the same digest.
      </p>
    </div>
  );
}
