import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { CmsService } from './cms.service.js';

/**
 * One controller for every CMS entity — see cms.registry.ts.
 *
 * Both guards, in order: the session guard establishes WHO, AdminGuard
 * establishes WHETHER. Never AdminGuard alone; it reads the user id the
 * session guard put on the request.
 */
@Controller('admin/cms/:resource')
@UseGuards(InternalAuthGuard, AdminGuard)
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Post()
  save(
    @Param('resource') resource: string,
    @Body() body: { id?: string | null; values: Record<string, string> },
  ) {
    return this.cms.save(resource, body.id ?? null, body.values ?? {});
  }

  @Delete(':id')
  remove(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cms.remove(resource, id);
  }

  @Post(':id/publish')
  togglePublish(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { published: boolean },
  ) {
    return this.cms.togglePublish(resource, id, body.published);
  }

  @Post(':id/move')
  move(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    return this.cms.move(resource, id, body.direction);
  }
}
