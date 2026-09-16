import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type AssessmentDto,
  assessmentSchema,
  type MentorProfileDto,
  mentorProfileSchema,
  mentorVerificationSchema,
  type ParentProfileDto,
  parentLinkSchema,
  parentProfileSchema,
  type PersonalityDto,
  personalitySchema,
  type SelfAssignableRole,
  setRoleSchema,
  valuesSchema,
} from './onboarding.dto.js';
import { OnboardingService } from './onboarding.service.js';

// Every step returns { next } rather than redirecting. See NextStep in the DTOs:
// the Expo app has a navigator, not a URL bar, so the API decides the step and
// each client navigates in its own idiom.
@Controller('onboarding')
@UseGuards(InternalAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('role')
  setRole(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(setRoleSchema))
    body: { role: SelfAssignableRole },
  ) {
    return this.onboarding.setRole(userId, body.role);
  }

  @Post('mentee/assessment')
  saveAssessment(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(assessmentSchema)) body: AssessmentDto,
  ) {
    return this.onboarding.saveAssessment(userId, body);
  }

  @Post('mentee/values')
  saveValues(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(valuesSchema)) body: { valuesRanking: string[] },
  ) {
    return this.onboarding.saveValues(userId, body.valuesRanking);
  }

  @Post('mentee/personality')
  savePersonality(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(personalitySchema)) body: PersonalityDto,
  ) {
    return this.onboarding.savePersonality(userId, body);
  }

  @Post('mentee/complete')
  completeMentee(@CurrentUserId() userId: string) {
    return this.onboarding.completeMentee(userId);
  }

  @Post('mentor/profile')
  saveMentorProfile(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(mentorProfileSchema)) body: MentorProfileDto,
  ) {
    return this.onboarding.saveMentorProfile(userId, body);
  }

  @Post('mentor/verification')
  submitMentorVerification(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(mentorVerificationSchema))
    body: { personalStatement: string },
  ) {
    return this.onboarding.submitMentorVerification(
      userId,
      body.personalStatement,
    );
  }

  @Post('parent/profile')
  saveParentProfile(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(parentProfileSchema)) body: ParentProfileDto,
  ) {
    return this.onboarding.saveParentProfile(userId, body);
  }

  @Post('parent/link')
  saveParentLink(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(parentLinkSchema)) body: { childEmail: string },
  ) {
    return this.onboarding.saveParentLink(userId, body.childEmail);
  }
}
