"use client";

import { Check, Copy, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Spinner } from "@/components/spinner";
import { useUploadThing } from "@/lib/uploadthing";
import { addMedia, removeMedia } from "./actions";

type Asset = { id: string; url: string; label: string | null };

export function MediaLibrary({ assets }: { assets: Asset[] }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("cmsImage", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.serverData?.url;
      if (url) startSaving(async () => addMedia(url, ""));
    },
    onUploadError: () =>
      setError("Upload failed. Try a smaller image (max 8MB)."),
  });

  const busy = isUploading || saving;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-busy={busy}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-50 transition-colors"
      >
        {busy ? (
          <Spinner className="size-4" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {busy ? "Uploading…" : "Upload image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          setError(null);
          const file = e.target.files?.[0];
          if (file) startUpload([file]);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {assets.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No images yet. Upload photos and logos here, then paste their links
          into any programme, story or partner.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <MediaCard key={a.id} asset={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({ asset }: { asset: Asset }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* biome-ignore lint/performance/noImgElement: admin library thumbnail. */}
      <img
        src={asset.url}
        alt={asset.label ?? ""}
        className="aspect-square w-full object-cover"
      />
      <div className="flex items-center justify-between gap-1 p-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(asset.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-primary" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy link
            </>
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await removeMedia(asset.id);
            })
          }
          className="text-muted-foreground hover:text-destructive disabled:opacity-40"
          aria-label="Remove from library"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
