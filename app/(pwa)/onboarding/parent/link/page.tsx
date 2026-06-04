"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveParentLink } from "../../actions";

export default function ParentLinkPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <h2 className="font-display mb-2 text-3xl font-black text-foreground">
        Link your child&apos;s account
      </h2>
      <p className="mb-8 text-muted-foreground">
        Enter the email address your child used (or will use) to sign up for
        Ikigai.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="childEmail"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Child&apos;s email address
          </label>
          <input
            id="childEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="child@example.com"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">How this works</p>
          <ul className="mt-2 space-y-1">
            <li>
              • If your child already has an account, they will be linked
              automatically.
            </li>
            <li>
              • If not, you will receive an invite code to share with them.
            </li>
            <li>• You can start exploring your parent dashboard right away.</li>
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => saveParentLink(email))}
        disabled={!email.includes("@") || isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Link Account <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => startTransition(() => saveParentLink(""))}
        disabled={isPending}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-border px-8 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
      >
        Skip for now
      </button>
    </div>
  );
}
