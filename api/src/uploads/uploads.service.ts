import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  mentorDocuments,
  mentorships,
  taskSubmissions,
  tasks,
  users,
} from '../db/schema.js';
import {
  type ConfirmUploadDto,
  mimeAllowed,
  type RequestUploadDto,
  UPLOAD_KINDS,
  type UploadKind,
} from './uploads.dto.js';
import { R2Service } from './r2.service.js';

@Injectable()
export class UploadsService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly r2: R2Service,
    private readonly actor: ActorService,
  ) {}

  private assertConfigured() {
    if (!this.r2.configured) {
      throw new ServiceUnavailableException(
        'File storage is not configured on this deployment.',
      );
    }
  }

  /**
   * Authorize an upload and hand back a presigned URL.
   *
   * The bytes never pass through this process — the client PUTs straight to R2.
   * What happens here is the authorization the old UploadThing middleware did,
   * and it happens BEFORE any URL exists.
   */
  async request(userId: string, input: RequestUploadDto) {
    this.assertConfigured();
    const rules = UPLOAD_KINDS[input.kind];

    // Role, live from the database.
    const me = await this.actor.get(userId);
    if (rules.role && me.role !== rules.role) {
      throw new ForbiddenException('Forbidden');
    }

    // Content type is checked here AND signed into the URL, so the object
    // cannot be stored as something other than what was authorized.
    if (!mimeAllowed(input.kind, input.contentType)) {
      throw new BadRequestException(
        `That file type is not accepted for ${input.kind}.`,
      );
    }

    // Task evidence must name a task this mentee owns and which is still open.
    // Without this join any signed-in mentee could attach a file to any task on
    // the platform, including another mentee's.
    if (input.kind === 'taskEvidencePhoto' || input.kind === 'taskEvidencePdf') {
      if (!input.taskId) throw new BadRequestException('Missing task');
      await this.requireOwnOpenTask(me.id, input.taskId);
    }

    // Keys are namespaced by kind and owner, and end in a random id: a key is
    // never guessable from a user id, and two uploads never collide.
    const key = `${input.kind}/${me.id}/${randomUUID()}`;

    const uploadUrl = await this.r2.presignPut(
      key,
      input.contentType,
      rules.visibility,
    );

    return { key, uploadUrl, maxBytes: rules.maxBytes };
  }

  /**
   * Verify what was actually stored, then record it.
   *
   * This is where the size cap is enforced. A presigned PUT cannot enforce one
   * — the signature covers the key and the content type, not the body length —
   * so the object is headed after the fact and DELETED if it breaks the rules.
   * Checking in the browser only would mean the cap did not exist.
   */
  async confirm(userId: string, input: ConfirmUploadDto) {
    this.assertConfigured();
    const rules = UPLOAD_KINDS[input.kind];
    const me = await this.actor.get(userId);

    if (rules.role && me.role !== rules.role) {
      throw new ForbiddenException('Forbidden');
    }
    // The key is minted by request() and namespaced by owner, so this also
    // stops one user confirming another user's upload into their own record.
    if (!input.key.startsWith(`${input.kind}/${me.id}/`)) {
      throw new ForbiddenException('That upload does not belong to you.');
    }

    const stored = await this.r2.head(input.key, rules.visibility);
    if (!stored) {
      throw new BadRequestException('That upload was not found in storage.');
    }

    const violation =
      stored.size > rules.maxBytes
        ? `That file is larger than the ${Math.round(rules.maxBytes / (1024 * 1024))}MB limit.`
        : !mimeAllowed(input.kind, stored.contentType)
          ? 'That file type is not accepted.'
          : null;

    if (violation) {
      await this.r2.delete(input.key, rules.visibility);
      throw new BadRequestException(violation);
    }

    switch (input.kind) {
      case 'avatar': {
        const url = this.r2.publicUrl(input.key);
        await this.db
          .update(users)
          .set({ avatarUrl: url })
          .where(eq(users.id, me.id));
        return { ok: true, url };
      }
      case 'cmsImage':
        // Nothing is written to the database. The URL goes back to the admin
        // form, which saves it as part of the row being edited — a photo
        // uploaded for a story the admin then abandons should not leave an
        // orphan record behind.
        return { ok: true, url: this.r2.publicUrl(input.key) };

      case 'governmentId':
        return this.storeDocument(me.id, 'government_id', input);
      case 'mentorCv':
        return this.storeDocument(me.id, 'cv', input);

      case 'taskEvidencePhoto':
        return this.storeEvidence(me.id, 'photo', input);
      case 'taskEvidencePdf':
        return this.storeEvidence(me.id, 'pdf', input);
    }
  }

  /** A short-lived signed URL for reading a private object. */
  async viewUrl(userId: string, key: string) {
    this.assertConfigured();
    const me = await this.actor.get(userId);

    // An admin may read any vetting document or evidence file — that is the
    // review queue. Anyone else may read only their own.
    if (me.role !== 'admin' && !key.includes(`/${me.id}/`)) {
      throw new ForbiddenException('Forbidden');
    }

    const url = await this.r2.presignGet(key);
    if (!url) throw new BadRequestException('Could not sign that file.');
    return { url };
  }

  // ---- internals --------------------------------------------------------

  private async requireOwnOpenTask(menteeId: string, taskId: string) {
    const [task] = await this.db
      .select({ id: tasks.id, status: tasks.status })
      .from(tasks)
      .innerJoin(
        mentorships,
        and(
          eq(tasks.mentorshipId, mentorships.id),
          eq(mentorships.menteeId, menteeId),
        ),
      )
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!task) throw new ForbiddenException('Forbidden');
    // A completed or failed task is decided; new evidence cannot be filed
    // against it, and letting one in would let a mentee overwrite the record
    // their mentor already ruled on.
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException('This task is already resolved');
    }
    return task;
  }

  /**
   * Store a vetting document.
   *
   * One document per kind per mentor: a re-upload replaces the previous file of
   * THIS kind rather than stacking, and the old object is removed instead of
   * being orphaned. Scoped to (userId, kind), never userId alone — matching on
   * the user would make uploading a CV delete the government ID and take its
   * file with it.
   *
   * Only the KEY is stored, never a URL. The admin screen mints a signed URL at
   * view time, so there is no lasting link to a government ID anywhere.
   */
  private async storeDocument(
    userId: string,
    kind: 'government_id' | 'cv',
    input: ConfirmUploadDto,
  ) {
    const mine = and(
      eq(mentorDocuments.userId, userId),
      eq(mentorDocuments.kind, kind),
    );

    const replaced = await this.db
      .delete(mentorDocuments)
      .where(mine)
      .returning({ fileKey: mentorDocuments.fileKey });

    await this.db.insert(mentorDocuments).values({
      userId,
      kind,
      fileKey: input.key,
      fileName: input.fileName,
    });

    for (const row of replaced) {
      if (row.fileKey && row.fileKey !== input.key) {
        await this.r2.delete(row.fileKey);
      }
    }

    return { ok: true, fileName: input.fileName };
  }

  /** Store a piece of task evidence against its submission. */
  private async storeEvidence(
    menteeId: string,
    column: 'photo' | 'pdf',
    input: ConfirmUploadDto,
  ) {
    if (!input.taskId) throw new BadRequestException('Missing task');
    await this.requireOwnOpenTask(menteeId, input.taskId);

    const [existing] = await this.db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, input.taskId))
      .limit(1);

    const fields =
      column === 'photo'
        ? { photoFileKey: input.key, photoFileName: input.fileName }
        : { pdfFileKey: input.key, pdfFileName: input.fileName };

    await Promise.all([
      this.db
        .insert(taskSubmissions)
        .values({
          taskId: input.taskId,
          menteeId,
          // An upload can be the first thing that happens on a task, before the
          // mentee has explicitly chosen a route. The file itself names it.
          kind: existing?.kind ?? (column === 'pdf' ? 'pdf' : 'test_and_photo'),
          ...fields,
        })
        .onConflictDoUpdate({
          target: taskSubmissions.taskId,
          set: { ...fields, submittedAt: new Date() },
        }),
      // Pull the task back out of review, matching reopenIfSubmitted in
      // TasksService — a mentor must never be reviewing a submission that is
      // still being changed underneath them.
      this.db
        .update(tasks)
        .set({ status: 'assigned', submittedAt: null })
        .where(and(eq(tasks.id, input.taskId), eq(tasks.status, 'submitted'))),
    ]);

    const stale =
      column === 'photo' ? existing?.photoFileKey : existing?.pdfFileKey;
    if (stale && stale !== input.key) await this.r2.delete(stale);

    return { ok: true, fileName: input.fileName };
  }
}
