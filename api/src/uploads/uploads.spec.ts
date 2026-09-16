import { describe, expect, it } from 'vitest';
import { mimeAllowed, UPLOAD_KINDS, type UploadKind } from './uploads.dto.js';

/**
 * These rules are the only thing standing between a crafted request and the
 * bucket. A picker's `accept` attribute and a pre-flight check in the browser
 * are conveniences a crafted request walks straight past, so if these are
 * wrong, nothing else catches it.
 */
describe('upload kinds', () => {
  it('only CMS imagery and avatars are public; everything else is private', () => {
    const publicKinds = (Object.keys(UPLOAD_KINDS) as UploadKind[]).filter(
      (k) => UPLOAD_KINDS[k].visibility === 'public',
    );
    expect(publicKinds.sort()).toEqual(['avatar', 'cmsImage']);
  });

  it('keeps vetting documents and task evidence private', () => {
    // A government ID and a photograph taken by a child are the two things this
    // platform most needs never to sit at a public URL. Under the previous
    // provider they did.
    for (const kind of [
      'governmentId',
      'mentorCv',
      'taskEvidencePhoto',
      'taskEvidencePdf',
    ] as UploadKind[]) {
      expect(UPLOAD_KINDS[kind].visibility).toBe('private');
    }
  });

  describe('PDF-only kinds reject images', () => {
    // "Submit the assignment as a PDF" is not satisfied by a photograph, and a
    // CV the admin cannot read is a CV they cannot vet.
    for (const kind of ['mentorCv', 'taskEvidencePdf'] as UploadKind[]) {
      it(kind, () => {
        expect(mimeAllowed(kind, 'application/pdf')).toBe(true);
        expect(mimeAllowed(kind, 'image/jpeg')).toBe(false);
        expect(mimeAllowed(kind, 'image/png')).toBe(false);
      });
    }
  });

  it('a government ID accepts a photo as well as a PDF', () => {
    // Usually photographed, not scanned.
    expect(mimeAllowed('governmentId', 'image/jpeg')).toBe(true);
    expect(mimeAllowed('governmentId', 'application/pdf')).toBe(true);
  });

  it('task evidence photos reject PDFs', () => {
    // Otherwise a mentee could satisfy the photo half of test-and-photo with
    // the same file they would have submitted as the PDF route instead.
    expect(mimeAllowed('taskEvidencePhoto', 'image/jpeg')).toBe(true);
    expect(mimeAllowed('taskEvidencePhoto', 'application/pdf')).toBe(false);
  });

  it('ignores charset parameters and casing on the content type', () => {
    expect(mimeAllowed('mentorCv', 'APPLICATION/PDF; charset=binary')).toBe(true);
  });

  it('rejects a type that merely starts with an allowed one', () => {
    // "application/pdf-evil" must not pass an exact-match rule.
    expect(mimeAllowed('mentorCv', 'application/pdf-evil')).toBe(false);
  });

  it('every kind has a size cap, and none is unbounded', () => {
    for (const kind of Object.keys(UPLOAD_KINDS) as UploadKind[]) {
      const max = UPLOAD_KINDS[kind].maxBytes;
      expect(max).toBeGreaterThan(0);
      expect(max).toBeLessThanOrEqual(10 * 1024 * 1024);
    }
  });

  it('restricts the privileged kinds to a role', () => {
    expect(UPLOAD_KINDS.governmentId.role).toBe('mentor');
    expect(UPLOAD_KINDS.mentorCv.role).toBe('mentor');
    expect(UPLOAD_KINDS.cmsImage.role).toBe('admin');
    expect(UPLOAD_KINDS.taskEvidencePhoto.role).toBe('mentee');
    // An avatar is the one thing anyone signed in may set.
    expect(UPLOAD_KINDS.avatar.role).toBeNull();
  });
});
