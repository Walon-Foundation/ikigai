import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { RequestWithUser } from './internal-auth.guard.js';

/**
 * The authenticated users.id, as established by InternalAuthGuard.
 *
 * Only meaningful on a route the guard protects — without it the property is
 * undefined, so the guard and this decorator are used as a pair.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.userId;
  },
);
