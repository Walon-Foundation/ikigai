import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { MAX_PERSONAL_STATEMENT } from '../common/constants.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import {
  guardianLinks,
  mentorDocuments,
  milestones,
  users,
} from '../db/schema.js';
import {
  type AssessmentDto,
  MAX_BIO,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  type MentorProfileDto,
  type MentorVerificationRefusal,
  type NextStep,
  type ParentProfileDto,
  type PersonalityDto,
  REQUIRED_DOCUMENTS,
  type SelfAssignableRole,
} from './onboarding.dto.js';

type OnboardingData = {
  roleSelected?: boolean;
  assessment?: AssessmentDto;
  valuesRanking?: string[];
  personality?: PersonalityDto;
  purposeProfile?: {
    statement: string;
    interests: string[];
    values: string[];
    personalityLabel: string;
  };
  mentorProfile?: Omit<MentorProfileDto, 'bio'>;
  verificationSubmitted?: boolean;
  personalStatement?: string;
  parentProfile?: { relationship: string; phone: string };
  childEmail?: string;
  inviteCode?: string;
  childLinked?: boolean;
  linkSkipped?: boolean;
};

function boundedText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * interestTags feeds mentor↔mentee matching and renders as chips in the
 * marketplace. The vocabulary is open by design — the assessment lets a mentee
 * type an interest that is on no list — so this bounds rather than filters:
 * strings only, trimmed, length-capped, de-duplicated, count-capped.
 */
function boundedTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
        .filter(Boolean),
    ),
  ].slice(0, MAX_TAGS);
}

/**
 * How many outstanding guardian requests one parent may have.
 *
 * A guardian request renders inside the child's trusted app UI as "<name> wants
 * to be your guardian", with an Accept button, in front of someone who may be
 * 13. The consent gate itself is sound — nothing about the child is visible
 * until they accept — but the ABILITY TO ASK is what needs bounding, so an
 * adult cannot spray requests at addresses until one is tapped.
 */
const MAX_PENDING_GUARDIAN_REQUESTS = 5;

