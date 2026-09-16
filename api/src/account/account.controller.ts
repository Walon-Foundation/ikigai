import { Body, Controller, Delete, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AccountService } from './account.service.js';
import {
  type JournalDefaultDto,
  journalDefaultSchema,
  type NotificationPrefsDto,
  notificationPrefsSchema,
  type UpdateInterestsDto,
  updateInterestsSchema,
  type UpdateProfileDto,
  updateProfileSchema,
} from './account.dto.js';

@Controller('account')
@UseGuards(InternalAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Patch('profile')
  updateProfile(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto,
  ) {
    return this.account.updateProfile(userId, body);
  }

  @Put('interests')
  updateInterests(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateInterestsSchema)) body: UpdateInterestsDto,
  ) {
    return this.account.updateInterests(userId, body);
  }

  @Patch('journal-default')
  updateJournalDefault(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(journalDefaultSchema)) body: JournalDefaultDto,
  ) {
    return this.account.updateJournalDefault(userId, body);
  }

  /** Body is the subscription object, or literal null to clear it. */
  @Put('push-subscription')
  savePushSubscription(
    @CurrentUserId() userId: string,
    @Body() body: { subscription: unknown },
  ) {
    return this.account.savePushSubscription(userId, body?.subscription ?? null);
  }

  @Put('notification-prefs')
  updateNotificationPrefs(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(notificationPrefsSchema))
    body: NotificationPrefsDto,
  ) {
    return this.account.updateNotificationPrefs(userId, body);
  }

  @Post('deletion')
  requestDeletion(@CurrentUserId() userId: string) {
    return this.account.requestDeletion(userId);
  }

  @Delete('deletion')
  cancelDeletion(@CurrentUserId() userId: string) {
    return this.account.cancelDeletion(userId);
  }
}
