import { Module } from '@nestjs/common';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';
import { DataExportService } from './data-export.service.js';

@Module({
  controllers: [AccountController],
  providers: [AccountService, DataExportService],
  exports: [AccountService, DataExportService],
})
export class AccountModule {}
