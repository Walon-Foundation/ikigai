import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AccountModule } from './account/account.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CmsModule } from './cms/cms.module.js';
import { CommonModule } from './common/common.module.js';
import { DatabaseModule } from './db/database.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { MailModule } from './mail/mail.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { EnquiriesModule } from './enquiries/enquiries.module.js';
import { EventsModule } from './events/events.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { GuardiansModule } from './guardians/guardians.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { JournalModule } from './journal/journal.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { SafetyModule } from './safety/safety.module.js';
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
    AuthModule,
    MailModule,
    NotificationsModule,
    AccountModule,
    OnboardingModule,
    MentorshipModule,
    TasksModule,
    SkillsModule,
    JournalModule,
    PurposeBookModule,
    GroupsModule,
    EventsModule,
    GuardiansModule,
    SafetyModule,
    MessagingModule,
    MatchingModule,
    JobsModule,
    CmsModule,
    AdminModule,
    EnquiriesModule,
    GoalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
