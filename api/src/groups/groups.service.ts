import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { flagsConcern } from '../common/journal.js';
import type { SkillStage } from '../common/skill-stages.js';
import { SKILL_STAGES } from '../common/skill-stages.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { groupMembers, groups, messages, users } from '../db/schema.js';
import { dispatchMany } from '../notifications/internal/dispatch.js';
import { reserveClubSlug } from './clubs.helpers.js';

const MAX_NAME = 80;
const MAX_DESC = 500;
const MAX_MESSAGE = 2_000;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 40;

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

@Injectable()
export class GroupsService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  /**
   * Create a club.
   *
   * The club gets a slug and its own interest tags because it goes straight
   * onto the public website and into the recommendation engine — a club with no
   * tags can be found but is a club nobody is matched to.
   *
   * Its text runs through the same safeguarding keyword check the journal and
   * group messages use. Publication is automatic by programme rule, so nothing
   * stands between a mentee's typing and a public page; keywordFlag is what
   * puts a flagged one in front of the safeguarding team afterwards, and
   * hiddenAt is how they take it down.
   */
  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      interestTags?: string[];
      stage?: string;
    },
  ) {
    const me = await this.actor.get(userId);

    // Approved mentees only.
    //
    // This gate did not exist while a group was an internal thread only
    // signed-in users could see. It has to exist now, because creating one
    // publishes caller-controlled text to a public page on the charity's own
    // domain, linked from the site nav and the sitemap — and sign-up is
    // self-service, so "any authenticated user" means anyone on the internet
    // who filled in a form. The endpoint is reachable regardless of which
    // screen called it, so hiding a button was never a gate.
    //
    // Same standard as requesting a mentor: approved means an admin has looked
    // at this person. club_lead rides along because the rest of the app already
    // treats it as a mentee.
    if (me.role !== 'mentee' && me.role !== 'club_lead') {
      throw new ForbiddenException('Only mentees can start a club.');
    }
    if (!me.verifiedAt) {
      throw new ForbiddenException(
        "Your account is still being reviewed. You'll be able to start a club once the ikigai team approves it.",
      );
    }

    const name =
      typeof data.name === 'string' ? data.name.trim().slice(0, MAX_NAME) : '';
    if (!name) throw new BadRequestException('Group name is required');
    const description =
      typeof data.description === 'string'
        ? data.description.trim().slice(0, MAX_DESC) || null
        : null;

    const stage = SKILL_STAGES.includes(data.stage as SkillStage)
      ? (data.stage as SkillStage)
      : null;

    const [group] = await this.db
      .insert(groups)
      .values({
        name,
        slug: await reserveClubSlug(name),
        description,
        interestTags: boundedTags(data.interestTags),
        stage,
        createdBy: me.id,
        keywordFlag: flagsConcern(`${name} ${description ?? ''}`),
      })
      .returning({ id: groups.id });

    await this.db
      .insert(groupMembers)
      .values({ groupId: group.id, userId: me.id })
      .onConflictDoNothing();

    return { groupId: group.id };
  }

  async join(userId: string, groupId: string) {
    await this.db
      .insert(groupMembers)
      .values({ groupId, userId })
      .onConflictDoNothing();
    return { ok: true };
  }

  async postMessage(
    userId: string,
    data: { groupId: string; content: string },
  ) {
    const content =
      typeof data.content === 'string'
        ? data.content.trim().slice(0, MAX_MESSAGE)
        : '';
    if (!content) throw new BadRequestException('Empty message');

    // Must be a member to post.
    const [member] = await this.db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, data.groupId),
          eq(groupMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!member) throw new ForbiddenException('Join the group to post');

    await this.db.insert(messages).values({
      groupId: data.groupId,
      senderId: userId,
      content,
      keywordFlag: flagsConcern(content),
    });

    // Club chatter is the one thing here that could genuinely become spam, so
    // it is the most restrained notification in the system: low priority
    // (in-app only, never a push), a six-hour cooldown per person, and no
    // message preview. A busy club produces at most four of these a day, and a
    // member who does not want them can switch the Community category off.
    const [group] = await this.db
      .select({ name: groups.name })
      .from(groups)
      .where(eq(groups.id, data.groupId))
      .limit(1);

    if (group) {
      const members = await this.db
        .select({
          id: users.id,
          email: users.email,
          subscription: users.pushSubscription,
          prefs: users.notificationPrefs,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(
          and(
            eq(groupMembers.groupId, data.groupId),
            // Not the person who just posted.
            ne(groupMembers.userId, userId),
            isNull(users.deletedAt),
          ),
        );

      await dispatchMany(members, {
        key: 'COMMUNITY_UPDATE',
        vars: { group: group.name, groupId: data.groupId },
      });
    }

    return { ok: true };
  }
}
