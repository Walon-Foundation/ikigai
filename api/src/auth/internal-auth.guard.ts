import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { env } from '../env.js';

/**
 * TRANSITIONAL. Delete this when Better Auth lands — see docs/02-auth.md.
 *
 * Right now the only caller is the Next.js client, which still holds the Clerk
 * session and has already resolved the user before it calls us. So the API
 * cannot authenticate anyone itself yet; it can only verify that the caller is
 * our own server and trust the user id it forwards.
 *
 * Two headers, both required:
 *   x-internal-token  a shared secret proving the caller is our client
 *   x-user-id         the users.id row the client already authenticated
 *
 * This is safe ONLY while x-internal-token is secret and the API is not
 * reachable by browsers. It is not a substitute for real auth: anyone holding
 * the token can act as any user. That is precisely why it goes away, and why
 * INTERNAL_API_TOKEN is required at boot in production rather than defaulted.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.header('x-internal-token');
    if (!token || token !== env.internalApiToken) {
      throw new UnauthorizedException('Invalid internal token');
    }

    const userId = request.header('x-user-id');
    if (!userId || !UUID_RE.test(userId)) {
      throw new UnauthorizedException('Missing or malformed x-user-id');
    }

    // Read back out by the @CurrentUserId() decorator.
    (request as RequestWithUser).userId = userId;
    return true;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RequestWithUser = Request & { userId: string };
