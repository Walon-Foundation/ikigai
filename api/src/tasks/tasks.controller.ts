import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { type NewQuestion, TasksService } from './tasks.service.js';

@Controller('tasks')
@UseGuards(InternalAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  // ---- mentor ----
  @Post()
  assign(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      mentorshipId: string;
      title: string;
      description?: string;
      stage?: string | null;
      requiresEvidence?: boolean;
      questions?: NewQuestion[];
    },
  ) {
    return this.tasks.assignTask(userId, body);
  }

  @Post(':id/complete')
  complete(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.completeTask(userId, id);
  }

  @Post(':id/fail')
  fail(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.failTask(userId, id);
  }

  // ---- mentee ----
  @Post(':id/evidence-kind')
  chooseEvidenceKind(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { kind: string },
  ) {
    return this.tasks.chooseEvidenceKind(userId, id, body.kind);
  }

  @Post(':id/test')
  submitTest(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { answers: Record<string, number> },
  ) {
    return this.tasks.submitTest(userId, id, body.answers);
  }

  @Post(':id/submit')
  submitForReview(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { note?: string },
  ) {
    return this.tasks.submitForReview(userId, id, body?.note);
  }
}
