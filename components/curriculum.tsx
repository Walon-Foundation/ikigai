"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Circle,
  CircleDot,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addCurriculumItem,
  deleteCurriculumItem,
  editCurriculumItem,
  moveCurriculumItem,
  setCurriculumItemStatus,
} from "@/app/(pwa)/(app)/mentor-portal/[menteeId]/curriculum-actions";
import { BusyLabel, Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

export type CurriculumItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  orderIndex: number;
  targetDate: string | null;
  completedAt: string | null;
};

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Circle; className: string }
> = {
  planned: {
    label: "Planned",
    icon: Circle,
    className: "text-muted-foreground",
  },
  in_progress: {
    label: "In progress",
    icon: CircleDot,
    className: "text-accent",
  },
  done: { label: "Done", icon: Check, className: "text-primary" },
};

const NEXT_STATUS: Record<string, "planned" | "in_progress" | "done"> = {
  planned: "in_progress",
  in_progress: "done",
  done: "planned",
};

export function Curriculum({
  mentorshipId,
  initialItems,
  canEdit,
}: {
  mentorshipId: string;
  initialItems: CurriculumItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Each item has several independently-firing actions (status, move,
  // delete) plus the add/edit forms — key busy state by item id + action
  // (or a form name) so only the clicked button spins.
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const items = [...initialItems].sort((a, b) => a.orderIndex - b.orderIndex);
  const done = items.filter((i) => i.status === "done").length;
  const percent =
    items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-foreground">
          Curriculum
        </h2>
        <span className="text-xs text-muted-foreground">
          {done}/{items.length} · {percent}%
        </span>
      </div>

      {items.length > 0 && (
        <div className="mb-4 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {items.length === 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          {canEdit
            ? "Build a step-by-step curriculum for your mentee. Start by adding the first module below."
            : "Your mentor hasn't added any curriculum steps yet."}
        </p>
      )}

      <ol className="space-y-2">
        {items.map((item, idx) => {
          const meta = STATUS_META[item.status] ?? STATUS_META.planned;
          const StatusIcon = meta.icon;
          const isEditing = editingId === item.id;
          return (
            <li key={item.id} className="rounded-xl border border-border p-3">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    placeholder="Description (optional)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending || !editTitle.trim()}
                      aria-busy={busy === `${item.id}:save`}
                      onClick={() =>
                        run(`${item.id}:save`, async () => {
                          await editCurriculumItem({
                            id: item.id,
                            title: editTitle,
                            description: editDesc,
                          });
                          setEditingId(null);
                        })
                      }
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <BusyLabel
                        pending={busy === `${item.id}:save`}
                        busy="Saving…"
                      >
                        Save
                      </BusyLabel>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    aria-label={`Mark ${NEXT_STATUS[item.status]}`}
                    disabled={isPending}
                    aria-busy={busy === `${item.id}:status`}
                    onClick={() =>
                      run(`${item.id}:status`, () =>
                        setCurriculumItemStatus({
                          id: item.id,
                          status: NEXT_STATUS[item.status] ?? "planned",
                        }),
                      )
                    }
                    className={cn("mt-0.5 shrink-0", meta.className)}
                  >
                    {busy === `${item.id}:status` ? (
                      <Spinner className="size-5" />
                    ) : (
                      <StatusIcon className="size-5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        item.status === "done"
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}
                    >
                      {idx + 1}. {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                      {item.targetDate &&
                        ` · by ${new Date(item.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 flex-col items-center gap-1 text-muted-foreground">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={isPending || idx === 0}
                          aria-busy={busy === `${item.id}:up`}
                          onClick={() =>
                            run(`${item.id}:up`, () =>
                              moveCurriculumItem(item.id, "up"),
                            )
                          }
                          className="disabled:opacity-30"
                        >
                          {busy === `${item.id}:up` ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <ArrowUp className="size-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={isPending || idx === items.length - 1}
                          aria-busy={busy === `${item.id}:down`}
                          onClick={() =>
                            run(`${item.id}:down`, () =>
                              moveCurriculumItem(item.id, "down"),
                            )
                          }
                          className="disabled:opacity-30"
                        >
                          {busy === `${item.id}:down` ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditTitle(item.title);
                            setEditDesc(item.description ?? "");
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          disabled={isPending}
                          aria-busy={busy === `${item.id}:delete`}
                          onClick={() =>
                            run(`${item.id}:delete`, () =>
                              deleteCurriculumItem(item.id),
                            )
                          }
                          className="text-destructive"
                        >
                          {busy === `${item.id}:delete` ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {canEdit &&
        (adding ? (
          <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border p-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Module title, e.g. Discover your strengths"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              placeholder="What will you cover? (optional)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending || !newTitle.trim()}
                aria-busy={busy === "add"}
                onClick={() =>
                  run("add", async () => {
                    await addCurriculumItem({
                      mentorshipId,
                      title: newTitle,
                      description: newDesc,
                    });
                    setNewTitle("");
                    setNewDesc("");
                    setAdding(false);
                  })
                }
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                <BusyLabel pending={busy === "add"} busy="Adding…">
                  <Plus className="size-3.5" /> Add step
                </BusyLabel>
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                <X className="size-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border py-2.5 text-sm font-semibold text-primary hover:border-primary/40"
          >
            <Plus className="size-4" /> Add curriculum step
          </button>
        ))}
    </div>
  );
}
