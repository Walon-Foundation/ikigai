import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { PurposeBookService } from './purpose-book.service.js';

@Controller('purpose-book')
@UseGuards(InternalAuthGuard)
export class PurposeBookController {
  constructor(private readonly purposeBook: PurposeBookService) {}

  @Put('life-vision')
  saveLifeVision(
    @CurrentUserId() userId: string,
    @Body() body: { vision: string },
  ) {
    return this.purposeBook.saveLifeVision(userId, body?.vision);
  }
}
