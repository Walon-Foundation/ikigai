import { Module } from '@nestjs/common';
import { PurposeBookController } from './purpose-book.controller.js';
import { PurposeBookService } from './purpose-book.service.js';

@Module({
  controllers: [PurposeBookController],
  providers: [PurposeBookService],
  exports: [PurposeBookService],
})
export class PurposeBookModule {}