@Injectable()
export class OnboardingService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  private async getUser(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async patch(userId: string, patch: Partial<OnboardingData>) {
    const [user] = await this.db
      .select({ onboardingData: users.onboardingData })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const current = (user?.onboardingData as OnboardingData | null) ?? {};
    await this.db
      .update(users)
      .set({ onboardingData: { ...current, ...patch } })
      .where(eq(users.id, userId));
  }

  async setRole(
    userId: string,
    role: SelfAssignableRole,
  ): Promise<NextStep> {
    // Never overwrite an elevated role. Onboarding only ever moves an account
    // off the `mentee` default, so scoping the update to that state means
    // replaying this cannot strip an admin or an approved mentor of their role.
    await this.db
      .update(users)
      .set({ role })
      .where(and(eq(users.id, userId), eq(users.role, 'mentee')));
    await this.patch(userId, { roleSelected: true });

    if (role === 'mentee') return { next: '/onboarding/mentee/assessment' };
    if (role === 'mentor') return { next: '/onboarding/mentor/profile' };
    return { next: '/onboarding/parent/profile' };
  }

  async saveAssessment(
    userId: string,
    assessment: AssessmentDto,
  ): Promise<NextStep> {
    await this.patch(userId, { assessment });
    return { next: '/onboarding/mentee/values' };
  }

  async saveValues(
    userId: string,
    valuesRanking: string[],
  ): Promise<NextStep> {
    await this.patch(userId, { valuesRanking });
    return { next: '/onboarding/mentee/personality' };
  }

  async savePersonality(
    userId: string,
    personality: PersonalityDto,
  ): Promise<NextStep> {
    await this.patch(userId, { personality });
    return { next: '/onboarding/mentee/profile' };
  }

  async completeMentee(userId: string): Promise<NextStep> {
    const user = await this.getUser(userId);
    const data = (user.onboardingData as OnboardingData | null) ?? {};

    const interests = [
      ...(data.assessment?.love ?? []),
      ...(data.assessment?.opportunity ?? []),
    ].slice(0, 4);

    const values = data.valuesRanking?.slice(0, 3) ?? [];

    const pe = data.personality;
    const personalityLabel = pe
      ? [
          pe.introvertExtrovert <= 2
            ? 'Introverted'
            : pe.introvertExtrovert >= 4
              ? 'Extroverted'
              : 'Balanced',
          pe.creativeAnalytical <= 2
            ? 'Creative'
            : pe.creativeAnalytical >= 4
              ? 'Analytical'
              : 'Versatile',
        ].join(', ')
      : 'Growth-oriented';

    const community = data.assessment?.community?.[0] ?? 'community development';
    const topInterest = interests[0] ?? 'personal growth';

    const statement = `You are a ${personalityLabel.toLowerCase()} individual passionate about ${topInterest.toLowerCase()} and ${community.toLowerCase()}. You are driven by ${values[0]?.toLowerCase() ?? 'integrity'} and committed to making a meaningful impact.`;

    await this.patch(userId, {
      purposeProfile: { statement, interests, values, personalityLabel },
    });

    // Promote assessment tags to the real interestTags column — matching and
    // every mentor-facing view read users.interestTags, so leaving it empty
    // broke both.
    const interestTags = boundedTags([
      ...(data.assessment?.love ?? []),
      ...(data.assessment?.skills ?? []),
      ...(data.assessment?.community ?? []),
      ...(data.assessment?.opportunity ?? []),
    ]);
    await this.db
      .update(users)
      .set({ interestTags })
      .where(eq(users.id, userId));

    await this.db
      .insert(milestones)
      .values({ userId: user.id, type: 'purpose_quiz' })
      .onConflictDoNothing();

    return { next: '/dashboard' };
  }

  async saveMentorProfile(
    userId: string,
    data: MentorProfileDto,
  ): Promise<NextStep> {
    // Mirror expertise into interestTags so matching and the marketplace tag
    // chips have real data.
    //
    // Bounded, not allowlisted. The account module filters this same column
    // against INTEREST_TAGS, but that list is not the vocabulary these screens
    // offer — the mentor form has its own expertise tags and the mentee
    // assessment deliberately accepts typed-in interests. Allowlisting here
    // would silently discard almost every real answer. What this column cannot
    // carry is unbounded client input, since the matcher reads it and the
    // marketplace renders it, so the values are clamped instead.
    await this.db
      .update(users)
      .set({
        bio: boundedText(data.bio, MAX_BIO),
        interestTags: boundedTags(data.expertise),
      })
      .where(eq(users.id, userId));

    await this.patch(userId, {
      mentorProfile: {
        expertise: data.expertise,
        industry: data.industry,
        yearsExperience: data.yearsExperience,
        languages: data.languages,
        location: data.location,
      },
    });
    return { next: '/onboarding/mentor/verification' };
  }

  /**
   * A mentor's application is their personal statement plus their vetting
   * documents. Both documents are required, and required HERE: this endpoint is
   * reachable by anyone signed in, whatever screen called it, so a form check
   * guards the screen and this guards the application. An applicant cannot
   * arrive in the admin's review queue with nothing to review, or with a CV and
   * no proof of who wrote it.
   */
  async submitMentorVerification(
    userId: string,
    personalStatement: string,
  ): Promise<NextStep | MentorVerificationRefusal> {
    const user = await this.getUser(userId);

    // One query for both kinds rather than one per kind — this runs while the
    // applicant waits on the Submit button.
    const documents = await this.db
      .select({ kind: mentorDocuments.kind })
      .from(mentorDocuments)
      .where(
        and(
          eq(mentorDocuments.userId, user.id),
          inArray(mentorDocuments.kind, [...REQUIRED_DOCUMENTS]),
        ),
      );

    const held = new Set(documents.map((d) => d.kind));
    const missing = REQUIRED_DOCUMENTS.filter((kind) => !held.has(kind));
    if (missing.length > 0) return { ok: false, missing };

    await this.patch(userId, {
      verificationSubmitted: true,
      personalStatement: boundedText(
        personalStatement,
        MAX_PERSONAL_STATEMENT,
      ),
    });
    return { next: '/dashboard' };
  }

  async saveParentProfile(
    userId: string,
    data: ParentProfileDto,
  ): Promise<NextStep> {
    await this.db
      .update(users)
      .set({ displayName: data.displayName })
      .where(eq(users.id, userId));
    await this.patch(userId, {
      parentProfile: { relationship: data.relationship, phone: data.phone },
    });
    return { next: '/onboarding/parent/link' };
  }

  async saveParentLink(
    userId: string,
    childEmail: string,
  ): Promise<NextStep> {
    const parent = await this.getUser(userId);

    // Only a parent account may create guardian links. This endpoint is
    // reachable by any signed-in user regardless of which screen called it, so
    // the role is checked here rather than inferred from the caller.
    if (parent.role !== 'parent') throw new ForbiddenException('Forbidden');

    if (!childEmail) {
      // `linkSkipped`, not just `childLinked: false`. The app layout resumes
      // parent onboarding whenever neither childLinked nor inviteCode is set,
      // so recording only the negative sent a parent who tapped "Skip for now"
      // straight back to the page they skipped, with no other way out of
      // onboarding. This flag is what makes the skip terminal.
      await this.patch(userId, { childLinked: false, linkSkipped: true });
      return { next: '/parent-portal' };
    }

    const data = (parent.onboardingData as OnboardingData | null) ?? {};
    const relationship = data.parentProfile?.relationship ?? 'parent';

    const pending = await this.db
      .select({ id: guardianLinks.id })
      .from(guardianLinks)
      .where(
        and(
          eq(guardianLinks.parentId, parent.id),
          eq(guardianLinks.status, 'pending'),
        ),
      )
      .limit(MAX_PENDING_GUARDIAN_REQUESTS + 1);
    if (pending.length > MAX_PENDING_GUARDIAN_REQUESTS) {
      throw new BadRequestException(
        'You have too many pending guardian requests. Ask your child to accept one before sending another.',
      );
    }

    // Don't create a second link to the same email for this parent.
    const [existing] = await this.db
      .select({ id: guardianLinks.id })
      .from(guardianLinks)
      .where(
        and(
          eq(guardianLinks.parentId, parent.id),
          eq(guardianLinks.childEmail, childEmail),
        ),
      )
      .limit(1);

    if (!existing) {
      const [child] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, childEmail))
        .limit(1);

      // Created 'pending'. The child must accept before the parent can see
      // anything — consent is the gate.
      const inviteCode = child
        ? null
        : `IK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      await this.db.insert(guardianLinks).values({
        parentId: parent.id,
        childId: child?.id ?? null,
        childEmail,
        inviteCode,
        relationship,
        status: 'pending',
      });

      // Onboarding-gate flags only; real status lives in guardianLinks.
      await this.patch(userId, {
        childEmail,
        ...(inviteCode ? { inviteCode } : { childLinked: true }),
      });
    }

    return { next: '/parent-portal' };
  }
}
