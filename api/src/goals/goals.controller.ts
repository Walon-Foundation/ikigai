import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateGoalDto,
  createGoalSchema,
} from './goals.dto.js';
import { GoalsService } from './goals.service.js';

@Controller('goals')
@UseGuards(InternalAuthGuard)
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.goals.list(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createGoalSchema)) body: CreateGoalDto,
  ) {
    return this.goals.create(userId, body);
  }

  // POST, not PATCH: this is an action with a side effect beyond the row —
  // completing a goal is what notifies the mentee's mentor.
  @Post(':id/complete')
  @HttpCode(200)
  complete(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goals.complete(userId, id);
  }

  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goals.remove(userId, id);
  }
}
