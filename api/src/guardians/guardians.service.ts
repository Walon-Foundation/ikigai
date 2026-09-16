import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { guardianLinks } from '../db/schema.js';
import { dispatch } from '../notifications/internal/dispatch.js';

@Injectable()
export class GuardiansService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  private async resolve(
    userId: string,
    linkId: string,
    status: 'accepted' | 'declined',
  ) {
    const me = await this.actor.get(userId);

    // The child may only resolve a request addressed to THEM. Scoping the
    // update by childId is the check — there is no separate lookup to race.
    const [link] = await this.db
      .update(guardianLinks)
      .set({ status, respondedAt: new Date() })
      .where(
        and(
          eq(guardianLinks.id, linkId),
          eq(guardianLinks.childId, me.id),
          eq(guardianLinks.status, 'pending'),
        ),
      )
      .returning({ id: guardianLinks.id, parentId: guardianLinks.parentId });

    // The parent has been waiting on an answer with no way to see one arrive —
    // the parent portal shows nothing until the link is accepted, so a decline
    // looked identical to a request that had never been opened.
    if (link?.parentId) {
      await dispatch({
        key:
          status === 'accepted'
            ? 'GUARDIAN_LINK_ACCEPTED'
            : 'GUARDIAN_LINK_DECLINED',
        to: link.parentId,
        vars: { child: me.displayName ?? 'Your child' },
        dedupe: `${link.id}:${status}`,
      });
    }

    return { ok: !!link };
  }

  accept(userId: string, linkId: string) {
    return this.resolve(userId, linkId, 'accepted');
  }

  decline(userId: string, linkId: string) {
    return this.resolve(userId, linkId, 'declined');
  }
}
