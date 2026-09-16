import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { JournalService } from './journal.service.js';

@Controller('journal')
@UseGuards(InternalAuthGuard)
export class JournalController {
  constructor(private readonly journal: JournalService) {}

  @Post()
  save(
    @CurrentUserId() userId: string,
    @Body()
    body: { content: string; visibility: string; expectedOwnerId?: string },
  ) {
    return this.journal.saveEntry(userId, body);
  }

  @Post('feedback')
  addFeedback(
    @CurrentUserId() userId: string,
    @Body() body: { entryId: string; menteeId: string; comment: string },
  ) {
    return this.journal.addFeedback(userId, body);
  }

  /** Shared entries for one mentee. The mentor is the CALLER, never a param. */
  @Get('shared/:menteeId')
  shared(
    @CurrentUserId() userId: string,
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
  ) {
    return this.journal.sharedWithMentor(userId, menteeId);
  }
}
