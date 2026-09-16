import { Module } from '@nestjs/common';
import { SiteContentService } from '../cms/site-content.service.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AdminNotificationsService } from './admin-notifications.service.js';
import { AdminOpsService } from './admin-ops.service.js';
import { VerificationService } from './verification.service.js';

@Module({
  controllers: [AdminController],
  providers: [
    AdminGuard,
    VerificationService,
    AdminOpsService,
    AdminNotificationsService,
    SiteContentService,
  ],
  exports: [VerificationService, AdminOpsService, AdminNotificationsService],
})
export class AdminModule {}
