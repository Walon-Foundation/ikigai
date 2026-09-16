"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Spinner } from "@/components/spinner";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

// An image picker for the CMS forms. The chosen file uploads straight to
// UploadThing (bytes never touch our backend — see api/uploadthing/core.ts,
// route `cmsImage`); the resulting URL is written into a hidden input so it
// submits as an ordinary form field named `name`.
//
// Renders the current image as a preview with a clear button, so editing a row
// that already has a photo shows the photo rather than an empty dropzone.
export function ImageField({
  name,
  label,
  initialUrl,
  aspect = "video",
}: {
  name: string;
  label: string;
  initialUrl?: string | null;
  aspect?: "video" | "square";
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("cmsImage", {
    onClientUploadComplete: (res) => {
      const next = res?.[0]?.serverData?.url;
      if (next) setUrl(next);
    },
    onUploadError: () => {
      setError("Upload failed. Try a smaller image (max 8MB).");
    },
  });

  return (
    <div>
      <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {/* The value the form actually submits. */}
      <input type="hidden" name={name} value={url ?? ""} readOnly />

      {url ? (
        <div className="relative inline-block">
          {/* biome-ignore lint/performance/noImgElement: admin preview only, not a public page. */}
          <img
            src={url}
            alt=""
            className={cn(
              "rounded-xl border border-border object-cover",
              aspect === "square" ? "size-32" : "h-32 w-56",
            )}
          />
          <button
            type="button"
            onClick={() => setUrl(null)}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-destructive text-white shadow"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-busy={isUploading}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50",
            aspect === "square" ? "size-32" : "h-32 w-56",
          )}
        >
          {isUploading ? (
            <Spinner className="size-5" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          <span className="text-xs font-medium">
            {isUploading ? "Uploading…" : "Add image"}
          </span>
        </button>
      )}

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

      {/* Or paste a URL from the Media library — the same photo often belongs to
          more than one place, and re-uploading it each time wastes storage. */}
      <input
        type="url"
        value={url ?? ""}
        onChange={(e) => setUrl(e.target.value || null)}
        placeholder="…or paste an image URL"
        className="mt-2 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary placeholder:text-muted-foreground"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
