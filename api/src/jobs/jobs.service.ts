import { Injectable, Logger } from '@nestjs/common';
import { runNotificationJobs } from './notification-jobs.helpers.js';
import { purgeExpiredAccounts } from './purge.helpers.js';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  /** Purge accounts whose deletion grace period has expired. */
  async purgeAccounts() {
    const purged = await purgeExpiredAccounts();
    this.logger.log(`purge: ${purged.length} account(s) purged`);
    return { purged: purged.length };
  }

  /**
   * The daily notification run: inactivity nudges, stalled-milestone
   * reminders, mentor check-in prompts, stage-readiness alerts and the weekly
   * summaries.
   *
   * One entrypoint running every job rather than one per job. Adding a
   * scheduled notification means adding it to the jobs helper, not adding a
   * deployment.
   *
   * Individual jobs report "failed" rather than throwing, so a broken one is
   * visible in the response and the logs without taking the rest down.
   */
  async runNotifications() {
    return runNotificationJobs();
  }
}
