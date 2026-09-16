import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import type { RequestWithUser } from '../auth/internal-auth.guard.js';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';

/**
 * Admin gate. Layered ON TOP of a session guard, never instead of it —
 * `@UseGuards(InternalAuthGuard, AdminGuard)`.
 *
 * The role is read LIVE from the database on every request, never from a
 * session claim or a cache. users.role is the single column the whole
 * authorization system turns on, and an admin whose access is revoked must lose
 * it on their next request rather than when a token expires.
 *
 * This is the same reasoning the client's requireAdmin() carries: do not rely
 * on edge routing alone, because the proxy's role check only runs when the
 * request host matches the admin subdomain — any other route in would otherwise
 * reach these endpoints with no authorization at all.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as RequestWithUser).userId;
    if (!userId) throw new ForbiddenException('Forbidden');

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.role !== 'admin') throw new ForbiddenException('Forbidden');
    return true;
  }
}
