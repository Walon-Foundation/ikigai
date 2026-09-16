import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type ConfirmUploadDto,
  confirmUploadSchema,
  type RequestUploadDto,
  requestUploadSchema,
} from './uploads.dto.js';
import { UploadsService } from './uploads.service.js';

/**
 * Two-step uploads, because the bytes must not pass through this process.
 *
 *   1. POST /uploads/request  — authorize, get a presigned PUT
 *   2. client PUTs the file straight to R2
 *   3. POST /uploads/confirm  — verify what was stored, then record it
 *
 * Step 3 is not bookkeeping: it is where the size cap is enforced, because a
 * presigned PUT cannot enforce one. Skip it and the file is in storage but
 * nothing points at it — which is the right failure mode.
 */
@Controller('uploads')
@UseGuards(InternalAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('request')
  request(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(requestUploadSchema)) body: RequestUploadDto,
  ) {
    return this.uploads.request(userId, body);
  }

  @Post('confirm')
  confirm(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(confirmUploadSchema)) body: ConfirmUploadDto,
  ) {
    return this.uploads.confirm(userId, body);
  }

  /** A short-lived signed URL for a private file. Admins, or the owner. */
  @Get('view')
  view(@CurrentUserId() userId: string, @Query('key') key: string) {
    return this.uploads.viewUrl(userId, key);
  }
}
