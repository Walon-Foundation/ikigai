import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The one spinner. Every button that waits on the network shows this, so "the
// app is thinking" always looks the same wherever the user is.
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      aria-hidden
      className={cn("size-4 shrink-0 animate-spin", className)}
    />
  );
}

// Standard busy content for an action button.
//
//   <button disabled={isPending} aria-busy={isPending} className="…">
//     <BusyLabel pending={isPending} busy="Saving…">Save</BusyLabel>
//   </button>
//
// Swapping the label (not just appending a spinner) is deliberate: it names the
// thing that is happening, which is what the user actually wants to know. The
// caller keeps `disabled` on the button so the action can't be double-fired.
export function BusyLabel({
  pending,
  busy,
  children,
  spinnerClassName,
}: {
  pending: boolean;
  busy: string;
  children: React.ReactNode;
  spinnerClassName?: string;
}) {
  if (!pending) return <>{children}</>;
  return (
    <>
      <Spinner className={spinnerClassName} />
      {busy}
    </>
  );
}
