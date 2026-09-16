import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { MatchingService } from './matching.service.js';

@Controller('match')
@UseGuards(InternalAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get()
  suggestions(@CurrentUserId() userId: string) {
    return this.matching.suggestions(userId);
  }
}
