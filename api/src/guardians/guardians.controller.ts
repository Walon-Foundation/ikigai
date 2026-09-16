import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { GuardiansService } from './guardians.service.js';

@Controller('guardians/links')
@UseGuards(InternalAuthGuard)
export class GuardiansController {
  constructor(private readonly guardians: GuardiansService) {}

  @Post(':id/accept')
  accept(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.guardians.accept(userId, id);
  }

  @Post(':id/decline')
  decline(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.guardians.decline(userId, id);
  }
}
