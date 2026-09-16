import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { CurriculumService } from './curriculum.service.js';
import { MentorshipService } from './mentorship.service.js';

@Controller('mentorship')
@UseGuards(InternalAuthGuard)
export class MentorshipController {
  constructor(
    private readonly mentorship: MentorshipService,
    private readonly curriculum: CurriculumService,
  ) {}

  @Post('request')
  requestMentor(
    @CurrentUserId() userId: string,
    @Body() body: { mentorId: string },
  ) {
    return this.mentorship.requestMentor(userId, body.mentorId);
  }

  @Post(':id/accept')
  accept(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorship.acceptRequest(userId, id);
  }

  @Post(':id/decline')
  decline(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorship.declineRequest(userId, id);
  }

  @Post(':id/promote')
  promote(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorship.promoteMentee(userId, id);
  }

  @Get(':id/stage-status')
  stageStatus(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorship.menteeStageStatus(userId, id);
  }

  @Post(':id/verify-meeting')
  verifyMeeting(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      meetingNumber: number;
      method: string;
      lat?: string | null;
      lng?: string | null;
    },
  ) {
    return this.mentorship.verifyMeeting(userId, {
      mentorshipId: id,
      ...body,
    });
  }

  @Post('reviews')
  submitReview(
    @CurrentUserId() userId: string,
    @Body() body: { mentorId: string; rating: number; comment?: string | null },
  ) {
    return this.mentorship.submitReview(userId, body);
  }

  // ---- curriculum -------------------------------------------------------

  @Post('curriculum')
  addItem(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      mentorshipId: string;
      title: string;
      description?: string;
      targetDate?: string | null;
    },
  ) {
    return this.curriculum.add(userId, body);
  }

  @Post('curriculum/:id/edit')
  editItem(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { title: string; description?: string },
  ) {
    return this.curriculum.edit(userId, { id, ...body });
  }

  @Post('curriculum/:id/delete')
  removeItem(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.curriculum.remove(userId, id);
  }

  @Post('curriculum/:id/move')
  moveItem(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    return this.curriculum.move(userId, id, body.direction);
  }

  @Post('curriculum/:id/status')
  setItemStatus(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'planned' | 'in_progress' | 'done' },
  ) {
    return this.curriculum.setStatus(userId, { id, status: body.status });
  }
}
