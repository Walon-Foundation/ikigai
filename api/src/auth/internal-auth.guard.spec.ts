import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { InternalAuthGuard } from './internal-auth.guard.js';

/**
 * The transitional guard. It is a shared secret, so it is weak by design — but
 * it must be weak in exactly the ways documented and no others. A missing
 * uuid check here would let a caller put arbitrary text where a user id goes.
 */
function contextWith(headers: Record<string, string>) {
  const request = {
    headers,
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const VALID_UUID = 'b13cdabd-028a-4d0c-aaea-55e8b3749802';
// The development default, which env.ts refuses to let production boot with.
const TOKEN = 'dev-internal-token';

describe('InternalAuthGuard', () => {
  const guard = new InternalAuthGuard();

  it('refuses a request with no token', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('refuses a wrong token', () => {
    expect(() =>
      guard.canActivate(
        contextWith({ 'x-internal-token': 'nope', 'x-user-id': VALID_UUID }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('refuses a valid token with no user id', () => {
    expect(() =>
      guard.canActivate(contextWith({ 'x-internal-token': TOKEN })),
    ).toThrow(UnauthorizedException);
  });

  it('refuses a malformed user id', () => {
    // Without this the value reaches Drizzle as-is.
    for (const bad of ['not-a-uuid', '1', "' OR 1=1 --", VALID_UUID.slice(1)]) {
      expect(() =>
        guard.canActivate(
          contextWith({ 'x-internal-token': TOKEN, 'x-user-id': bad }),
        ),
        bad,
      ).toThrow(UnauthorizedException);
    }
  });

  it('accepts a valid pair and attaches the user id', () => {
    const ctx = contextWith({
      'x-internal-token': TOKEN,
      'x-user-id': VALID_UUID,
    });
    expect(guard.canActivate(ctx)).toBe(true);
    const request = ctx.switchToHttp().getRequest() as { userId?: string };
    expect(request.userId).toBe(VALID_UUID);
  });
});
