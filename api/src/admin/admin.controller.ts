import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { SiteContentService } from '../cms/site-content.service.js';
import { AdminGuard } from './admin.guard.js';
import { AdminNotificationsService } from './admin-notifications.service.js';
import { AdminOpsService } from './admin-ops.service.js';
import { VerificationService } from './verification.service.js';

/**
 * Everything behind the admin gate that is not the entity CMS (which is
 * registry-driven — see cms.controller.ts).
 *
 * Both guards, in order: the session guard establishes WHO, AdminGuard
 * establishes WHETHER. AdminGuard reads the user id the session guard put on
 * the request, so it is never used alone.
 */
@Controller('admin')
@UseGuards(InternalAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly verification: VerificationService,
    private readonly ops: AdminOpsService,
    private readonly notifications: AdminNotificationsService,
    private readonly content: SiteContentService,
  ) {}

  // ---- verification queues ----
  @Post('mentors/verify')
  verifyMentor(
    @Body()
    body: { mentorId: string; action: 'approved' | 'rejected'; reason?: string },
  ) {
    return this.verification.verifyMentor(body);
  }

  @Post('mentees/verify')
  verifyMentee(
    @Body()
    body: { menteeId: string; action: 'approved' | 'rejected'; reason?: string },
  ) {
    return this.verification.verifyMentee(body);
  }

  @Post('schools/vet')
  vetSchool(
    @Body() body: { schoolId: string; action: 'approved' | 'rejected' },
  ) {
    return this.verification.vetSchool(body);
  }

  @Post('reports/resolve')
  resolveReport(@Body() body: { reportId: string; adminNotes: string }) {
    return this.verification.resolveReport(body);
  }

  // ---- enquiries ----
  @Post('enquiries/:id/status')
  setEnquiryStatus(
    @CurrentUserId() adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.ops.setEnquiryStatus(adminId, id, body.status);
  }

  // ---- club moderation ----
  @Post('clubs/:id/visibility')
  setClubVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { hidden: boolean; reason?: string },
  ) {
    return this.ops.setClubVisibility({ clubId: id, ...body });
  }

  @Post('clubs/:id/clear-flag')
  clearClubFlag(@Param('id', ParseUUIDPipe) id: string) {
    return this.ops.clearClubFlag(id);
  }

  // ---- skills taxonomy ----
  @Post('skills/categories')
  saveSkillCategory(
    @Body() body: { id?: string | null; values: Record<string, string> },
  ) {
    return this.ops.saveSkillCategory(body.id ?? null, body.values ?? {});
  }

  @Delete('skills/categories/:id')
  removeSkillCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ops.removeSkillCategory(id);
  }

  @Post('skills/categories/:id/move')
  moveSkillCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    return this.ops.moveSkillCategory(id, body.direction);
  }

  @Post('skills/milestones')
  saveMilestoneTemplate(
    @Body()
    body: {
      categoryId: string;
      id?: string | null;
      values: Record<string, string>;
    },
  ) {
    return this.ops.saveMilestoneTemplate(
      body.categoryId,
      body.id ?? null,
      body.values ?? {},
    );
  }

  @Delete('skills/milestones/:id')
  removeMilestoneTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.ops.removeMilestoneTemplate(id);
  }

  // ---- events ----
  @Post('events')
  saveEvent(
    @CurrentUserId() adminId: string,
    @Body() body: { id?: string | null; values: Record<string, string> },
  ) {
    return this.ops.saveEvent(adminId, body.id ?? null, body.values ?? {});
  }

  @Delete('events/:id')
  removeEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.ops.removeEvent(id);
  }

  @Post('events/:id/publish')
  toggleEventPublish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { published: boolean },
  ) {
    return this.ops.toggleEventPublish(id, body.published);
  }

  @Post('events/:id/attendance')
  setAttendanceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId: string; status: string },
  ) {
    return this.ops.setAttendanceStatus(id, body.userId, body.status);
  }

  // ---- notifications ----
  @Post('notifications/broadcast')
  sendBroadcast(
    @Body()
    body: { title: string; body: string; audience: string; url?: string },
  ) {
    return this.notifications.sendBroadcast(body);
  }

  @Post('notifications/templates/:key')
  saveTemplate(
    @Param('key') key: string,
    @Body() body: { values: Record<string, string> },
  ) {
    return this.notifications.saveTemplate(key, body.values ?? {});
  }

  @Delete('notifications/templates/:key')
  resetTemplate(@Param('key') key: string) {
    return this.notifications.resetTemplate(key);
  }

  @Post('notifications/rules')
  saveRules(@Body() body: { values: Record<string, string> }) {
    return this.notifications.saveRules(body.values ?? {});
  }

  // ---- site + app copy, media, pages, page builder ----
  @Post('copy/site/:key')
  saveSiteCopy(
    @Param('key') key: string,
    @Body() body: { values: Record<string, string> },
  ) {
    return this.content.saveSiteCopy(key, body.values ?? {});
  }

  @Post('copy/app/:key')
  saveAppCopy(
    @Param('key') key: string,
    @Body() body: { values: Record<string, string> },
  ) {
    return this.content.saveAppCopy(key, body.values ?? {});
  }

  @Post('media')
  addMedia(@Body() body: { url: string; label: string }) {
    return this.content.addMedia(body.url, body.label);
  }

  @Delete('media/:id')
  removeMedia(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeMedia(id);
  }

  @Post('pages')
  savePage(
    @Body() body: { id?: string | null; values: Record<string, string> },
  ) {
    return this.content.savePage(body.id ?? null, body.values ?? {});
  }

  @Delete('pages/:id')
  removePage(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removePage(id);
  }

  @Post('pages/:id/publish')
  togglePagePublish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { published: boolean },
  ) {
    return this.content.togglePagePublish(id, body.published);
  }

  @Post('page-builder/blocks')
  addBlock(@Body() body: { page: string; type: string }) {
    return this.content.addBlock(body.page, body.type);
  }

  @Post('page-builder/blocks/:id/config')
  updateBlockConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { config: Record<string, string> },
  ) {
    return this.content.updateBlockConfig(id, body.config ?? {});
  }

  @Delete('page-builder/blocks/:id')
  removeBlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeBlock(id);
  }

  @Post('page-builder/blocks/:id/publish')
  toggleBlockPublish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { published: boolean },
  ) {
    return this.content.toggleBlockPublish(id, body.published);
  }

  @Post('page-builder/reorder')
  reorderBlocks(@Body() body: { orderedIds: string[] }) {
    return this.content.reorderBlocks(body.orderedIds ?? []);
  }
}
