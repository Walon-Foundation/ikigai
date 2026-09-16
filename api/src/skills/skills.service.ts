import { BadRequestException, Injectable } from '@nestjs/common';
import { ActorService } from '../common/actor.service.js';
import {
  reviewMilestone,
  submitOwnMilestone,
} from './skill-tracks.helpers.js';

@Injectable()
export class SkillsService {
  constructor(private readonly actor: ActorService) {}

  /**
   * Submitting is the only move a mentee has on a milestone.
   *
   * completeMilestone() used to sit beside this and took a milestone straight
   * to 'done'. Under the programme rule that only a mentor presses complete,
   * that was the rule's single largest hole — and since the endpoint is public
   * whatever screen calls it, deleting the button would have left the hole. The
   * action itself had to go, and has not come back here.
   */
  async submitMilestone(userId: string, milestoneId: string) {
    const me = await this.actor.requireRole(userId, ['mentee']);
    if (!milestoneId) throw new BadRequestException('Invalid milestone');
    await submitOwnMilestone(milestoneId, me.id);
    return { ok: true };
  }

  async approveMilestone(userId: string, milestoneId: string) {
    const me = await this.actor.requireApprovedMentor(userId);
    if (!milestoneId) throw new BadRequestException('Invalid milestone');
    await reviewMilestone(milestoneId, me.id, 'approve', null);
    return { ok: true };
  }

  async requestRevision(
    userId: string,
    milestoneId: string,
    feedback: string,
  ) {
    const me = await this.actor.requireApprovedMentor(userId);
    if (!milestoneId) throw new BadRequestException('Invalid milestone');
    await reviewMilestone(
      milestoneId,
      me.id,
      'revise',
      feedback?.trim() || null,
    );
    return { ok: true };
  }
}
