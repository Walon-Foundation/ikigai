import { AlertCircle } from "lucide-react";

// Tells someone why the form won't go through.
//
// These forms used to disable Continue until every rule passed, with nothing
// on screen saying what the rules were. A greyed-out button is not feedback:
// you cannot guess "your bio needs at least 20 characters" by looking at one,
// and a disabled button can't even fire a click, so there was nowhere for an
// explanation to come from. The button stays pressable now, and pressing it
// says exactly what's outstanding.
//
// `<output aria-live>` rather than a floating toast: it sits next to the
// button that was just pressed instead of in a corner that a thumb covers on a
// phone, it doesn't time out while someone is reading it, and screen readers
// announce it — which is the part of a toast that actually matters.
export function MissingFields({ fields }: { fields: string[] }) {
  if (fields.length === 0) return null;

  return (
    <output
      aria-live="polite"
      className="mt-3 block rounded-xl border border-earth/40 bg-earth-light/10 p-3"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-earth" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {fields.length === 1
              ? "One more thing before you continue"
              : `${fields.length} things still needed`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {fields.map((field) => (
              <li key={field} className="text-xs text-muted-foreground">
                • {field}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </output>
  );
}
