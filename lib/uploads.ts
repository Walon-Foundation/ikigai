// Constraints for the vetting documents a mentor applicant uploads.
//
// Declared once because three places have to agree about them: the UploadThing
// route (app/api/uploadthing/core.ts), which is the only enforcement that
// actually counts; the file picker's `accept` attribute; and the pre-flight
// check in components/document-upload.tsx, which exists so a rejection arrives
// as a sentence the applicant can act on rather than a failed request. Change a
// number here and all three move together.

export type DocumentEndpoint = "governmentId" | "mentorCv";

export type DocumentLimit = {
  /** Matches UploadThing's own unit: 1MB is 1024 * 1024 bytes. */
  maxBytes: number;
  /** UploadThing's `maxFileSize` string for the same number. */
  maxFileSize: string;
  /** The picker's `accept` attribute. */
  accept: string;
  /** MIME types the pre-flight check allows. A trailing `/*` is a prefix. */
  mimeTypes: string[];
  /**
   * Lowercase, dot-prefixed. Checked as well as the MIME type because the
   * cheap Android browsers a lot of applicants use hand back a File with an
   * empty `type`, and rejecting those would reject valid PDFs.
   */
  extensions: string[];
  /** Named in the error message: "must be a PDF". */
  formatLabel: string;
  /** What to do about a wrong format, in the applicant's own terms. */
  formatAdvice: string;
};

const MB = 1024 * 1024;

export const DOCUMENT_LIMITS: Record<DocumentEndpoint, DocumentLimit> = {
  // A national ID, passport or licence is usually photographed, not scanned,
  // so this one keeps accepting images.
  governmentId: {
    maxBytes: 8 * MB,
    maxFileSize: "8MB",
    accept: "application/pdf,image/*",
    mimeTypes: ["application/pdf", "image/*"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"],
    formatLabel: "a PDF or a photo",
    formatAdvice: "Photograph or scan the document, then upload it again.",
  },
  // PDF only. A CV is a document, and the admin team reviewing it needs the
  // text — a photograph of a printed page is not reliably readable, and a
  // .docx is not reliably openable on the reviewer's machine.
  mentorCv: {
    maxBytes: 10 * MB,
    maxFileSize: "10MB",
    accept: "application/pdf",
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    formatLabel: "a PDF",
    formatAdvice:
      "Open your CV and use Save as PDF or Export as PDF, then upload that file.",
  },
};

/** "10MB" — the same number the picker and the server enforce. */
export function maxSizeLabel(limit: DocumentLimit): string {
  return `${Math.round(limit.maxBytes / MB)}MB`;
}

/** Human file size for an error message: "14.2MB". */
export function formatBytes(bytes: number): string {
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / MB).toFixed(1)}MB`;
}

export type DocumentRejection = { title: string; description: string };

/**
 * Why this file cannot be uploaded, or null if it can.
 *
 * This does not replace the server's checks — a server action and an
 * UploadThing route are both public endpoints, and neither trusts the browser.
 * It runs first so the applicant learns what is wrong before spending airtime
 * pushing a file that was always going to be refused.
 */
export function rejectDocument(
  file: File,
  limit: DocumentLimit,
): DocumentRejection | null {
  const name = file.name.toLowerCase();
  const extensionOk = limit.extensions.some((ext) => name.endsWith(ext));
  const typeOk = limit.mimeTypes.some((mime) =>
    mime.endsWith("/*")
      ? file.type.startsWith(mime.slice(0, -1))
      : file.type === mime,
  );

  // Either signal is enough. An empty `type` leaves the extension to decide;
  // a correct type covers a file saved without an extension.
  if (!typeOk && !extensionOk) {
    return {
      title: "Wrong file format",
      description: `This must be ${limit.formatLabel}. ${limit.formatAdvice}`,
    };
  }

  if (file.size > limit.maxBytes) {
    return {
      title: "File is too large",
      description: `The limit is ${maxSizeLabel(limit)} and this file is ${formatBytes(file.size)}. Export it again at a lower quality, or split it.`,
    };
  }

  if (file.size === 0) {
    return {
      title: "That file is empty",
      description:
        "Nothing was read from the file. Pick it again, or try a different copy.",
    };
  }

  return null;
}
