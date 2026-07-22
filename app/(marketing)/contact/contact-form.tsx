"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { MissingFields } from "@/components/missing-fields";
import { BusyLabel } from "@/components/spinner";
import { submitEnquiry } from "../get-involved/actions";

// Previously this built a `mailto:` link and handed off to the visitor's own
// mail client — so any message that didn't survive that handoff was lost, with
// nobody aware it had been sent. It now writes to the enquiries inbox like every
// other public form.
export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  function handleSubmit(formData: FormData) {
    setError(null);
    const data = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    const missingFields = [
      data.name ? null : "Your name",
      data.email ? null : "Your email",
      data.message ? null : "A message",
    ].filter((f): f is string => f !== null);
    if (missingFields.length > 0) {
      setMissing(missingFields);
      return;
    }
    setMissing([]);

    startTransition(async () => {
      const result = await submitEnquiry("contact", data);
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-12 text-primary" />
        <h3 className="font-display text-2xl font-bold text-foreground">
          Message sent
        </h3>
        <p className="mt-2 text-muted-foreground">
          Thanks for getting in touch — we'll reply to your email soon.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={labelClass}>
            Name
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            placeholder="Your full name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cf-email" className={labelClass}>
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            placeholder="your@email.com"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="cf-subject" className={labelClass}>
          Subject
        </label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          placeholder="What is this about?"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="cf-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          placeholder="Your message..."
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <MissingFields fields={missing} />

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
      >
        <BusyLabel pending={pending} busy="Sending…">
          Send Message
        </BusyLabel>
      </button>
    </form>
  );
}
