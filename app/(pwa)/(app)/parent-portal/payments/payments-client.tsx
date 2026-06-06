"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmPayment, payForPlan } from "./actions";

export function PayWidget({
  planId,
  defaultPhone,
}: {
  planId: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [ussd, setUssd] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function pay() {
    setError(null);
    setNote(null);
    startTransition(async () => {
      try {
        const res = await payForPlan(planId, phone);
        if (res.status === "paid") {
          router.refresh();
          setOpen(false);
        } else {
          setPaymentId(res.paymentId);
          setUssd(res.ussdCode ?? null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Payment failed");
      }
    });
  }

  function check() {
    if (!paymentId) return;
    setNote(null);
    startTransition(async () => {
      const { status } = await confirmPayment(paymentId);
      if (status === "paid") {
        router.refresh();
        setOpen(false);
      } else if (status === "failed") {
        setError("Payment failed or expired. Please try again.");
        setUssd(null);
      } else {
        setNote("Not received yet — dial the code, then check again.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
      >
        Pay
      </button>
    );
  }

  // USSD code issued — show it and let the payer confirm.
  if (ussd) {
    return (
      <div className="w-full">
        <p className="text-xs text-muted-foreground">
          Dial this on the phone ending {phone.slice(-4)} to pay:
        </p>
        <p className="my-1 font-mono text-lg font-bold tracking-wider text-foreground">
          {ussd}
        </p>
        <button
          type="button"
          onClick={check}
          disabled={pending}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          {pending ? "Checking…" : "I've paid — check"}
        </button>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Mobile money number"
        inputMode="tel"
        className="mb-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={pay}
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {pending ? "Starting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
