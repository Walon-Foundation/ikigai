import { Module } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard.js';
import { CmsController } from './cms.controller.js';
import { CmsService } from './cms.service.js';

@Module({
  controllers: [CmsController],
  providers: [CmsService, AdminGuard],
  exports: [CmsService],
})
export class CmsModule {}
