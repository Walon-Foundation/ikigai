import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { SafetyService } from './safety.service.js';

@Controller('safety')
@UseGuards(InternalAuthGuard)
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  // No role check beyond being signed in, deliberately: a mentor or parent
  // raising a concern about a young person is exactly as valid as a mentee.
  @Post('reports')
  submit(
    @CurrentUserId() userId: string,
    @Body() body: { type: string; notes: string },
  ) {
    return this.safety.submitReport(userId, body);
  }

  @Post('module-complete')
  complete(@CurrentUserId() userId: string) {
    return this.safety.awardSafetyMilestone(userId);
  }
}
