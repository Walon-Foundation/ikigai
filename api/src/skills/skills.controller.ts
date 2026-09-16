import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { SkillsService } from './skills.service.js';

@Controller('skills/milestones')
@UseGuards(InternalAuthGuard)
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Post(':id/submit')
  submit(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.skills.submitMilestone(userId, id);
  }

  @Post(':id/approve')
  approve(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.skills.approveMilestone(userId, id);
  }

  @Post(':id/revise')
  revise(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { feedback?: string },
  ) {
    return this.skills.requestRevision(userId, id, body?.feedback ?? '');
  }
}
