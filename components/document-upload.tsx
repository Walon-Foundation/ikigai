"use client";

import { AlertCircle, Check, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/components/toast";
import {
  DOCUMENT_LIMITS,
  type DocumentEndpoint,
  maxSizeLabel,
  rejectDocument,
} from "@/lib/uploads";
import { useUploadThing } from "@/lib/uploadthing";

// A vetting document (government ID / CV). The bytes go client → UploadThing
// directly; this app's server only authenticates the upload and stores the
// resulting file key (see app/api/uploadthing/core.ts). Nothing here posts a
// file to our own backend.
//
// Format and size are checked here before a single byte leaves the phone. That
// check decides nothing — app/api/uploadthing/core.ts is the authority and does
// not trust it — it exists so someone on a metered connection finds out their
// file is wrong before paying to send it.
export function DocumentUpload({
  endpoint,
  label,
  hint,
  icon: Icon,
  initialFileName,
  required = false,
  onUploaded,
  uploadInput,
}: {
  endpoint: DocumentEndpoint;
  label: string;
  hint: string;
  icon: React.ElementType;
  initialFileName?: string | null;
  /** Marks the field, and leaves a standing reminder while it is empty. */
  required?: boolean;
  /** Fires with the stored file name, so a form can gate on it. */
  onUploaded?: (fileName: string) => void;
  /**
   * Route input, for endpoints that need to know what the file is FOR — the
   * task evidence routes take `{ taskId }` and authorize against it. The
   * server re-checks ownership; this only says which task is meant.
   */
  uploadInput?: Record<string, unknown>;
}) {
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null,
  );
  // Percent complete, or null when nothing is in flight. These are 10MB
  // documents going up a phone connection: a bare spinner gives an applicant
  // no way to tell a slow upload from a stalled one, and the ones who guess
  // wrong close the app and lose the upload.
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const limit = DOCUMENT_LIMITS[endpoint];

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    uploadProgressGranularity: "fine",
    onUploadProgress: setProgress,
    // The server's own rejections land here — a file that passed the check
    // above but was refused anyway, a dropped connection, storage failing.
    // UploadThing's own message is logged rather than shown: it is written for
    // a developer, and this screen is read by an applicant who may be reading
    // English as their second or third language.
    onUploadError: (error) => {
      console.error(`uploadthing: ${endpoint} upload failed`, error);
      toast({
        variant: "error",
        title: `${label} didn't upload`,
        description: `Check you're online and try again. It must be ${limit.formatLabel}, ${maxSizeLabel(limit)} at most.`,
      });
    },
  });

  async function pick(file: File) {
    const rejection = rejectDocument(file, limit);
    if (rejection) {
      toast({ variant: "error", ...rejection });
      return;
    }

    setProgress(0);
    try {
      // `as never` because startUpload's input parameter is typed per endpoint
      // and this component is generic over all four. The value is validated by
      // the route's own schema on arrival, which is where it matters.
      const result = await startUpload([file], uploadInput as never);
      // A failed upload has already toasted through onUploadError; leaving the
      // previous file name in place is correct, since that file is still stored.
      if (!result) return;

      setFileName(file.name);
      onUploaded?.(file.name);
    } finally {
      setProgress(null);
    }
  }

  const missing = required && !fileName;

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border-2 border-dashed p-5 ${
        missing ? "border-accent/50 bg-accent/5" : "border-border"
      }`}
    >
      <Icon className="size-8 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">
          {label}
          {required && (
            <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wide text-earth-ink">
              Required
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{hint}</p>
        {progress !== null ? (
          <div className="mt-2">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label={`Uploading ${label}`}
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${Math.max(2, Math.round(progress))}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {progress >= 100
                ? "Finishing up…"
                : `Uploading — ${Math.round(progress)}%`}
            </p>
          </div>
        ) : fileName ? (
          <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-primary">
            <Check className="size-3 shrink-0" />
            {fileName}
          </p>
        ) : (
          required && (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-earth-ink">
              <AlertCircle className="size-3 shrink-0" />
              Not uploaded yet
            </p>
          )
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
        accept={limit.accept}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          // Cleared before awaiting, so the same file can be picked again
          // after a rejection — the change event won't fire twice otherwise.
          e.target.value = "";
          if (file) await pick(file);
        }}
      />
    </div>
  );
}
