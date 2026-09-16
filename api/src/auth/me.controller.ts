import { Controller, Get, UseGuards } from '@nestjs/common';
import { ActorService } from '../common/actor.service.js';
import { CurrentUserId } from './current-user.decorator.js';
import { SessionGuard } from './session.guard.js';

/**
 * The signed-in user, behind the real Better Auth session guard.
 *
 * Also the smallest honest proof that the guard works on both transports, which
 * is why it exists before any domain module has switched over.
 *
 * Returns the DATABASE row, not session.user. The adapter exposes only
 * id/name/email/emailVerified/image — no role, no verifiedAt, no currentStage —
 * so every consumer needs the row anyway, and reading it live is what keeps a
 * revoked mentor's access from surviving in a cached session.
 */
@Controller('me')
@UseGuards(SessionGuard)
export class MeController {
  constructor(private readonly actor: ActorService) {}

  @Get()
  async me(@CurrentUserId() userId: string) {
    const user = await this.actor.get(userId);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      verifiedAt: user.verifiedAt,
      currentStage: user.currentStage,
      onboardingData: user.onboardingData,
    };
  }
}
