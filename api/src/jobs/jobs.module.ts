import { Module } from '@nestjs/common';
import { CronGuard } from './cron.guard.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  controllers: [JobsController],
  providers: [JobsService, CronGuard],
  exports: [JobsService],
})
export class JobsModule {}
