"use client";

import { MapPin } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
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
  // GPS check-in and manual confirm are independent actions on the same
  // meeting — track which one was clicked so only that button spins.
  const [busyMethod, setBusyMethod] = useState<"gps" | "photo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function confirm(method: "gps" | "photo") {
    setError(null);
    setBusyMethod(method);
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
            } finally {
              setBusyMethod(null);
            }
          });
        },
        () => {
          setBusyMethod(null);
          setError("Location permission denied — try Confirm instead.");
        },
      );
      return;
    }
    startTransition(async () => {
      try {
        await verifyMeeting({ mentorshipId, meetingNumber, method });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not verify");
      } finally {
        setBusyMethod(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => confirm("gps")}
        disabled={disabled || pending}
        aria-busy={busyMethod === "gps"}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        <MapPin className="size-4" />
        <BusyLabel pending={busyMethod === "gps"} busy="Checking in…">
          Check in here
        </BusyLabel>
      </button>
      <button
        type="button"
        onClick={() => confirm("photo")}
        disabled={disabled || pending}
        aria-busy={busyMethod === "photo"}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
      >
        <BusyLabel pending={busyMethod === "photo"} busy="Confirming…">
          Confirm manually
        </BusyLabel>
      </button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
