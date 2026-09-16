import { Global, Module } from '@nestjs/common';
import { R2Service } from './r2.service.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

// Global because the admin module mints signed URLs for vetting documents, and
// the purge job deletes a departing user's files.
@Global()
@Module({
  controllers: [UploadsController],
  providers: [R2Service, UploadsService],
  exports: [R2Service, UploadsService],
})
export class UploadsModule {}
