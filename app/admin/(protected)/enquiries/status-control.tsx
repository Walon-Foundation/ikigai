"use client";

import { useTransition } from "react";
import { setEnquiryStatus } from "./actions";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "handled", label: "Handled" },
];

export function StatusControl({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setEnquiryStatus(id, next);
        });
      }}
      className="rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
