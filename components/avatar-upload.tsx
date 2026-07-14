"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Spinner } from "@/components/spinner";
import { useUploadThing } from "@/lib/uploadthing";

// Circular avatar with an overlaid camera button that uploads a new photo
// straight to UploadThing. The image bytes go client → UploadThing directly;
// the server persists only the resulting URL (see api/uploadthing/core.ts).
export function AvatarUpload({
  name,
  initialUrl,
  size = 96,
  showCaption = true,
  onUploaded,
}: {
  name: string;
  initialUrl?: string | null;
  size?: number;
  showCaption?: boolean;
  onUploaded?: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("avatar", {
    onClientUploadComplete: (res) => {
      const next = res?.[0]?.serverData?.url;
      if (next) {
        setUrl(next);
        onUploaded?.(next);
      }
    },
    onUploadError: () => {
      setError("Upload failed. Try a smaller image (max 4MB).");
    },
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <Avatar name={name} src={url} size={size} />
        <button
          type="button"
          aria-label="Upload profile photo"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-busy={isUploading}
          className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow disabled:opacity-60"
        >
          {isUploading ? (
            <Spinner className="size-4" />
          ) : (
            <Camera className="size-4" />
          )}
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
      </div>
      {showCaption && (
        <p className="text-xs text-muted-foreground">
          {isUploading
            ? "Uploading…"
            : "Add a photo so your match recognises you"}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
