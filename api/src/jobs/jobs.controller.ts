import { Controller, Get, UseGuards } from '@nestjs/common';
import { CronGuard } from './cron.guard.js';
import { JobsService } from './jobs.service.js';

@Controller('cron')
@UseGuards(CronGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('purge-accounts')
  purge() {
    return this.jobs.purgeAccounts();
  }

  @Get('notifications')
  notifications() {
    return this.jobs.runNotifications();
  }
}
