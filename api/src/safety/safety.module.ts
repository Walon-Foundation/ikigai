import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller.js';
import { SafetyService } from './safety.service.js';

@Module({
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
