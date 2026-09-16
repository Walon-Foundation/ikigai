import { Module } from '@nestjs/common';
import { CurriculumService } from './curriculum.service.js';
import { MentorshipController } from './mentorship.controller.js';
import { MentorshipService } from './mentorship.service.js';

@Module({
  controllers: [MentorshipController],
  providers: [MentorshipService, CurriculumService],
  exports: [MentorshipService, CurriculumService],
})
export class MentorshipModule {}
