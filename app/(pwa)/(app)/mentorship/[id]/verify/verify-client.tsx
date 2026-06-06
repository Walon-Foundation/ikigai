"use client";

import { MapPin } from "lucide-react";
import { useState, useTransition } from "react";
import { verifyMeeting } from "./actions";

export function VerifyMeetingButton({
  mentorshipId,
  meetingNumber,
  disabled,
}: {
  mentorshipId: string;
  meetingNumber: number;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm(method: "gps" | "photo") {
    setError(null);
    if (method === "gps" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          startTransition(async () => {
            try {
              await verifyMeeting({
                mentorshipId,
                meetingNumber,
                method: "gps",
                lat: String(pos.coords.latitude),
                lng: String(pos.coords.longitude),
              });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not verify");
            }
          });
        },
        () => setError("Location permission denied — try Confirm instead."),
      );
      return;
    }
    startTransition(async () => {
      try {
        await verifyMeeting({ mentorshipId, meetingNumber, method });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not verify");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => confirm("gps")}
        disabled={disabled || pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        <MapPin className="size-4" />
        {pending ? "…" : "Check in here"}
      </button>
      <button
        type="button"
        onClick={() => confirm("photo")}
        disabled={disabled || pending}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
      >
        Confirm manually
      </button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
