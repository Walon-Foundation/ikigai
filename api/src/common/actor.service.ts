import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { users } from '../db/schema.js';
import type { DbUser } from './types.js';

/**
 * Loads the acting user's row and asserts what they are allowed to be.
 *
 * Replaces the role helpers in the client's lib/db-user.ts. Only the lookup
 * changes — that file resolves a Clerk session, whereas here the guard has
 * already established the user id. The assertions themselves are identical and
 * must stay that way.
 *
 * `verifiedAt` is read LIVE on every call, never cached. A mentor whose
 * approval is revoked mid-incident must lose access on their next action, not
 * when some cache expires — see the cookieCache warning in docs/02-auth.md.
 */
@Injectable()
export class ActorService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async get(userId: string): Promise<DbUser> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Any of the given roles. */
  async requireRole(
    userId: string,
    roles: readonly string[],
  ): Promise<DbUser> {
    const user = await this.get(userId);
    if (!roles.includes(user.role)) throw new ForbiddenException('Forbidden');
    return user;
  }

  /** A mentor ikigai has actually approved. */
  async requireApprovedMentor(userId: string): Promise<DbUser> {
    const user = await this.get(userId);
    if (user.role !== 'mentor') throw new ForbiddenException('Forbidden');
    if (!user.verifiedAt) throw new ForbiddenException('Not approved');
    return user;
  }

  /**
   * A mentee ikigai has approved.
   *
   * The gate is on being MATCHED, not on using the app: an applicant waiting on
   * review keeps their journal, their journey and their clubs, and only this
   * one door is shut.
   */
  async requireApprovedMentee(userId: string): Promise<DbUser> {
    const user = await this.get(userId);
    if (user.role !== 'mentee') throw new ForbiddenException('Forbidden');
    if (!user.verifiedAt) {
      throw new ForbiddenException(
        user.rejectedAt
          ? "Your application wasn't approved. Contact the ikigai team if you think this is a mistake."
          : "Your application is still being reviewed. You'll be able to request a mentor once the ikigai team approves it.",
      );
    }
    return user;
  }
}
