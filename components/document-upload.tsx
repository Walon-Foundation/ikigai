"use client";

import { Check, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Spinner } from "@/components/spinner";
import { useUploadThing } from "@/lib/uploadthing";

// A vetting document (government ID / CV). The bytes go client → UploadThing
// directly; this app's server only authenticates the upload and stores the
// resulting file key (see app/api/uploadthing/core.ts). Nothing here posts a
// file to our own backend.
export function DocumentUpload({
  endpoint,
  label,
  hint,
  icon: Icon,
  initialFileName,
}: {
  endpoint: "governmentId" | "mentorCv";
  label: string;
  hint: string;
  icon: React.ElementType;
  initialFileName?: string | null;
}) {
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: () => setError(null),
    onUploadError: () =>
      setError("Upload failed. Try a smaller file (max 8MB, PDF or image)."),
  });

  return (
    <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border p-5">
      <Icon className="size-8 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
        {fileName && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-primary">
            <Check className="size-3 shrink-0" />
            {fileName}
          </p>
        )}
        {error && (
          <p className="mt-1 text-xs font-semibold text-destructive">{error}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-busy={isUploading}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Spinner className="size-3.5" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="size-3.5" />
            {fileName ? "Replace" : "Upload"}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError(null);
          const result = await startUpload([file]);
          if (result) setFileName(file.name);
          // Let the same file be picked again after a failure.
          e.target.value = "";
        }}
      />
    </div>
  );
}
