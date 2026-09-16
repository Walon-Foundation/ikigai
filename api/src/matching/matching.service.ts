import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull } from 'drizzle-orm';
import { ActorService } from '../common/actor.service.js';
import { DATABASE } from '../db/database.module.js';
import type { Db } from '../db/db.js';
import { users } from '../db/schema.js';

/**
 * Suggestion score for the "mentors you might like" strip.
 *
 * NOTE this is NOT lib/match.ts's matchScore, and the difference is deliberate
 * rather than an oversight to be tidied away. matchScore records what a
 * mentorship WAS matched on and is written to mentorships.match_score at
 * request time — it must never move, or historical rows change meaning. This
 * one ranks candidates for display and uses Jaccard overlap so that a mentor
 * with fifty tags does not outrank a close fit simply by covering more ground.
 *
 * Collapsing the two would either rewrite history or make the suggestion list
 * worse. Keep them separate.
 */
function suggestionScore(userTags: string[], mentorTags: string[]): number {
  if (!userTags.length && !mentorTags.length) return 50;
  const a = new Set(userTags.map((t) => t.toLowerCase()));
  const b = new Set(mentorTags.map((t) => t.toLowerCase()));
  const intersection = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  const score = union === 0 ? 50 : Math.round((intersection / union) * 60 + 30);
  return Math.min(score, 99);
}

@Injectable()
export class MatchingService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly actor: ActorService,
  ) {}

  async suggestions(userId: string) {
    const me = await this.actor.get(userId);
    const myTags = me.interestTags ?? [];

    // Only mentors ikigai has approved are ever suggested — the same
    // (role, verifiedAt) pair the marketplace and the matcher select on.
    const verifiedMentors = await this.db
      .select({
        id: users.id,
        displayName: users.displayName,
        bio: users.bio,
        interestTags: users.interestTags,
      })
      .from(users)
      .where(and(eq(users.role, 'mentor'), isNotNull(users.verifiedAt)));

    const scored = verifiedMentors.map((m) => ({
      ...m,
      matchScore: suggestionScore(myTags, m.interestTags ?? []),
    }));
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return { matches: scored.slice(0, 5) };
  }
}
