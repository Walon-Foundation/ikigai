"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { MissingFields } from "@/components/missing-fields";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";
import { submitEnquiry } from "./actions";

// The four Get Involved pathways. Each is the same form with a different set of
// fields and a different `type`; all land in the enquiries inbox. Kept as one
// component with a tab switch so the shared name/email/submit machinery isn't
// written four times.

type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

const NAME: FieldDef = { name: "name", label: "Your name", required: true };
const EMAIL: FieldDef = {
  name: "email",
  label: "Email",
  type: "email",
  required: true,
};
const PHONE: FieldDef = {
  name: "phone",
  label: "Phone (optional)",
  type: "tel",
};

type Pathway = {
  key: "programme" | "volunteer" | "mentor" | "partner";
  tab: string;
  title: string;
  blurb: string;
  fields: (programmes: string[]) => FieldDef[];
};

const PATHWAYS: Pathway[] = [
  {
    key: "programme",
    tab: "Join a programme",
    title: "Join a programme",
    blurb: "Tell us a little about yourself and which programme interests you.",
    fields: (programmes) => [
      NAME,
      EMAIL,
      PHONE,
      { name: "age", label: "Your age", type: "text" },
      {
        name: "programme",
        label: "Programme",
        type: "select",
        options: programmes,
        required: true,
      },
      {
        name: "message",
        label: "Anything you'd like us to know?",
        type: "textarea",
      },
    ],
  },
  {
    key: "volunteer",
    tab: "Volunteer",
    title: "Volunteer with us",
    blurb: "Give your time and skills to young people in your community.",
    fields: () => [
      NAME,
      EMAIL,
      PHONE,
      { name: "skills", label: "What skills can you offer?", type: "text" },
      {
        name: "interestArea",
        label: "Which area interests you?",
        type: "text",
      },
      { name: "message", label: "Tell us a bit more", type: "textarea" },
    ],
  },
  {
    key: "mentor",
    tab: "Mentor",
    title: "Become a mentor",
    blurb: "Guide a young person through the things you've learned.",
    fields: () => [
      NAME,
      EMAIL,
      PHONE,
      { name: "background", label: "Professional background", type: "text" },
      { name: "areaOfMentorship", label: "Area of mentorship", type: "text" },
      { name: "availability", label: "Your availability", type: "text" },
      { name: "message", label: "Anything else?", type: "textarea" },
    ],
  },
  {
    key: "partner",
    tab: "Partner",
    title: "Partner with us",
    blurb: "Work with Ikigai to reach more young people.",
    fields: () => [
      NAME,
      EMAIL,
      PHONE,
      {
        name: "organization",
        label: "Organization",
        type: "text",
        required: true,
      },
      {
        name: "partnershipInterest",
        label: "How would you like to partner?",
        type: "textarea",
      },
    ],
  },
];

export function GetInvolvedForms({ programmes }: { programmes: string[] }) {
  const [activeKey, setActiveKey] = useState<Pathway["key"]>("programme");

  // Deep links: /get-involved#partner opens the Partner tab.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (PATHWAYS.some((p) => p.key === hash)) {
      setActiveKey(hash as Pathway["key"]);
    }
  }, []);

  const active = PATHWAYS.find((p) => p.key === activeKey) ?? PATHWAYS[0];

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {PATHWAYS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActiveKey(p.key)}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors",
              p.key === activeKey
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {p.tab}
          </button>
        ))}
      </div>

      <PathwayForm
        key={active.key}
        pathway={active}
        fields={active.fields(programmes)}
      />
    </div>
  );
}

function PathwayForm({
  pathway,
  fields,
}: {
  pathway: Pathway;
  fields: FieldDef[];
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const data: Record<string, string> = {};
    for (const f of fields)
      data[f.name] = String(formData.get(f.name) ?? "").trim();

    const missingFields = fields
      .filter((f) => f.required && !data[f.name])
      .map((f) => f.label);
    if (missingFields.length > 0) {
      setMissing(missingFields);
      return;
    }
    setMissing([]);

    startTransition(async () => {
      const result = await submitEnquiry(pathway.key, data);
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-12 text-primary" />
        <h3 className="font-display text-2xl font-bold text-foreground">
          Thank you!
        </h3>
        <p className="mt-2 text-muted-foreground">
          We've received your details and someone from Ikigai will be in touch.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl font-bold text-foreground">
        {pathway.title}
      </h2>
      <p className="mb-6 mt-1 text-muted-foreground">{pathway.blurb}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `gi-${pathway.key}-${f.name}`;
          const full = f.type === "textarea";
          return (
            <div key={f.name} className={full ? "sm:col-span-2" : undefined}>
              <label htmlFor={id} className={labelClass}>
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={id}
                  name={f.name}
                  rows={4}
                  placeholder={f.placeholder}
                  className={cn(inputClass, "resize-none")}
                />
              ) : f.type === "select" ? (
                <select
                  id={id}
                  name={f.name}
                  className={inputClass}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose one…
                  </option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={f.name}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <MissingFields fields={missing} />

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-40 transition-colors"
      >
        <BusyLabel pending={pending} busy="Sending…">
          Submit
        </BusyLabel>
      </button>
    </form>
  );
}
