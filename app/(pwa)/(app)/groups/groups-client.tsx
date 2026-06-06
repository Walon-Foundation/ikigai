"use client";

import { Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createGroup, joinGroup, postGroupMessage } from "./actions";

export function CreateGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handle(formData: FormData) {
    startTransition(async () => {
      const res = await createGroup({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
      });
      setOpen(false);
      router.push(`/groups/${res.groupId}`);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" /> New group
      </button>
    );
  }

  return (
    <form
      action={handle}
      className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4"
    >
      <input
        name="name"
        required
        placeholder="Group name"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        name="description"
        placeholder="What's it about? (optional)"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function JoinGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await joinGroup(groupId);
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
    >
      {pending ? "Joining…" : "Join group"}
    </button>
  );
}

export function GroupMessageForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    if (!value.trim()) return;
    const content = value;
    setValue("");
    startTransition(async () => {
      await postGroupMessage({ groupId, content });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
        placeholder="Message the group…"
        className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={send}
        disabled={pending || !value.trim()}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
      >
        <Send className="size-4" />
      </button>
    </div>
  );
}
