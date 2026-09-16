import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(InternalAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  feed(@CurrentUserId() userId: string) {
    return this.notifications.feed(userId);
  }

  /** Body `{ id }` marks one read; `{}` marks all read. */
  @Patch()
  markRead(
    @CurrentUserId() userId: string,
    @Body() body: { id?: string } | undefined,
  ) {
    return this.notifications.markRead(userId, body?.id);
  }

  @Post('push-subscription')
  async saveSubscription(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ) {
    const result = await this.notifications.saveSubscription(userId, body);
    if (!result.ok) throw new BadRequestException('Invalid push subscription');
    return result;
  }
}
