import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AccountModule } from './account/account.module.js';
import { CommonModule } from './common/common.module.js';
import { DatabaseModule } from './db/database.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { MailModule } from './mail/mail.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { JournalModule } from './journal/journal.module.js';
import { MentorshipModule } from './mentorship/mentorship.module.js';
import { PurposeBookModule } from './purpose-book/purpose-book.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { TasksModule } from './tasks/tasks.module.js';

// The scaffold shipped @nestjs/observe wired to a hosted telemetry service with
// literal 'YOUR_APP_KEY' / 'YOUR_APP_SECRET' placeholders. Removed rather than
// left to fail at boot: this platform holds safeguarding records about minors,
// and third-party tracing is a decision to make deliberately, not one to
// inherit from a scaffold. Re-add it consciously if it is wanted.

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    MailModule,
    NotificationsModule,
    AccountModule,
    OnboardingModule,
    MentorshipModule,
    TasksModule,
    SkillsModule,
    JournalModule,
    PurposeBookModule,
    GoalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
