import { Body, Controller, Post } from '@nestjs/common';
import { EnquiriesService } from './enquiries.service.js';

/**
 * PUBLIC — no guard, deliberately.
 *
 * This is the marketing site's "get involved" form, submitted by people who do
 * not have accounts. It is the only unauthenticated write in the API, which is
 * why the service clamps every field and why this controller does nothing else.
 */
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  submit(@Body() body: { type: string; data: Record<string, string> }) {
    return this.enquiries.submit(body?.type ?? 'contact', body?.data ?? {});
  }
}
