import { Module } from '@nestjs/common';
import { JournalController } from './journal.controller.js';
import { JournalService } from './journal.service.js';

@Module({
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}
