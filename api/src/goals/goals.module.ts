import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller.js';
import { GoalsService } from './goals.service.js';

// The pattern every other domain module follows: controller + service + zod
// DTOs, with the Drizzle client injected by token from the global
// DatabaseModule. See docs/01-api-server.md for the full module list.
@Module({
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
