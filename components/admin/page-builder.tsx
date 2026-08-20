"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { ImageField } from "@/components/admin/image-field";
import type { Field } from "@/components/admin/resource-manager";
import { BusyLabel } from "@/components/spinner";
import { cn } from "@/lib/utils";

// The drag-and-drop block board behind /admin/page-builder.
//
// This is deliberately a separate component from ResourceManager rather than
// a variant of it: ResourceManager's up/down `move` buttons and its
// open-one-editor-at-a-time list model don't stretch to "drag a block three
// places up the homepage" — that needs a single reorder call carrying the
// whole new sequence (see reorderBlocks in ./actions.ts), and drag state that
// resyncs cleanly against a server-revalidated list. Everything else (the
// field-driven edit form, the publish toggle, delete) intentionally looks and
// behaves like ResourceManager's, for the same reason every /admin/cms screen
// looks the same: one interaction language across the admin.

export type BlockRow = {
  id: string;
  type: string;
  published: boolean;
  values: Record<string, string>;
};

export type BlockMeta = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
};

type Actions = {
  addBlock: (page: string, type: string) => Promise<void>;
  updateBlockConfig: (
    id: string,
    config: Record<string, string>,
  ) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  toggleBlockPublish: (id: string, next: boolean) => Promise<void>;
  reorderBlocks: (orderedIds: string[]) => Promise<void>;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function PageBuilder({
  page,
  blocks,
  registry,
  actions,
}: {
  page: string;
  blocks: BlockRow[];
  registry: BlockMeta[];
  actions: Actions;
}) {
  const [items, setItems] = useState(blocks);
  const [editing, setEditing] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [, startTransition] = useTransition();

  // Resyncs whenever the server gives us a fresh `blocks` prop — after add,
  // remove, publish-toggle, or a reorder's own round trip confirms. The drag
  // handler below updates local order immediately for a responsive feel; this
  // effect is what keeps that local copy from drifting from the database.
  useEffect(() => {
    setItems(blocks);
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(() => {
        actions.reorderBlocks(next.map((b) => b.id));
      });
      return next;
    });
  }

  const metaByType = new Map(registry.map((r) => [r.type, r]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Changes appear on the live site immediately.
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light transition-colors"
          >
            <Plus className="size-4" />
            Add block
          </button>
          {picking && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-lg">
              {registry.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => {
                    setPicking(false);
                    startTransition(() => actions.addBlock(page, r.type));
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-secondary"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {r.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No blocks on this page yet. Add one to get started.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((block) => {
              const meta = metaByType.get(block.type);
              return editing === block.id ? (
                <BlockForm
                  key={block.id}
                  block={block}
                  meta={meta}
                  onSave={async (config) => {
                    await actions.updateBlockConfig(block.id, config);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <SortableRow
                  key={block.id}
                  block={block}
                  meta={meta}
                  actions={actions}
                  onEdit={() => setEditing(block.id)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({
  block,
  meta,
  actions,
  onEdit,
}: {
  block: BlockRow;
  meta: BlockMeta | undefined;
  actions: Actions;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {meta?.label ?? block.type}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {meta?.description ?? "Unknown block type"}
        </p>
      </div>

      {!block.published && (
        <span className="shrink-0 rounded-full bg-earth-light/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-earth">
          Hidden
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await actions.toggleBlockPublish(block.id, !block.published);
            })
          }
          className="text-muted-foreground hover:text-primary disabled:opacity-40"
          aria-label={block.published ? "Hide" : "Show"}
          title={
            block.published
              ? "Visible — click to hide"
              : "Hidden — click to show"
          }
        >
          {block.published ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onEdit}
          disabled={!meta}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Edit"
        >
          <Pencil className="size-4" />
        </button>

        {confirming ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await actions.removeBlock(block.id);
              })
            }
            className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive disabled:opacity-50"
          >
            <BusyLabel pending={pending} busy="Removing…">
              Confirm
            </BusyLabel>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remove block"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function BlockForm({
  block,
  meta,
  onSave,
  onCancel,
}: {
  block: BlockRow;
  meta: BlockMeta | undefined;
  onSave: (config: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const values: Record<string, string> = {};
    for (const field of meta?.fields ?? []) {
      if (field.type === "checkbox") {
        values[field.name] = formData.get(field.name) ? "true" : "";
      } else {
        values[field.name] = String(formData.get(field.name) ?? "");
      }
    }
    startTransition(async () => {
      try {
        await onSave(values);
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
          Edit {meta?.label ?? block.type}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-4">
        {(meta?.fields ?? []).map((field) => (
          <BlockFieldInput
            key={field.name}
            field={field}
            value={block.values[field.name]}
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
              Save block
            </BusyLabel>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

// A twin of ResourceForm's field renderer in resource-manager.tsx (not
// exported from there). No block type uses "image" or "datetime" yet, but
// every Field variant is handled here — the same reasoning as
// resource-manager.tsx: exhaustive per-variant branches keep TypeScript
// checking each field's own props, rather than a fallthrough that happens to
// work for today's block types and breaks the moment one adds an image field.
function BlockFieldInput({ field, value }: { field: Field; value?: string }) {
  const id = `bf-${field.name}`;

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
