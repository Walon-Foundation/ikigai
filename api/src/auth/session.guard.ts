import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from './auth.js';
import type { RequestWithUser } from './internal-auth.guard.js';

/**
 * The real session guard: Better Auth, accepting BOTH transports.
 *
 * A browser sends a cookie on the parent domain. Expo has no cookies and sends
 * `Authorization: Bearer <token>` from expo-secure-store. Better Auth resolves
 * either from the request headers, so this guard does not need to know which
 * client it is talking to — and must not assume, since both will be live at
 * once during the mobile rollout.
 *
 * Replaces InternalAuthGuard, whose shared secret let any holder act as any
 * user. Both exist only while the client is mid-cutover; the internal one goes
 * with the last Clerk-authenticated surface.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else if (value) headers.set(key, value);
    }

    const session = await auth.api.getSession({ headers });
    if (!session?.user?.id) {
      throw new UnauthorizedException('Not signed in');
    }

    // Read back out by @CurrentUserId(). Note this is the id only — the full
    // users row is NOT taken from the session, because the adapter exposes just
    // id/name/email/emailVerified/image. Anything authorization depends on
    // (role, verifiedAt) is read live by ActorService.
    (request as RequestWithUser).userId = session.user.id;
    return true;
  }
}
