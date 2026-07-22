"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { ImageField } from "@/components/admin/image-field";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";

// A field-driven CRUD screen shared by every /admin/cms entity.
//
// Each CMS page is a server component that reads its rows, maps them to the
// normalised `AdminRow` shape below, describes its columns as `fields`, and
// passes its four server actions. The volume of near-identical create/edit/
// delete/publish/reorder UI made hand-writing eight bespoke screens the wrong
// call — one tested component is both less code and less surface for the "forgot
// to revalidate / mismatched field name" class of bug.
//
// Values flow as Record<string,string>: the client submits strings, the server
// action interprets them with the helpers in lib/cms-admin.ts. `lines` fields
// (one list item per line) submit as a single newline-joined string.

export type Field =
  | {
      type: "text";
      name: string;
      label: string;
      required?: boolean;
      placeholder?: string;
    }
  | {
      type: "textarea";
      name: string;
      label: string;
      rows?: number;
      placeholder?: string;
    }
  | {
      type: "lines";
      name: string;
      label: string;
      help?: string;
      placeholder?: string;
    }
  | { type: "image"; name: string; label: string; aspect?: "video" | "square" }
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | {
      type: "number";
      name: string;
      label: string;
      min?: number;
      max?: number;
      placeholder?: string;
    }
  | { type: "datetime"; name: string; label: string; required?: boolean }
  | { type: "checkbox"; name: string; label: string };

export type AdminRow = {
  id: string;
  title: string;
  subtitle?: string;
  thumb?: string | null;
  published: boolean;
  values: Record<string, string>;
};

type Actions = {
  save: (id: string | null, values: Record<string, string>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePublish?: (id: string, next: boolean) => Promise<void>;
  move?: (id: string, dir: "up" | "down") => Promise<void>;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function ResourceManager({
  singular,
  fields,
  items,
  actions,
  canPublish = true,
  canReorder = true,
  canDelete = true,
  publishLabel,
}: {
  singular: string;
  fields: Field[];
  items: AdminRow[];
  actions: Actions;
  canPublish?: boolean;
  canReorder?: boolean;
  canDelete?: boolean;
  // What the draft/published badge and toggle mean for this entity. Events, for
  // instance, publish via `isPublic` and read better as "Public / Hidden".
  publishLabel?: { on: string; off: string };
}) {
  // null = nothing open; "new" = create form; otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {editing === "new" ? (
        <ResourceForm
          singular={singular}
          fields={fields}
          row={null}
          save={actions.save}
          onDone={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light transition-colors"
        >
          <Plus className="size-4" />
          Add {singular}
        </button>
      )}

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No {singular.toLowerCase()} entries yet.
          </p>
        )}
        {items.map((item, i) =>
          editing === item.id ? (
            <ResourceForm
              key={item.id}
              singular={singular}
              fields={fields}
              row={item}
              save={actions.save}
              onDone={() => setEditing(null)}
            />
          ) : (
            <RowCard
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === items.length - 1}
              actions={actions}
              canPublish={canPublish}
              canReorder={canReorder}
              canDelete={canDelete}
              publishLabel={publishLabel}
              onEdit={() => setEditing(item.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function RowCard({
  item,
  isFirst,
  isLast,
  actions,
  canPublish,
  canReorder,
  canDelete,
  publishLabel,
  onEdit,
}: {
  item: AdminRow;
  isFirst: boolean;
  isLast: boolean;
  actions: Actions;
  canPublish: boolean;
  canReorder: boolean;
  canDelete: boolean;
  publishLabel?: { on: string; off: string };
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {item.thumb ? (
        // biome-ignore lint/performance/noImgElement: admin list thumbnail.
        <img
          src={item.thumb}
          alt=""
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.title || "Untitled"}
        </p>
        {item.subtitle && (
          <p className="truncate text-xs text-muted-foreground">
            {item.subtitle}
          </p>
        )}
      </div>

      {!item.published && canPublish && (
        <span className="shrink-0 rounded-full bg-earth-light/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-earth">
          {publishLabel?.off ?? "Draft"}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1">
        {canReorder && actions.move && (
          <>
            <button
              type="button"
              disabled={isFirst || pending}
              onClick={() =>
                startTransition(async () => {
                  await actions.move?.(item.id, "up");
                })
              }
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              disabled={isLast || pending}
              onClick={() =>
                startTransition(async () => {
                  await actions.move?.(item.id, "down");
                })
              }
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown className="size-4" />
            </button>
          </>
        )}

        {canPublish && actions.togglePublish && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await actions.togglePublish?.(item.id, !item.published);
              })
            }
            className="text-muted-foreground hover:text-primary disabled:opacity-40"
            aria-label={item.published ? "Hide" : "Publish"}
            title={
              item.published
                ? `${publishLabel?.on ?? "Published"} — click to hide`
                : `${publishLabel?.off ?? "Draft"} — click to publish`
            }
          >
            {item.published ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Edit"
        >
          <Pencil className="size-4" />
        </button>

        {canDelete &&
          (confirming ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await actions.remove(item.id);
                })
              }
              className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive disabled:opacity-50"
            >
              <BusyLabel pending={pending} busy="Deleting…">
                Confirm
              </BusyLabel>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          ))}
      </div>
    </div>
  );
}

function ResourceForm({
  singular,
  fields,
  row,
  save,
  onDone,
}: {
  singular: string;
  fields: Field[];
  row: AdminRow | null;
  save: Actions["save"];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const values: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === "checkbox") {
        values[field.name] = formData.get(field.name) ? "true" : "";
      } else {
        values[field.name] = String(formData.get(field.name) ?? "");
      }
    }
    startTransition(async () => {
      try {
        await save(row?.id ?? null, values);
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          {row ? `Edit ${singular}` : `New ${singular}`}
        </h2>
        <button
          type="button"
          onClick={onDone}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={row?.values[field.name]}
          />
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-40 transition-colors"
          >
            <BusyLabel pending={pending} busy="Saving…">
              Save {singular}
            </BusyLabel>
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldInput({ field, value }: { field: Field; value?: string }) {
  const id = `f-${field.name}`;

  if (field.type === "image") {
    return (
      <ImageField
        name={field.name}
        label={field.label}
        initialUrl={value}
        aspect={field.aspect}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={value === "true"}
          className="size-4 rounded border-border"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={field.rows ?? 3}
          defaultValue={value}
          placeholder={field.placeholder}
          className={cn(inputClass, "resize-none")}
        />
      ) : field.type === "lines" ? (
        <>
          <textarea
            id={id}
            name={field.name}
            rows={4}
            defaultValue={value}
            placeholder={field.placeholder}
            className={cn(inputClass, "resize-none")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {field.help ?? "One per line."}
          </p>
        </>
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          defaultValue={value}
          className={inputClass}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          id={id}
          name={field.name}
          type="number"
          min={field.min}
          max={field.max}
          defaultValue={value}
          placeholder={field.placeholder}
          className={inputClass}
        />
      ) : field.type === "datetime" ? (
        <input
          id={id}
          name={field.name}
          type="datetime-local"
          required={field.required}
          defaultValue={value}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          name={field.name}
          type="text"
          required={field.required}
          defaultValue={value}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}
