import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

// Global: nearly every domain module notifies someone as part of doing its job
// — a task assigned, a milestone approved, a safeguarding report filed. Making
// each one import NotificationsModule adds ceremony without adding a boundary.
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
