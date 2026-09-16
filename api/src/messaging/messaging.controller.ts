import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { MessagingService } from './messaging.service.js';

@Controller('messages')
@UseGuards(InternalAuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Post()
  send(
    @CurrentUserId() userId: string,
    @Body() body: { mentorshipId: string; content: string },
  ) {
    return this.messaging.send(userId, body.mentorshipId, body.content);
  }

  /** `after` is a message id the caller already holds. See the service. */
  @Get(':mentorshipId')
  thread(
    @CurrentUserId() userId: string,
    @Param('mentorshipId', ParseUUIDPipe) mentorshipId: string,
    @Query('after') after?: string,
  ) {
    return this.messaging.thread(userId, mentorshipId, after);
  }
}
