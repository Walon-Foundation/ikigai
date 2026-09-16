import { z } from 'zod';

const MB = 1024 * 1024;

/**
 * The six kinds of upload this platform accepts, and the rules for each.
 *
 * Every rule here is enforced SERVER-SIDE, after the object is stored, by
 * heading it in R2 — see UploadsService.confirm. A picker's `accept` attribute
 * and a pre-flight check in the browser are conveniences a crafted request
 * walks straight past, so a cap that only the client enforces is not a cap.
 *
 * `visibility` is the important column. Only CMS imagery is public: those are
 * published photographs on a marketing site, and a signed URL that expired
 * would break every cached page embedding one. Everything else — a government
 * ID, a CV, a photograph taken by a child — is private, read only through a
 * short-lived signed URL minted at view time.
 */
export const UPLOAD_KINDS = {
  avatar: {
    maxBytes: 4 * MB,
    mimePrefixes: ['image/'],
    visibility: 'public' as const,
    // Any signed-in user may set their own photo.
    role: null,
  },
  governmentId: {
    // A national ID, passport or licence is usually photographed, not scanned,
    // so this one accepts images as well as PDFs.
    maxBytes: 10 * MB,
    mimePrefixes: ['image/', 'application/pdf'],
    visibility: 'private' as const,
    role: 'mentor' as const,
  },
  mentorCv: {
    // PDF only. The admin reviewing it needs the text — a photograph of a
    // printed page is not reliably readable.
    maxBytes: 10 * MB,
    mimePrefixes: ['application/pdf'],
    visibility: 'private' as const,
    role: 'mentor' as const,
  },
  taskEvidencePhoto: {
    // Images only. Accepting a PDF here would let a mentee satisfy the photo
    // half of test-and-photo with the file they would have submitted instead.
    maxBytes: 8 * MB,
    mimePrefixes: ['image/'],
    visibility: 'private' as const,
    role: 'mentee' as const,
  },
  taskEvidencePdf: {
    maxBytes: 10 * MB,
    mimePrefixes: ['application/pdf'],
    visibility: 'private' as const,
    role: 'mentee' as const,
  },
  cmsImage: {
    maxBytes: 8 * MB,
    mimePrefixes: ['image/'],
    visibility: 'public' as const,
    role: 'admin' as const,
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

export const requestUploadSchema = z.object({
  kind: z.enum(
    Object.keys(UPLOAD_KINDS) as [UploadKind, ...UploadKind[]],
  ),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(160),
  /** Required for task evidence — which task the file is for. */
  taskId: z.uuid().optional(),
});
export type RequestUploadDto = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z.object({
  kind: z.enum(
    Object.keys(UPLOAD_KINDS) as [UploadKind, ...UploadKind[]],
  ),
  key: z.string().min(1).max(512),
  fileName: z.string().min(1).max(255),
  taskId: z.uuid().optional(),
});
export type ConfirmUploadDto = z.infer<typeof confirmUploadSchema>;

/** Does this content type satisfy the kind's allowed prefixes? */
export function mimeAllowed(kind: UploadKind, contentType: string): boolean {
  const type = contentType.split(';')[0].trim().toLowerCase();
  return UPLOAD_KINDS[kind].mimePrefixes.some((p) =>
    p.endsWith('/') ? type.startsWith(p) : type === p,
  );
}
