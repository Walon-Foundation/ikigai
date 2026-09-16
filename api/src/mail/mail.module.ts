import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service.js';

// Global: almost every domain module that makes a decision about a person ends
// up telling them about it, and threading MailModule through each one's imports
// adds noise without adding a boundary.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
