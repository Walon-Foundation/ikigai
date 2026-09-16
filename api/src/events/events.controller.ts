import { Controller, Delete, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { EventsService } from './events.service.js';

@Controller('events')
@UseGuards(InternalAuthGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post(':id/rsvp')
  rsvp(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.rsvp(userId, id);
  }

  @Delete(':id/rsvp')
  cancel(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.cancelRsvp(userId, id);
  }

  @Post(':id/check-in')
  checkIn(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.checkIn(userId, id);
  }
}
