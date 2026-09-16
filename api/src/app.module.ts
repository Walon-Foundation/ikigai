import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './db/database.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { MailModule } from './mail/mail.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

// The scaffold shipped @nestjs/observe wired to a hosted telemetry service with
// literal 'YOUR_APP_KEY' / 'YOUR_APP_SECRET' placeholders. Removed rather than
// left to fail at boot: this platform holds safeguarding records about minors,
// and third-party tracing is a decision to make deliberately, not one to
// inherit from a scaffold. Re-add it consciously if it is wanted.

@Module({
  imports: [DatabaseModule, MailModule, NotificationsModule, GoalsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
