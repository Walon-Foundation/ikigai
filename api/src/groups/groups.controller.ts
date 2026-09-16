import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { InternalAuthGuard } from '../auth/internal-auth.guard.js';
import { GroupsService } from './groups.service.js';

@Controller('groups')
@UseGuards(InternalAuthGuard)
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      interestTags?: string[];
      stage?: string;
    },
  ) {
    return this.groups.create(userId, body);
  }

  @Post(':id/join')
  join(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.groups.join(userId, id);
  }

  @Post(':id/messages')
  post(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { content: string },
  ) {
    return this.groups.postMessage(userId, { groupId: id, content: body.content });
  }
}
